import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { qrCodes } from "@qdot/database";
import { DEFAULT_QR_DESIGN, legacyStyleToDesign, type QRCode, type QRDesign } from "@qdot/types";
import { eq, sql } from "drizzle-orm";
import { createSecretBox } from "../src/services/secrets";
import { client, STYLE, startTestApi, UA } from "./helpers";

const logs: string[] = [];
let api: Awaited<ReturnType<typeof startTestApi>>;
before(async () => {
  api = await startTestApi({ logs });
});
after(() => api.stop());

/** Drizzle wraps the driver error; the constraint that fired is on `cause`. */
const violates = (constraint: string) => (err: unknown) => {
  const cause = (err as { cause?: { constraint_name?: string; message?: string } }).cause;
  return (cause?.constraint_name ?? cause?.message ?? "").includes(constraint);
};

const errorCode = (res: { json: () => unknown }) => (res.json() as { error: { code: string } }).error.code;
const PASSWORD = "S3cr3t;Pass:\"word\\";

const DESIGN: QRDesign = {
  ...DEFAULT_QR_DESIGN,
  modules: { shape: "classy-rounded", textured: false, fill: { type: "linear", rotation: 45, stops: [{ offset: 0, color: "#111111" }, { offset: 1, color: "#E8503A" }] } },
  eyes: { outer: "circle", inner: "rounded", center: "dot", frameColor: "#111111", centerColor: "#E8503A" },
  background: { color: "#FFFFFF", transparent: false, image: null },
  margin: 5,
  errorCorrection: "Q",
};

describe("secret box", () => {
  test("round-trips and authenticates", () => {
    const box = createSecretBox("k".repeat(40));
    const sealed = box.seal(PASSWORD);
    assert.notEqual(sealed, box.seal(PASSWORD), "random IV per value");
    assert.equal(box.open(sealed), PASSWORD);
    assert.equal(createSecretBox("x".repeat(40)).open(sealed), null, "wrong key");
    const [v, iv, tag, ct] = sealed.split(".");
    assert.equal(box.open([v, iv, tag, `${ct.slice(0, -2)}AA`].join(".")), null, "tampered");
  });
});

