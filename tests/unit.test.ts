import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  passwordPolicyError,
  hashToken
} from "../src/lib/passwords";
import { bootstrapAdmin } from "../src/lib/bootstrap";
import {
  createInvitation,
  inspectInvitation,
  registerWithInvitation,
  revokeInvitation
} from "../src/lib/invitations";
import { writeAuditLog, listAuditLogs } from "../src/lib/audit";

const TEST_EMAIL_PREFIX = "unit-test-";

async function cleanupTestArtifacts() {
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: TEST_EMAIL_PREFIX } },
        { email: { startsWith: "e2e-test-" } }
      ]
    },
    select: { id: true }
  });
  const ids = testUsers.map((u) => u.id);
  if (ids.length > 0) {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: { in: ids } },
          { actorEmail: { startsWith: TEST_EMAIL_PREFIX } },
          { targetId: { in: ids } }
        ]
      }
    });
    await prisma.accountInvitation.deleteMany({
      where: {
        OR: [
          { invitedById: { in: ids } },
          { acceptedById: { in: ids } },
          { normalizedEmail: { startsWith: TEST_EMAIL_PREFIX } }
        ]
      }
    });
    await prisma.passwordCredential.deleteMany({
      where: { userId: { in: ids } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: ids } }
    });
  }
  await prisma.accountInvitation.deleteMany({
    where: { code: { startsWith: "mv_inv_expired_unit" } }
  });
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { targetId: { startsWith: "unit-test" } },
        { actorEmail: { startsWith: TEST_EMAIL_PREFIX } }
      ]
    }
  });
}

