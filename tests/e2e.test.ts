import test from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { prisma } from "../src/lib/prisma";
import { bootstrapAdmin } from "../src/lib/bootstrap";
import { createInvitation } from "../src/lib/invitations";

const PORT = 3010;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots", "local");
const E2E_EMAIL_PREFIX = "e2e-test-";

async function cleanupE2EArtifacts() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: E2E_EMAIL_PREFIX } },
    select: { id: true }
  });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await prisma.commentLike.deleteMany({ where: { userId: { in: ids } } });
    await prisma.commentReply.deleteMany({ where: { userId: { in: ids } } });
    await prisma.comment.deleteMany({ where: { userId: { in: ids } } });
    await prisma.danmaku.deleteMany({ where: { userId: { in: ids } } });
    await prisma.feedback.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userMovie.deleteMany({ where: { userId: { in: ids } } });
    await prisma.watchHistory.deleteMany({ where: { userId: { in: ids } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.follow.deleteMany({ where: { followerId: { in: ids } } });
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: { in: ids } },
          { actorEmail: { startsWith: E2E_EMAIL_PREFIX } },
          { targetId: { in: ids } }
        ]
      }
    });
    await prisma.accountInvitation.deleteMany({
      where: {
        OR: [
          { invitedById: { in: ids } },
          { acceptedById: { in: ids } },
          { normalizedEmail: { startsWith: E2E_EMAIL_PREFIX } }
        ]
      }
    });
    await prisma.passwordCredential.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.auditLog.deleteMany({
    where: { actorEmail: { startsWith: E2E_EMAIL_PREFIX } }
  });
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}

