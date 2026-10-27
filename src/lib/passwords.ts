import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;
const KEY_LENGTH = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_PREFIX = 'scrypt';

export class AdmissionError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AdmissionError';
    this.status = status;
    this.code = code;
  }
}

export function createInviteToken(): string {
  return `mv_inv_${randomBytes(18).toString('base64url')}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim(), 'utf8').digest('base64url');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const at = normalized.indexOf('@');
  return (
    normalized.length >= 3 &&
    normalized.length <= 320 &&
    at > 0 &&
    at === normalized.lastIndexOf('@') &&
    at < normalized.length - 1 &&
    !/\s/.test(normalized)
  );
}

export function passwordPolicyError(password: string): string | null {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `密码长度至少为 ${PASSWORD_MIN_LENGTH} 位`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `密码长度不能超过 ${PASSWORD_MAX_LENGTH} 位`;
  }
  return null;
}

function derivePassword(
  password: string,
  salt: Buffer,
  params = { n: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: params.n, r: params.r, p: params.p },
      (err, derived) => {
        if (err) reject(err);
        else resolve(derived);
      }
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const err = passwordPolicyError(password);
  if (err) {
    throw new AdmissionError(400, 'invalid_password', err);
  }
  const salt = randomBytes(16);
  const hash = await derivePassword(password, salt);
  return [
    SCRYPT_PREFIX,
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  encoded: string | null | undefined
): Promise<boolean> {
  if (!encoded || !password) return false;
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== SCRYPT_PREFIX) return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) return false;
  try {
    const salt = Buffer.from(parts[4], 'base64url');
    const expected = Buffer.from(parts[5], 'base64url');
    if (salt.length < 16 || expected.length !== KEY_LENGTH) return false;
    const actual = await derivePassword(password, salt, { n, r, p });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