describe("QR designer: content, modes, design", () => {
  const alice = () => client(api.app);
  let a: ReturnType<typeof alice>;
  before(async () => {
    a = alice();
    await a.post("/auth/register", { email: "designer@qdot.test", password: "password123" });
  });

  test("dynamic URL with a v2 design: saved, reloaded, redirects", async () => {
    const res = await a.post("/qr", { name: "Menu", mode: "dynamic", content: { type: "url", url: "https://bistro.example/menu" }, design: DESIGN });
    assert.equal(res.statusCode, 201, res.body);
    const qr = res.json() as QRCode;
    assert.equal(qr.mode, "dynamic");
    assert.equal(qr.destinationUrl, "https://bistro.example/menu");
    assert.deepEqual(qr.design, DESIGN, "design saved as sent");
    assert.deepEqual((await a.get(`/qr/${qr.id}`)).json().design, DESIGN, "design loaded back");

    const scan = await api.app.inject({ method: "GET", url: `/r/${qr.code}`, headers: { "user-agent": UA.iphone } });
    assert.equal(scan.statusCode, 302);
    assert.equal(scan.headers.location, "https://bistro.example/menu");
    assert.equal((await a.get(`/qr/${qr.id}`)).json().totalScans, 1, "scan tracked");
  });

  test("static URL encodes the content and never redirects", async () => {
    const qr = (await a.post("/qr", { mode: "static", content: { type: "url", url: "https://static.example/" }, design: DESIGN })).json() as QRCode;
    assert.equal(qr.mode, "static");
    assert.equal(qr.destinationUrl, null);
    assert.deepEqual(qr.content, { type: "url", url: "https://static.example/" });
    const scan = await api.app.inject({ method: "GET", url: `/r/${qr.code}`, headers: { "user-agent": UA.iphone } });
    assert.equal(scan.statusCode, 404);
  });

  test("every static type validates and round-trips", async () => {
    const contents = [
      { type: "vcard", firstName: "Ada", lastName: "Lovelace", organization: "Analytical; Engines", jobTitle: "", phone: "+44 20 7946 0000", email: "ada@example.com", website: "https://ada.example", street: "", city: "London", postalCode: "", country: "UK" },
      { type: "email", to: "hello@example.com", subject: "Hi & welcome", body: "Line 1\nLine 2" },
      { type: "sms", phone: "+33 6 12 34 56 78", message: "Table 4 🍷" },
      { type: "phone", phone: "+33612345678" },
    ];
    for (const content of contents) {
      const res = await a.post("/qr", { mode: "static", content, design: DESIGN });
      assert.equal(res.statusCode, 201, `${content.type}: ${res.body}`);
      const qr = res.json() as QRCode;
      assert.equal(qr.type, content.type);
      assert.deepEqual((await a.get(`/qr/${qr.id}`)).json().content, content);
    }
  });

  test("rejects invalid content and dynamic non-URL types", async () => {
    assert.equal(errorCode(await a.post("/qr", { mode: "static", content: { type: "email", to: "nope" } })), "VALIDATION_ERROR");
    assert.equal(errorCode(await a.post("/qr", { mode: "static", content: { type: "wifi", ssid: "", security: "WPA", password: "x" } })), "VALIDATION_ERROR");
    const dyn = await a.post("/qr", { mode: "dynamic", content: { type: "phone", phone: "+33612345678" } });
    assert.equal(dyn.statusCode, 400);
    assert.match(dyn.json().error.fields.mode, /static/);
    assert.equal(errorCode(await a.post("/qr", { mode: "static", content: { type: "url", url: "javascript:alert(1)" } })), "VALIDATION_ERROR");
  });

  test("Wi-Fi password: encrypted at rest, hidden in lists, shown to the owner, never logged", async () => {
    const content = { type: "wifi", ssid: "Café;Guest", security: "WPA3", password: PASSWORD, hidden: true };
    const created = await a.post("/qr", { name: "Wi-Fi", mode: "static", content, design: DESIGN });
    assert.equal(created.statusCode, 201, created.body);
    const qr = created.json() as QRCode;
    assert.deepEqual(qr.content, content);

    const [row] = await api.db.select().from(qrCodes).where(eq(qrCodes.id, qr.id));
    const stored = JSON.stringify(row.content);
    assert.ok(!stored.includes(PASSWORD) && !stored.includes("S3cr3t"), "no plaintext in the database");
    assert.match(String((row.content as { passwordEnc?: string }).passwordEnc), /^v1\./);

    const listed = ((await a.get("/qr")).json() as QRCode[]).find((q) => q.id === qr.id)!;
    assert.equal((listed.content as { password: string }).password, "", "stripped from lists");
    assert.equal(listed.contentRedacted, true);

    const detail = (await a.get(`/qr/${qr.id}`)).json() as QRCode;
    assert.equal((detail.content as { password: string }).password, PASSWORD);
    assert.equal(detail.contentRedacted, false);

    const bob = client(api.app);
    await bob.post("/auth/register", { email: "bob-wifi@qdot.test", password: "password123" });
    assert.equal((await bob.get(`/qr/${qr.id}`)).statusCode, 404, "other users can't read it");

    const patched = await a.patch(`/qr/${qr.id}`, { content: { ...content, password: "another-pass" } });
    assert.equal((patched.json().content as { password: string }).password, "another-pass");

    assert.ok(!logs.some((l) => l.includes("S3cr3t") || l.includes("another-pass")), "never logged");
  });

  test("mode is fixed; dynamic codes stay URLs", async () => {
    const qr = (await a.post("/qr", { mode: "dynamic", content: { type: "url", url: "https://a.example" } })).json() as QRCode;
    const res = await a.patch(`/qr/${qr.id}`, { mode: "static", name: "renamed" });
    assert.equal(res.json().mode, "dynamic", "mode is not updatable");
    const toPhone = await a.patch(`/qr/${qr.id}`, { content: { type: "phone", phone: "+33612345678" } });
    assert.equal(toPhone.statusCode, 400);
    const moved = await a.patch(`/qr/${qr.id}`, { content: { type: "url", url: "https://b.example" } });
    assert.equal(moved.json().destinationUrl, "https://b.example");
    const scan = await api.app.inject({ method: "GET", url: `/r/${qr.code}`, headers: { "user-agent": UA.pixel } });
    assert.equal(scan.headers.location, "https://b.example/");
  });

  test("codes saved before the designer keep working", async () => {
    const [user] = await api.db.execute<{ id: string }>(sql`select id from users where email = 'designer@qdot.test'`);
    // Exactly what 0000_init stored: no mode/content columns set, v1 style JSON.
    const [ws] = await api.db.execute<{ id: string }>(sql`select workspace_id as id from workspace_members where user_id = ${user.id}::uuid and role = 'owner' limit 1`);
    await api.db.execute(sql`insert into qr_codes (user_id, workspace_id, code, name, destination_url, configuration)
      values (${user.id}, ${ws.id}, 'wxyzab23', 'Legacy', 'https://legacy.example/page', ${JSON.stringify(STYLE)}::jsonb)`);
    const legacy = ((await a.get("/qr")).json() as QRCode[]).find((q) => q.code === "wxyzab23")!;
    assert.equal(legacy.mode, "dynamic");
    assert.equal(legacy.type, "url");
    assert.deepEqual(legacy.content, { type: "url", url: "https://legacy.example/page" });
    assert.deepEqual(legacy.design, legacyStyleToDesign(STYLE));

    const scan = await api.app.inject({ method: "GET", url: "/r/wxyzab23", headers: { "user-agent": UA.iphone } });
    assert.equal(scan.statusCode, 302);
    assert.equal(scan.headers.location, "https://legacy.example/page");

    // Editing only the name leaves the stored v1 style untouched; saving a design upgrades it.
    await a.patch(`/qr/${legacy.id}`, { name: "Legacy renamed" });
    let [row] = await api.db.select().from(qrCodes).where(eq(qrCodes.id, legacy.id));
    assert.deepEqual(row.configuration, STYLE);
    await a.patch(`/qr/${legacy.id}`, { design: DESIGN });
    [row] = await api.db.select().from(qrCodes).where(eq(qrCodes.id, legacy.id));
    assert.equal((row.configuration as QRDesign).version, 2);
  });

  test("the database refuses a dynamic code without an http(s) destination", async () => {
    const [m] = await api.db.execute<{ user_id: string; workspace_id: string }>(
      sql`select user_id, workspace_id from workspace_members m join users u on u.id = m.user_id where u.email = 'designer@qdot.test' limit 1`,
    );
    await assert.rejects(
      api.db.execute(sql`insert into qr_codes (user_id, workspace_id, code, mode, configuration) values (${m.user_id}, ${m.workspace_id}, 'nodest23', 'dynamic', '{}'::jsonb)`),
      violates("qr_codes_destination_check"),
    );
    await assert.rejects(
      api.db.execute(sql`insert into qr_codes (user_id, workspace_id, code, mode, destination_url, configuration) values (${m.user_id}, ${m.workspace_id}, 'badmode2', 'weird', 'https://ok.example', '{}'::jsonb)`),
      violates("qr_codes_mode_check"),
    );
  });
});