test("Moovie v4.2.1 Unit & Integration Suite", async (t) => {
  await cleanupTestArtifacts();

  await t.test("1. Zero demo user accounts exist in seeded database at rest", async () => {
    const userCount = await prisma.user.count();
    assert.equal(userCount, 0, "Database must contain zero demo user accounts at rest");

    const movieCount = await prisma.movie.count();
    assert.ok(movieCount >= 12, "Catalog movies must be seeded");

    const profileCount = await prisma.cinephileProfile.count();
    assert.ok(profileCount >= 3, "Public non-login Cinephile profiles must be seeded");
  });

  await t.test("2. Password policy validation and scrypt hashing", async () => {
    assert.ok(passwordPolicyError("short"), "Should reject password < 6 chars");
    assert.equal(passwordPolicyError("SecurePass123!"), null, "Should accept valid password");

    const hash = await hashPassword("SecurePass123!");
    assert.ok(hash.startsWith("scrypt$"), "Should use scrypt format");
    assert.equal(await verifyPassword("SecurePass123!", hash), true);
    assert.equal(await verifyPassword("WrongPass123!", hash), false);
  });

  await t.test("3. CLI Admin bootstrap provisions or promotes ADMIN account with audit log", async () => {
    const res = await bootstrapAdmin({
      email: `${TEST_EMAIL_PREFIX}admin@moovie.local`,
      name: "UnitAdmin",
      password: "AdminPassword123!"
    });

    assert.equal(res.created, true);
    assert.equal(res.user.role, "ADMIN");
    assert.equal(res.user.status, "ACTIVE");
    assert.equal(res.user.email, `${TEST_EMAIL_PREFIX}admin@moovie.local`);
  });

  await t.test("4. Single-use expiring invitation creation, validation, redemption, and replay prevention", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: `${TEST_EMAIL_PREFIX}admin@moovie.local` }
    });

    const { invitation, code } = await createInvitation({
      invitedById: admin.id,
      invitedByEmail: admin.email,
      email: `${TEST_EMAIL_PREFIX}editor@moovie.local`,
      role: "EDITOR",
      expiresInHours: 24,
      note: "Unit test editor invite"
    });

    assert.ok(code.startsWith("mv_inv_"));
    assert.equal(invitation.status, "PENDING");
    assert.equal(invitation.role, "EDITOR");

    const checkValid = await inspectInvitation(code);
    assert.equal(checkValid.valid, true);
    assert.equal(checkValid.status, "PENDING");

    // Missing invite code must fail
    await assert.rejects(
      async () => {
        await registerWithInvitation({
          inviteCode: "",
          email: `${TEST_EMAIL_PREFIX}editor@moovie.local`,
          username: "UnitEditor",
          password: "EditorPass123!"
        });
      },
      /邀请制注册/
    );

    // Email mismatch should fail when invitation is bound to a specific email
    await assert.rejects(
      async () => {
        await registerWithInvitation({
          inviteCode: code,
          email: `${TEST_EMAIL_PREFIX}wrong@moovie.local`,
          username: "WrongUser",
          password: "EditorPass123!"
        });
      },
      /绑定特定邮箱/
    );

    // Redeem with matching email
    const newUser = await registerWithInvitation({
      inviteCode: code,
      email: `${TEST_EMAIL_PREFIX}editor@moovie.local`,
      username: "UnitEditor",
      password: "EditorPass123!",
      ipAddress: "127.0.0.1"
    });

    assert.equal(newUser.role, "EDITOR");
    assert.equal(newUser.status, "ACTIVE");

    // Verify single-use replay rejection
    const checkUsed = await inspectInvitation(code);
    assert.equal(checkUsed.valid, false);
    assert.equal(checkUsed.status, "ACCEPTED");

    await assert.rejects(
      async () => {
        await registerWithInvitation({
          inviteCode: code,
          email: `${TEST_EMAIL_PREFIX}editor2@moovie.local`,
          username: "ReplayUser",
          password: "EditorPass123!"
        });
      },
      /已被使用/
    );
  });

  await t.test("5. Invitation revocation and expiration enforcement", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: `${TEST_EMAIL_PREFIX}admin@moovie.local` }
    });

    const { invitation: revocableInvite, code: revocableCode } = await createInvitation({
      invitedById: admin.id,
      invitedByEmail: admin.email,
      role: "VIEWER",
      expiresInHours: 48
    });

    const revoked = await revokeInvitation({
      id: revocableInvite.id,
      actorId: admin.id,
      actorEmail: admin.email
    });
    assert.equal(revoked.status, "REVOKED");

    const checkRevoked = await inspectInvitation(revocableCode);
    assert.equal(checkRevoked.valid, false);
    assert.equal(checkRevoked.status, "REVOKED");

    // Create an already-expired invitation and verify automatic expiration state transition
    const expiredCode = "mv_inv_expired_unit_test_token_0001";
    await prisma.accountInvitation.create({
      data: {
        code: expiredCode,
        tokenHash: hashToken(expiredCode),
        role: "VIEWER",
        status: "PENDING",
        expiresAt: new Date(Date.now() - 60_000),
        invitedById: admin.id
      }
    });

    const checkExpired = await inspectInvitation(expiredCode);
    assert.equal(checkExpired.valid, false);
    assert.equal(checkExpired.status, "EXPIRED");
  });

  await t.test("6. Immutable Audit Log records security events", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: `${TEST_EMAIL_PREFIX}admin@moovie.local` }
    });

    await writeAuditLog({
      action: "USER_REVOKED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "User",
      targetId: "unit-test-target",
      metadata: { reason: "Security verification" },
      ipAddress: "127.0.0.1"
    });

    const logs = await listAuditLogs(50);
    const testLogs = logs.filter(
      (l) => l.actorId === admin.id || l.actorEmail?.startsWith(TEST_EMAIL_PREFIX)
    );
    assert.ok(
      testLogs.length >= 4,
      "Should record bootstrap, invitation creation, revocation, and user revocation logs"
    );
  });

  await cleanupTestArtifacts();

  await t.test("7. Post-cleanup verification confirms zero demo user accounts remain", async () => {
    const finalUserCount = await prisma.user.count();
    assert.equal(finalUserCount, 0, "Database must return to 0 user accounts after cleanup");
  });
});
