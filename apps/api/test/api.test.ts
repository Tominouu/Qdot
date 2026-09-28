import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { QRCode, QRCodeAnalytics } from "@qdot/types";
import { client, STYLE, startTestApi, UA } from "./helpers";

let api: Awaited<ReturnType<typeof startTestApi>>;
before(async () => {
  api = await startTestApi();
});
after(async () => {
  await api.stop();
});

const errorCode = (res: { json: () => unknown }) => (res.json() as { error: { code: string } }).error.code;

describe("health", () => {
  test("GET /health", async () => {
    const res = await api.app.inject({ method: "GET", url: "/health" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { status: "ok" });
  });
});

describe("auth", () => {
  test("register, me, logout, login", async () => {
    const c = client(api.app);
    const reg = await c.post("/auth/register", { email: "Jamie@Bistro.example", password: "correct-horse" });
    assert.equal(reg.statusCode, 201);
    assert.equal(reg.json().user.email, "jamie@bistro.example");
    assert.equal(reg.json().user.name, "Jamie");
    const setCookie = String(reg.headers["set-cookie"]);
    assert.match(setCookie, /qdot_session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.equal(JSON.stringify(reg.json()).includes("password"), false, "never returns password data");

    assert.equal((await c.get("/auth/me")).statusCode, 200);
    assert.equal((await c.post("/auth/logout")).statusCode, 204);
    assert.equal((await c.get("/auth/me")).statusCode, 401);

    const bad = await c.post("/auth/login", { email: "jamie@bistro.example", password: "nope-nope" });
    assert.equal(bad.statusCode, 401);
    assert.equal(errorCode(bad), "INVALID_CREDENTIALS");
    const unknown = await c.post("/auth/login", { email: "ghost@bistro.example", password: "whatever1" });
    assert.equal(errorCode(unknown), "INVALID_CREDENTIALS", "same error for unknown email");

    const ok = await c.post("/auth/login", { email: "JAMIE@bistro.example", password: "correct-horse" });
    assert.equal(ok.statusCode, 200);
    assert.equal((await c.get("/auth/me")).json().user.email, "jamie@bistro.example");
  });

  test("duplicate email, validation errors, tampered cookie", async () => {
    const c = client(api.app);
    await c.post("/auth/register", { email: "dup@qdot.test", password: "password123" });
    const dup = await client(api.app).post("/auth/register", { email: "DUP@qdot.test", password: "password123" });
    assert.equal(dup.statusCode, 409);
    assert.equal(errorCode(dup), "EMAIL_TAKEN");

    const short = await client(api.app).post("/auth/register", { email: "x@qdot.test", password: "short" });
    assert.equal(short.statusCode, 400);
    assert.deepEqual(Object.keys(short.json()), ["error"]);
    assert.equal(short.json().error.code, "VALIDATION_ERROR");
    assert.ok(short.json().error.fields.password);

    const forged = await api.app.inject({ method: "GET", url: "/auth/me", headers: { cookie: "qdot_session=forged.token" } });
    assert.equal(forged.statusCode, 401);
  });

  test("passwords are stored as argon2id hashes", async () => {
    const rows = (await api.db.execute("select password_hash from users limit 1" as never)) as unknown as { password_hash: string }[];
    assert.match(rows[0].password_hash, /^\$argon2id\$/);
  });

  test("rate limits login", async () => {
    const c = client(api.app);
    let last = 0;
    for (let i = 0; i < 11; i++) {
      last = (await c.call({ method: "POST", url: "/auth/login", payload: { email: "rl@qdot.test", password: "x" }, remoteAddress: "203.0.113.9" }))
        .statusCode;
    }
    assert.equal(last, 429);
  });

  test("rejects state-changing requests from unknown origins", async () => {
    const res = await client(api.app).post("/auth/register", { email: "csrf@qdot.test", password: "password123" }, { origin: "https://evil.example" });
    assert.equal(res.statusCode, 403);
    assert.equal(errorCode(res), "FORBIDDEN");
  });
});

describe("QR codes, redirect, tracking, analytics", () => {
  const owner = () => client(api.app);
  let alice: ReturnType<typeof owner>;
  let bob: ReturnType<typeof owner>;
  let qr: QRCode;

  before(async () => {
    alice = owner();
    bob = owner();
    await alice.post("/auth/register", { email: "alice@qdot.test", password: "password123" });
    await bob.post("/auth/register", { email: "bob@qdot.test", password: "password123" });
  });

  test("requires authentication", async () => {
    const res = await api.app.inject({ method: "GET", url: "/qr" });
    assert.equal(res.statusCode, 401);
    assert.equal(errorCode(res), "UNAUTHENTICATED");
  });

  test("only accepts http(s) destinations", async () => {
    for (const destinationUrl of ["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "ftp://x.test", "not a url"]) {
      const res = await alice.post("/qr", { name: "x", destinationUrl, style: STYLE });
      assert.equal(res.statusCode, 400, destinationUrl);
      assert.equal(errorCode(res), "VALIDATION_ERROR");
    }
  });

  test("create, list, get, update", async () => {
    const res = await alice.post("/qr", { name: "Summer Menu", destinationUrl: "https://bistro.example/menu", category: "menu", style: STYLE });
    assert.equal(res.statusCode, 201);
    qr = res.json();
    assert.match(qr.code, /^[a-z2-9]{8}$/);
    assert.notEqual(qr.code, qr.id);
    assert.equal(qr.shortUrl, `https://qr.qdot.test/r/${qr.code}`);
    assert.deepEqual(qr.style, STYLE);
    assert.equal(qr.status, "active");

    const list = (await alice.get("/qr")).json() as QRCode[];
    assert.equal(list.length, 1);
    assert.equal((await alice.get(`/qr/${qr.id}`)).json().name, "Summer Menu");

    const patched = await alice.patch(`/qr/${qr.id}`, { destinationUrl: "https://bistro.example/menu-v2", style: { ...STYLE, pattern: "dots" } });
    assert.equal(patched.statusCode, 200);
    assert.equal(patched.json().destinationUrl, "https://bistro.example/menu-v2");
    assert.equal(patched.json().style.pattern, "dots");
    assert.equal(patched.json().code, qr.code, "code never changes");
  });

  test("ownership: other users can't see or modify", async () => {
    assert.equal((await bob.get(`/qr/${qr.id}`)).statusCode, 404);
    assert.equal((await bob.patch(`/qr/${qr.id}`, { name: "hijack" })).statusCode, 404);
    assert.equal((await bob.del(`/qr/${qr.id}`)).statusCode, 404);
    assert.equal((await bob.get(`/qr/${qr.id}/analytics`)).statusCode, 404);
    assert.equal(((await bob.get("/qr")).json() as QRCode[]).length, 0);
    assert.equal((await alice.get("/qr/not-a-uuid")).statusCode, 404);
  });

  test("redirects scans and records them", async () => {
    const scan = (ua: string, ip: string, method: "GET" | "HEAD" = "GET", headers: Record<string, string> = {}) =>
      api.app.inject({ method, url: `/r/${qr.code}`, remoteAddress: ip, headers: { "user-agent": ua, ...headers } });

    const res = await scan(UA.iphone, "81.2.69.160");
    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.location, "https://bistro.example/menu-v2");
    assert.equal(res.headers["cache-control"], "no-store");

    await scan(UA.iphone, "81.2.69.160"); // same visitor again
    await scan(UA.pixel, "81.2.69.161", "GET", { referer: "https://www.instagram.com/p/xyz" });
    await scan(UA.mac, "10.0.0.5");
    // Not counted: link-preview bot and HEAD probe (still redirected).
    assert.equal((await scan(UA.bot, "81.2.69.160")).statusCode, 302);
    assert.equal((await scan(UA.iphone, "81.2.69.160", "HEAD")).statusCode, 302);

    const rows = (await api.db.execute("select * from scan_events" as never)) as unknown as Record<string, unknown>[];
    assert.equal(rows.length, 4);
    const paris = rows.find((r) => r.city === "Paris")!;
    assert.equal(paris.country_code, "FR");
    assert.equal(paris.device_type, "mobile");
    assert.equal(paris.os, "iOS");
    assert.equal(paris.browser, "Safari");
    for (const r of rows) {
      assert.equal(JSON.stringify(r).includes("81.2.69"), false, "raw IP never stored");
      assert.equal(JSON.stringify(r).includes("Mozilla"), false, "raw user agent never stored");
    }
    assert.equal(rows.find((r) => r.browser === "Chrome" && r.os === "Android")!.referrer, "www.instagram.com");
  });

  test("unknown and paused codes don't redirect", async () => {
    assert.equal((await api.app.inject({ method: "GET", url: "/r/zzzzzzzz" })).statusCode, 404);
    assert.equal((await api.app.inject({ method: "GET", url: "/r/<script>" })).statusCode, 404);
    await alice.patch(`/qr/${qr.id}`, { status: "paused" });
    const paused = await api.app.inject({ method: "GET", url: `/r/${qr.code}`, headers: { "user-agent": UA.iphone } });
    assert.equal(paused.statusCode, 410);
    assert.equal(paused.headers.location, undefined);
    await alice.patch(`/qr/${qr.id}`, { status: "active" });
  });

  test("analytics aggregates on the server", async () => {
    const res = await alice.get(`/qr/${qr.id}/analytics?range=7d&tz=Europe/Paris`);
    assert.equal(res.statusCode, 200);
    const a = res.json() as QRCodeAnalytics;
    assert.equal(a.totalScans, 4);
    assert.equal(a.uniqueVisitors, 3, "same IP+UA on the same day counts once");
    assert.equal(a.timeseries.length, 7);
    assert.equal(a.timeseries.reduce((s, p) => s + p.total, 0), 4);
    assert.equal(a.devices.find((d) => d.label === "Mobile")?.count, 3);
    assert.equal(a.mobileShare, 75);
    assert.equal(a.countries[0].countryCode, "FR");
    assert.equal(a.countryCount, 2, "FR + BE; the private-IP scan has no country");
    assert.ok(a.cities.some((c) => c.label === "Paris, FR"));
    assert.ok(a.operatingSystems.some((o) => o.label === "iOS"));
    assert.ok(a.browsers.some((b) => b.label === "Safari"));
    assert.ok(a.referrers.some((r) => r.label === "www.instagram.com"));
    assert.ok(a.referrers.some((r) => r.label === "Direct scan"));
    assert.equal(a.recentScans.length, 4);
    assert.ok(a.peak && a.peak.scans >= 1);

    for (const range of ["24h", "30d", "3m", "all"]) {
      const r = await alice.get(`/qr/${qr.id}/analytics?range=${range}`);
      assert.equal(r.statusCode, 200, range);
      assert.equal((r.json() as QRCodeAnalytics).totalScans, 4, range);
    }
    assert.equal((await alice.get(`/qr/${qr.id}/analytics?tz=Mars/Olympus`)).statusCode, 400);

    const list = (await alice.get("/qr")).json() as QRCode[];
    assert.equal(list[0].totalScans, 4);
    assert.ok(list[0].lastScanAt);

    const ws = await alice.get("/analytics?range=30d");
    assert.equal(ws.json().totalScans, 4);
    assert.equal(ws.json().activeCodes, 1);
    assert.equal((await bob.get("/analytics")).json().totalScans, 0);
  });

  test("campaigns", async () => {
    const created = await alice.post("/campaigns", { name: "Summer 2026", description: "All locations" });
    assert.equal(created.statusCode, 201);
    const campaign = created.json();
    assert.equal((await alice.post("/campaigns", { name: "" })).statusCode, 400);

    assert.equal((await alice.patch(`/qr/${qr.id}`, { campaignId: campaign.id })).json().campaignId, campaign.id);
    // Bob can't attach his code to Alice's campaign, nor see it.
    const bobQr = (await bob.post("/qr", { destinationUrl: "https://bob.example", style: STYLE })).json();
    assert.equal((await bob.patch(`/qr/${bobQr.id}`, { campaignId: campaign.id })).statusCode, 404);
    assert.equal((await bob.get(`/campaigns/${campaign.id}`)).statusCode, 404);

    const list = (await alice.get("/campaigns")).json();
    assert.equal(list[0].qrCodeCount, 1);
    const detail = (await alice.get(`/campaigns/${campaign.id}`)).json();
    assert.equal(detail.qrCodes[0].id, qr.id);

    const analytics = (await alice.get(`/campaigns/${campaign.id}/analytics?tz=Europe/Paris`)).json();
    assert.equal(analytics.totalScans, 4);
    assert.equal(analytics.topCountry.countryCode, "FR");
    assert.equal(analytics.channels[0].points.reduce((s: number, n: number) => s + n, 0), 4);

    assert.equal((await alice.patch(`/campaigns/${campaign.id}`, { name: "Summer 26" })).json().name, "Summer 26");
    assert.equal((await alice.del(`/campaigns/${campaign.id}`)).statusCode, 204);
    assert.equal((await alice.get(`/qr/${qr.id}`)).json().campaignId, null, "QR code survives campaign deletion");
  });

  test("delete removes the code and its redirect", async () => {
    assert.equal((await alice.del(`/qr/${qr.id}`)).statusCode, 204);
    assert.equal((await alice.get(`/qr/${qr.id}`)).statusCode, 404);
    assert.equal((await api.app.inject({ method: "GET", url: `/r/${qr.code}` })).statusCode, 404);
  });

  test("errors never leak internals", async () => {
    const res = await alice.call({ method: "POST", url: "/qr", payload: "{not json", headers: { "content-type": "application/json" } });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.includes("at "), false);
    assert.equal(errorCode(res), "VALIDATION_ERROR");
  });
});