test("Moovie v4.2.1 End-to-End Playwright & API Verification", async (t) => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await cleanupE2EArtifacts();

  let serverProc: ChildProcess | null = null;
  const nextBin = path.join(process.cwd(), "node_modules", ".bin", "next");
  serverProc = spawn(nextBin, ["start", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NEXTAUTH_URL: BASE_URL
    },
    stdio: "pipe"
  });

  try {
    await waitForServer(BASE_URL, 35_000);

    await t.test("1. Operational & Public API Endpoints (/health, /ready, /sitemap.xml, /ads.txt, /api/*)", async () => {
      const healthRes = await fetch(`${BASE_URL}/health`);
      assert.equal(healthRes.status, 200);
      const healthJson = (await healthRes.json()) as { status: string };
      assert.equal(healthJson.status, "ok");

      const readyRes = await fetch(`${BASE_URL}/ready`);
      assert.equal(readyRes.status, 200);
      const readyJson = (await readyRes.json()) as { status: string };
      assert.equal(readyJson.status, "ready");

      const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
      assert.equal(sitemapRes.status, 200);
      const sitemapXml = await sitemapRes.text();
      assert.ok(sitemapXml.includes("<urlset") && sitemapXml.includes("/movie/26302614"));

      const adsRes = await fetch(`${BASE_URL}/ads.txt`);
      assert.equal(adsRes.status, 200);

      const tvboxRes = await fetch(`${BASE_URL}/api/tvbox.json`);
      assert.equal(tvboxRes.status, 200);
      const tvboxJson = (await tvboxRes.json()) as { sites: unknown[] };
      assert.ok(Array.isArray(tvboxJson.sites) && tvboxJson.sites.length >= 1);

      const vodRes = await fetch(`${BASE_URL}/api/vod?wd=${encodeURIComponent("请回答1988")}`);
      assert.equal(vodRes.status, 200);
      const vodJson = (await vodRes.json()) as { list: unknown[] };
      assert.ok(Array.isArray(vodJson.list) && vodJson.list.length >= 1);

      const suggestRes = await fetch(
        `${BASE_URL}/api/v2/media/suggest?q=${encodeURIComponent("请回答1988")}`
      );
      assert.equal(suggestRes.status, 200);
      const suggestJson = (await suggestRes.json()) as unknown[];
      assert.ok(Array.isArray(suggestJson) && suggestJson.length >= 1);

      const foryouRes = await fetch(`${BASE_URL}/api/htmx/foryou`);
      assert.equal(foryouRes.status, 200);
      const foryouJson = (await foryouRes.json()) as { ok: boolean; items: unknown[] };
      assert.ok(foryouJson.ok && Array.isArray(foryouJson.items) && foryouJson.items.length >= 1);

      const danmakuRes = await fetch(`${BASE_URL}/api/danmaku?vodId=26302614&ep=1`);
      assert.equal(danmakuRes.status, 200);

      const adMatchRes = await fetch(
        `${BASE_URL}/api/ad-fingerprints/match?sourceKey=ffzy&vodId=26302614-ffzy`
      );
      assert.equal(adMatchRes.status, 200);
    });

    const browser = await chromium.launch({ headless: true });

    try {
      await t.test("2. Public Discovery, Playback, Community & Tooling Routes + Responsive Screenshots", async () => {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 }
        });
        const page = await context.newPage();

        // Homepage Desktop
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        const title = await page.title();
        assert.ok(title.includes("Moovie"), `Expected Moovie in title, got: ${title}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-home-desktop.png") });

        // Homepage Mobile Responsive
        const mobileContext = await browser.newContext({
          viewport: { width: 375, height: 812 }
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "02-home-mobile.png") });
        await mobileContext.close();

        // Multi-source Search
        await page.goto(`${BASE_URL}/search?q=${encodeURIComponent("请回答1988")}`, { waitUntil: "networkidle" });
        const searchBody = await page.textContent("body");
        assert.ok(searchBody?.includes("请回答1988"), "Search results should include 请回答1988");
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-search.png") });

        // Discover Hub & Category
        await page.goto(`${BASE_URL}/discover`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-discover.png") });

        await page.goto(`${BASE_URL}/discover/movie`, { waitUntil: "networkidle" });
        assert.ok((await page.textContent("body"))?.includes("电影"));

        // Trends, ForYou, Lists, Cinema
        await page.goto(`${BASE_URL}/trends`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-trends.png") });

        await page.goto(`${BASE_URL}/foryou`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-foryou.png") });

        await page.goto(`${BASE_URL}/list`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-list.png") });

        await page.goto(`${BASE_URL}/list/selected-11`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-list-detail.png") });

        await page.goto(`${BASE_URL}/cinema`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-cinema.png") });

        // Movie Detail, Unified Watch Player, Direct Source Play, Similar
        await page.goto(`${BASE_URL}/movie/26302614`, { waitUntil: "networkidle" });
        assert.ok((await page.textContent("body"))?.includes("请回答1988"));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-movie-detail.png") });

        await page.goto(`${BASE_URL}/watch/26302614`, { waitUntil: "networkidle" });
        assert.ok((await page.locator("#sourcePanelTop").count()) > 0, "Should render top source switcher #sourcePanelTop");
        assert.ok((await page.locator("#sourcePanel").count()) > 0, "Should render bottom source panel #sourcePanel");
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-watch-player.png") });

        await page.goto(`${BASE_URL}/play/ffzy/26302614-ffzy?ep=1`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12-play-source.png") });

        await page.goto(`${BASE_URL}/similar/26302614`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "13-similar.png") });

        // Community: Review Detail, Feed, Public Cinephile Profile
        await page.goto(`${BASE_URL}/review/925`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "14-review-detail.png") });

        await page.goto(`${BASE_URL}/feed`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "15-feed.png") });

        await page.goto(`${BASE_URL}/user/1102`, { waitUntil: "networkidle" });
        assert.ok((await page.textContent("body"))?.includes("Serein"));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "16-user-profile.png") });

        // Tooling & Ecosystem: Player, IPTV, TVBox, Changelog, Feedback, Static Pages
        await page.goto(`${BASE_URL}/player`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "17-player.png") });

        await page.goto(`${BASE_URL}/iptv`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "18-iptv.png") });

        await page.goto(`${BASE_URL}/tvbox`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "19-tvbox.png") });

        await page.goto(`${BASE_URL}/changelog`, { waitUntil: "networkidle" });
        assert.ok((await page.textContent("body"))?.includes("v4.2.1"));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "20-changelog.png") });

        await page.goto(`${BASE_URL}/feedback`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "21-feedback.png") });

        for (const staticPath of ["/about", "/privacy", "/terms", "/dmca", "/advertise"]) {
          const resp = await page.goto(`${BASE_URL}${staticPath}`, { waitUntil: "networkidle" });
          assert.equal(resp?.status(), 200, `Expected 200 on ${staticPath}`);
        }

        await context.close();
      });

      await t.test("3. Invite-Only Registration, Admin Console, RBAC & Single-Use Invite E2E Flow", async () => {
        // Bootstrap an admin via CLI library
        const adminEmail = `${E2E_EMAIL_PREFIX}admin@moovie.local`;
        const adminPassword = "AdminPassword123!";
        const { user: adminUser } = await bootstrapAdmin({
          email: adminEmail,
          password: adminPassword,
          name: "E2EAdmin"
        });

        // Create a single-use invitation for a VIEWER user
        const viewerEmail = `${E2E_EMAIL_PREFIX}viewer@moovie.local`;
        const { code: inviteCode } = await createInvitation({
          invitedById: adminUser.id,
          invitedByEmail: adminUser.email,
          email: viewerEmail,
          role: "VIEWER",
          expiresInHours: 48,
          note: "E2E Playwright Viewer Invite"
        });

        // 3a. Admin logs in and views /admin, /dashboard, /dashboard/settings
        const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const adminPage = await adminContext.newPage();

        await adminPage.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
        await adminPage.fill('input[type="email"]', adminEmail);
        await adminPage.fill('input[type="password"]', adminPassword);
        await Promise.all([
          adminPage.waitForURL((u) => !u.pathname.includes("/auth/login"), { timeout: 15_000 }),
          adminPage.click('button[type="submit"]')
        ]);

        await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
        const adminText = await adminPage.textContent("body");
        assert.ok(adminText?.includes(inviteCode), "Admin console should list generated invitation code");
        await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "22-admin-console.png") });

        await adminPage.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
        await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "23-dashboard.png") });

        await adminPage.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "networkidle" });
        await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "24-settings.png") });

        await adminContext.close();

        // 3b. Invited Viewer visits /invite/[code] and completes registration at /auth/register
        const viewerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const viewerPage = await viewerContext.newPage();

        await viewerPage.goto(`${BASE_URL}/invite/${inviteCode}`, { waitUntil: "networkidle" });
        assert.ok(
          viewerPage.url().includes(`/auth/register?invite=${inviteCode}`),
          "Valid /invite/[code] should redirect to /auth/register?invite=[code]"
        );
        const registerPageText = await viewerPage.textContent("body");
        assert.ok(registerPageText?.includes("受邀注册"), "Register page should show invite-only title");
        await viewerPage.screenshot({ path: path.join(SCREENSHOT_DIR, "25-invite-landing.png") });

        // Register via API to verify HTTP status & response contract, then sign in via UI
        const regRes = await viewerPage.request.post(`${BASE_URL}/api/auth/register`, {
          data: {
            inviteCode,
            email: viewerEmail,
            username: "E2EViewer",
            password: "ViewerPassword123!",
            isPublic: true
          }
        });
        assert.equal(regRes.status(), 201, "Invite registration should return 201 Created");

        // Verify /invite/[code] now displays ACCEPTED (single-use)
        await viewerPage.goto(`${BASE_URL}/invite/${inviteCode}`, { waitUntil: "networkidle" });
        const usedInviteText = await viewerPage.textContent("body");
        assert.ok(usedInviteText?.includes("已被使用"), "Redeemed invite must show 已被使用");
        await viewerPage.screenshot({ path: path.join(SCREENSHOT_DIR, "26-invite-used-blocked.png") });

        // Sign in as Viewer and verify RBAC blocks /admin
        await viewerPage.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
        await viewerPage.fill('input[type="email"]', viewerEmail);
        await viewerPage.fill('input[type="password"]', "ViewerPassword123!");
        await Promise.all([
          viewerPage.waitForURL((u) => !u.pathname.includes("/auth/login"), { timeout: 15_000 }),
          viewerPage.click('button[type="submit"]')
        ]);

        // Viewer accessing /api/admin/users must receive 403
        const forbiddenRes = await viewerPage.request.get(`${BASE_URL}/api/admin/users`);
        assert.equal(forbiddenRes.status(), 403, "VIEWER role must receive 403 on /api/admin/users");

        // 3c. Exercise Multi-Feature Interactive Combinations as Authenticated Viewer
        const comboDir = path.join(SCREENSHOT_DIR, "combinations");
        fs.mkdirSync(comboDir, { recursive: true });

        // Combo A: Homepage Autocomplete + Keyboard Navigation + Recent Searches + Today Updates
        await viewerPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        await viewerPage.fill("#searchInput", "甄嬛");
        await viewerPage.waitForSelector("#searchSuggestions .suggestion-item", { timeout: 8_000 });
        await viewerPage.keyboard.press("ArrowDown");
        const activeSugCount = await viewerPage.locator("#searchSuggestions .suggestion-item.active").count();
        assert.equal(activeSugCount, 1, "Keyboard ArrowDown should highlight first autocomplete suggestion");
        await viewerPage.screenshot({ path: path.join(comboDir, "01-home-autocomplete-keyboard.png") });

        // Press Escape to close dropdown, submit search, then return home to verify #recentSearches
        await viewerPage.keyboard.press("Escape");
        await Promise.all([
          viewerPage.waitForURL((u) => u.pathname.includes("/search"), { timeout: 10_000 }),
          viewerPage.click("#searchForm button[type='submit']")
        ]);
        // Search page dual section (媒体库收录 .library-card + 播放源结果 .result-item) & source filter pills
        const sourcePills = await viewerPage.locator(".source-filter-pills .source-pill").count();
        assert.ok(sourcePills >= 2, "Search page should render source filter pills");
        assert.ok(
          (await viewerPage.locator(".library-section .library-card").count()) >= 1,
          "Search page should render 媒体库收录 (.library-card)"
        );
        assert.ok(
          (await viewerPage.locator(".source-results-section .result-item").count()) >= 1,
          "Search page should render 播放源结果 (.result-item)"
        );
        await viewerPage.screenshot({ path: path.join(comboDir, "02-search-source-filter-pills.png") });

        await viewerPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        assert.ok((await viewerPage.locator("#recentSearches").count()) > 0, "Recent searches should appear on home");

        // Combo B: Movie Detail (甄嬛传 6922792) -> Cast Expand + Backdrops Lightbox + Wish + Mark-Watched Modal (5 score chips + comment)
        await viewerPage.goto(`${BASE_URL}/movie/6922792`, { waitUntil: "networkidle" });
        const castDetails = viewerPage.locator("details.movie-cast-details");
        if ((await castDetails.count()) > 0) {
          await castDetails.locator("summary").click();
          const isOpen = await castDetails.evaluate((el) => (el as HTMLDetailsElement).open);
          assert.equal(isOpen, true, "Clicking cast summary should expand full cast list");
        }

        // Open Backdrops Lightbox, step next, verify counter, close with Escape
        const firstBackdrop = viewerPage.locator(".backdrops-grid .backdrop-item").first();
        assert.ok((await firstBackdrop.count()) > 0, "Movie detail should render backdrops grid");
        await firstBackdrop.click();
        await viewerPage.waitForSelector("#backdropLightbox.active", { timeout: 5_000 });
        await viewerPage.screenshot({ path: path.join(comboDir, "03-movie-backdrop-lightbox.png") });
        const nextBtn = viewerPage.locator("#backdropLightbox .lightbox-next");
        if ((await nextBtn.count()) > 0) {
          await nextBtn.click();
          const counterText = await viewerPage.locator("#lightboxCounter").textContent();
          assert.ok(counterText?.includes("2 /"), `Expected lightbox counter to advance to 2, got ${counterText}`);
        }
        await viewerPage.keyboard.press("Escape");
        assert.equal(await viewerPage.locator("#backdropLightbox").count(), 0, "Escape should close backdrop lightbox");

        // Toggle Wish -> Open Mark-Watched Modal -> Select 5分 力荐 -> Submit comment
        await viewerPage.click("#wish-btn");
        await viewerPage.waitForTimeout(300);
        await viewerPage.click("#watched-btn");
        await viewerPage.waitForSelector("#mark-watched-modal", { timeout: 5_000 });
        await viewerPage.click('#mark-watched-modal .score-chip[data-score="5"]');
        await viewerPage.fill("#watched-comment", "甄嬛传百看不厌，服化道与台词皆是巅峰！");
        await viewerPage.screenshot({ path: path.join(comboDir, "04-movie-mark-watched-modal.png") });
        await viewerPage.click("#mark-watched-modal .action-modal-submit");
        await viewerPage.waitForTimeout(600);
        assert.equal(await viewerPage.locator("#mark-watched-modal").count(), 0, "Modal should close after saving");

        // Combo C: Watch Page (甄嬛传 76 episodes) -> >30 Episode Folding + Expand All + Top/Bottom Source Switcher + Failover Overlay + Ad-Skip + Danmaku + One-Click Fail Report
        await viewerPage.goto(`${BASE_URL}/watch/6922792`, { waitUntil: "networkidle" });
        const collapsedBtns = await viewerPage.locator("#episodesGrid .episode-btn").count();
        const expandEpBtn = viewerPage.locator(".episode-expand-btn");
        assert.ok((await expandEpBtn.count()) > 0, "76-episode series should show .episode-expand-btn");
        assert.ok(collapsedBtns < 76, `Expected <76 episodes when collapsed, got ${collapsedBtns}`);
        await expandEpBtn.click();
        const expandedBtns = await viewerPage.locator("#episodesGrid .episode-btn").count();
        assert.equal(expandedBtns, 76, "Clicking expand button should reveal all 76 episodes");
        await viewerPage.screenshot({ path: path.join(comboDir, "05-watch-76-episodes-expanded.png") });

        // Navigate to next episode via #episode-navigation
        await viewerPage.click("#episode-navigation .episode-nav-next");
        const navCurr = await viewerPage.locator("#episode-navigation .episode-nav-current").textContent();
        assert.ok(navCurr?.includes("02") || navCurr?.includes("2"), "Next episode button should switch to episode 2");

        // Open Top Floating Source Switcher & Failover Alternatives Overlay
        await viewerPage.click("#sourceButtonTop");
        await viewerPage.screenshot({ path: path.join(comboDir, "06-watch-top-source-switcher.png") });
        await viewerPage.click("#triggerFailoverBtn");
        await viewerPage.waitForSelector(".failover-alternatives", { timeout: 5_000 });
        await viewerPage.screenshot({ path: path.join(comboDir, "07-watch-failover-candidates.png") });
        await viewerPage.locator(".failover-alternatives .failover-alt-btn").first().click();

        // Send Danmaku, Ad-Skip Tooltip & One-Click Playback Failure Feedback
        await viewerPage.click("#ad-skip-help-btn");
        assert.ok(
          (await viewerPage.locator(".ad-skip-tooltip").count()) === 1,
          "Clicking #ad-skip-help-btn should reveal .ad-skip-tooltip"
        );
        assert.ok(
          (await viewerPage.locator(".backdrops-grid .backdrop-item").count()) >= 1,
          "Merged Watch page should include embedded TMDB backdrops gallery (.backdrops-grid)"
        );
        await viewerPage.fill('.danmaku-bar input[type="text"]', "前方高能名场面打卡！");
        await viewerPage.click('.danmaku-bar button[type="submit"]');
        await viewerPage.click("#reportPlaybackFailBtn");
        await viewerPage.waitForTimeout(300);
        const failBtnText = await viewerPage.locator("#reportPlaybackFailBtn").textContent();
        assert.ok(failBtnText?.includes("已上报"), "One-click playback failure button should confirm report");

        // Verify Playback Candidates V2 API & V2 Outbox History Sync API directly
        const candRes = await viewerPage.request.get(
          `${BASE_URL}/api/v2/media-units/6922792_2/playback-candidates?ep=2`
        );
        assert.equal(candRes.status(), 200);
        const candJson = (await candRes.json()) as { candidates: unknown[] };
        assert.ok(Array.isArray(candJson.candidates) && candJson.candidates.length >= 1);

        const syncOutboxRes = await viewerPage.request.post(`${BASE_URL}/api/v2/history/sync`, {
          data: {
            device_id: "e2e-playwright-device",
            cursor: 0,
            operations: [
              {
                operation_id: "op_e2e_1",
                device_seq: 1,
                type: "upsert",
                douban_id: "6922792",
                source_key: "ffzy",
                vod_id: "6922792-ffzy",
                episode: 2,
                episode_key: "第02集",
                position_seconds: 640,
                duration_seconds: 2700,
                title: "甄嬛传"
              }
            ]
          }
        });
        assert.equal(syncOutboxRes.status(), 200);
        const syncOutboxJson = (await syncOutboxRes.json()) as { synced: number; changes: unknown[] };
        assert.equal(syncOutboxJson.synced, 1);
        assert.ok(Array.isArray(syncOutboxJson.changes) && syncOutboxJson.changes.length === 1);

        // Verify Continue Watching card appears on Homepage with progress bar
        await viewerPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        assert.ok(
          (await viewerPage.locator("#continueWatching .progress-bar").count()) > 0,
          "Homepage #continueWatching should render synced item with .progress-bar"
        );
        await viewerPage.screenshot({ path: path.join(comboDir, "08-home-continue-watching-synced.png") });

        // Combo D: IPTV Channel Search + Group Filter + Favorite Toggle
        await viewerPage.goto(`${BASE_URL}/iptv`, { waitUntil: "networkidle" });
        await viewerPage.fill("#iptv-channel-search", "CCTV");
        await viewerPage.screenshot({ path: path.join(comboDir, "09-iptv-channel-search.png") });

        await viewerContext.close();
      });
    } finally {
      await browser.close();
    }
  } finally {
    try {
      await cleanupE2EArtifacts();
    } finally {
      if (serverProc) {
        serverProc.kill("SIGTERM");
      }
    }
  }

  await t.test("4. Database returned to zero demo user accounts at rest", async () => {
    const remainingUsers = await prisma.user.count();
    assert.equal(remainingUsers, 0, "Zero user accounts must remain in database after E2E cleanup");
  });
});
