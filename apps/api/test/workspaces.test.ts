import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { invitations, qrCodes } from "@qdot/database";
import { DEFAULT_QR_DESIGN, type Campaign, type CreatedInvitation, type QRCode, type Workspace, type WorkspaceMember } from "@qdot/types";
import argon2 from "argon2";
import { eq, sql } from "drizzle-orm";
import { client, STYLE, startTestApi, UA } from "./helpers";

type Api = Awaited<ReturnType<typeof startTestApi>>;
type Client = ReturnType<typeof client>;

const errorCode = (res: { json: () => unknown }) => (res.json() as { error: { code: string } }).error.code;
const newQR = (url = "https://example.com/menu") => ({ mode: "dynamic", content: { type: "url", url }, design: DEFAULT_QR_DESIGN });

let api: Api;
before(async () => {
  api = await startTestApi();
});
after(() => api.stop());

async function signUp(email: string, extra: Record<string, unknown> = {}): Promise<Client> {
  const c = client(api.app);
  const res = await c.post("/auth/register", { email, password: "password123", ...extra });
  assert.equal(res.statusCode, 201, res.body);
  return c;
}

const workspacesOf = async (c: Client) => (await c.get("/workspaces")).json() as Workspace[];

async function scan(code: string) {
  return api.app.inject({ method: "GET", url: `/r/${code}`, headers: { "user-agent": UA.iphone }, remoteAddress: "81.2.69.160" });
}

/** Invites `email` as `role` into the client's selected workspace and returns the raw token. */
async function invite(c: Client, email: string, role: string) {
  const res = await c.post("/workspace/invitations", { email, role });
  assert.equal(res.statusCode, 201, res.body);
  return (res.json() as CreatedInvitation).token;
}

describe("workspace creation and switching", () => {
  test("every account starts with a Personal workspace it owns", async () => {
    const tom = await signUp("tom@qdot.test");
    const list = await workspacesOf(tom);
    assert.equal(list.length, 1);
    assert.equal(list[0].name, "Personal");
    assert.equal(list[0].role, "owner");
    assert.equal(list[0].memberCount, 1);
  });

  test("creating a workspace makes the creator its OWNER; slugs stay unique", async () => {
    const tom = await signUp("tom2@qdot.test");
    const acme = await tom.post("/workspaces", { name: "ACME Café" });
    assert.equal(acme.statusCode, 201, acme.body);
    const ws = acme.json() as Workspace;
    assert.equal(ws.role, "owner");
    assert.match(ws.slug, /^acme-cafe/);
    assert.deepEqual((await workspacesOf(tom)).map((w) => w.name), ["Personal", "ACME Café"]);

    const dup = await tom.post("/workspaces", { name: "Other", slug: ws.slug });
    assert.equal(dup.statusCode, 409);
    assert.equal(errorCode(dup), "SLUG_TAKEN");
    const derived = (await tom.post("/workspaces", { name: "ACME Café" })).json() as Workspace;
    assert.notEqual(derived.slug, ws.slug, "a derived slug gets a suffix instead of failing");
  });

  test("the selected workspace decides what the user sees", async () => {
    const tom = await signUp("tom3@qdot.test");
    const [personal] = await workspacesOf(tom);
    const acme = (await tom.post("/workspaces", { name: "ACME" })).json() as Workspace;

    tom.use(acme.id);
    const acmeQR = (await tom.post("/qr", { name: "ACME menu", ...newQR() })).json() as QRCode;
    const acmeCampaign = (await tom.post("/campaigns", { name: "ACME launch" })).json() as Campaign;
    assert.deepEqual(((await tom.get("/qr")).json() as QRCode[]).map((q) => q.id), [acmeQR.id]);

    tom.use(personal.id);
    assert.deepEqual((await tom.get("/qr")).json(), [], "switching shows the other workspace's codes");
    assert.deepEqual((await tom.get("/campaigns")).json(), []);
    assert.equal((await tom.get(`/qr/${acmeQR.id}`)).statusCode, 404, "a code is only reachable from its own workspace");

    tom.use(undefined);
    assert.deepEqual((await tom.get("/qr")).json(), [], "no header: the Personal workspace");

    tom.use(acme.id);
    assert.equal((await tom.get(`/campaigns/${acmeCampaign.id}`)).statusCode, 200);
    assert.equal(((await tom.get("/workspace")).json() as Workspace).name, "ACME");
  });

  test("QR codes created in a workspace keep every designer feature", async () => {
    const tom = await signUp("tom4@qdot.test");
    const team = (await tom.post("/workspaces", { name: "Team" })).json() as Workspace;
    tom.use(team.id);
    const wifi = { type: "wifi", ssid: "Team-Guest", security: "WPA", password: "welcome-2026", hidden: false };
    const design = { ...DEFAULT_QR_DESIGN, modules: { shape: "classy-rounded", textured: false, fill: { type: "linear", rotation: 30, stops: [{ offset: 0, color: "#111111" }, { offset: 1, color: "#E8503A" }] } } };
    const created = await tom.post("/qr", { mode: "static", content: wifi, design });
    assert.equal(created.statusCode, 201, created.body);
    const qr = created.json() as QRCode;
    const detail = (await tom.get(`/qr/${qr.id}`)).json() as QRCode;
    assert.deepEqual(detail.content, wifi, "Wi-Fi password decrypted for the member");
    assert.deepEqual(detail.design, design);
    assert.equal(((await tom.get("/qr")).json() as QRCode[])[0].contentRedacted, true, "still stripped from lists");
  });
});

describe("isolation between workspaces (A must never reach B)", () => {
  let alice: Client;
  let bob: Client;
  let wsA: Workspace;
  let wsB: Workspace;
  let qrA: QRCode;
  let campaignA: Campaign;

  before(async () => {
    alice = await signUp("alice@isolation.test");
    bob = await signUp("bob@isolation.test");
    wsA = (await alice.post("/workspaces", { name: "Alpha" })).json() as Workspace;
    [wsB] = await workspacesOf(bob);
    alice.use(wsA.id);
    bob.use(wsB.id);
    campaignA = (await alice.post("/campaigns", { name: "Secret launch" })).json() as Campaign;
    qrA = (await alice.post("/qr", { name: "Alpha menu", campaignId: campaignA.id, ...newQR("https://alpha.example/") })).json() as QRCode;
    await scan(qrA.code);
    await alice.post("/workspace/invitations", { email: "carol@isolation.test", role: "editor" });
  });

  test("B can't read, change or delete A's QR codes, even knowing their ids", async () => {
    for (const res of [
      await bob.get(`/qr/${qrA.id}`),
      await bob.patch(`/qr/${qrA.id}`, { name: "hacked" }),
      await bob.patch(`/qr/${qrA.id}`, { content: { type: "url", url: "https://evil.example/" } }),
      await bob.del(`/qr/${qrA.id}`),
      await bob.get(`/qr/${qrA.id}/analytics`),
    ]) {
      assert.equal(res.statusCode, 404, res.body);
      assert.equal(errorCode(res), "QR_NOT_FOUND");
    }
    assert.ok(!((await bob.get("/qr")).json() as QRCode[]).some((q) => q.id === qrA.id));
    assert.ok(!((await bob.get(`/qr?search=Alpha`)).json() as QRCode[]).length);
  });

  test("B can't reach A's campaigns or attach A's campaign to B's codes", async () => {
    for (const res of [
      await bob.get(`/campaigns/${campaignA.id}`),
      await bob.patch(`/campaigns/${campaignA.id}`, { name: "hacked" }),
      await bob.del(`/campaigns/${campaignA.id}`),
      await bob.get(`/campaigns/${campaignA.id}/analytics`),
    ]) {
      assert.equal(res.statusCode, 404, res.body);
      assert.equal(errorCode(res), "CAMPAIGN_NOT_FOUND");
    }
    assert.deepEqual((await bob.get("/campaigns")).json(), []);
    const smuggle = await bob.post("/qr", { campaignId: campaignA.id, ...newQR() });
    assert.equal(smuggle.statusCode, 404);
    assert.equal(errorCode(smuggle), "CAMPAIGN_NOT_FOUND");
  });

  test("B's analytics never include A's scans", async () => {
    const own = (await bob.get("/analytics?range=30d")).json() as { totalScans: number };
    assert.equal(own.totalScans, 0);
    const a = (await alice.get("/analytics?range=30d")).json() as { totalScans: number };
    assert.equal(a.totalScans, 1);
  });

  test("selecting A's workspace in the header gets B nowhere", async () => {
    const spoof = client(api.app);
    await spoof.post("/auth/login", { email: "bob@isolation.test", password: "password123" });
    spoof.use(wsA.id);
    for (const res of [
      await spoof.get("/qr"),
      await spoof.get(`/qr/${qrA.id}`),
      await spoof.post("/qr", newQR()),
      await spoof.get("/campaigns"),
      await spoof.get("/analytics"),
      await spoof.get("/workspace"),
      await spoof.patch("/workspace", { name: "pwned" }),
      await spoof.del("/workspace", { confirm: wsA.slug }),
      await spoof.get("/workspace/members"),
      await spoof.get("/workspace/invitations"),
      await spoof.post("/workspace/invitations", { email: "mallory@x.test", role: "admin" }),
      await spoof.post("/workspace/transfer", { userId: "00000000-0000-0000-0000-000000000000" }),
    ]) {
      assert.equal(res.statusCode, 404, res.body);
      assert.equal(errorCode(res), "WORKSPACE_NOT_FOUND");
    }
    spoof.use("not-a-uuid");
    assert.equal((await spoof.get("/qr")).statusCode, 404);
  });

  test("a workspace id in the request body is ignored: data lands in the selected workspace", async () => {
    const res = await bob.post("/qr", { name: "Bob code", workspaceId: wsA.id, ...newQR() });
    assert.equal(res.statusCode, 201);
    const [row] = await api.db.select().from(qrCodes).where(eq(qrCodes.id, (res.json() as QRCode).id));
    assert.equal(row.workspaceId, wsB.id);
    assert.ok(!((await alice.get("/qr")).json() as QRCode[]).some((q) => q.name === "Bob code"));
  });

  test("A's data is untouched after all of that", async () => {
    const qr = (await alice.get(`/qr/${qrA.id}`)).json() as QRCode;
    assert.equal(qr.name, "Alpha menu");
    assert.equal(qr.destinationUrl, "https://alpha.example/");
    assert.equal(qr.totalScans, 1);
    assert.equal(((await alice.get(`/campaigns/${campaignA.id}`)).json() as { campaign: Campaign }).campaign.name, "Secret launch");
    assert.equal(((await alice.get("/workspace")).json() as Workspace).name, "Alpha");
    const members = (await alice.get("/workspace/members")).json() as WorkspaceMember[];
    assert.deepEqual(members.map((m) => m.email), ["alice@isolation.test"]);
  });
});

describe("roles and permissions", () => {
  let owner: Client, admin: Client, editor: Client, viewer: Client;
  let ws: Workspace;
  const ids: Record<string, string> = {};
  let qr: QRCode;
  let campaign: Campaign;

  before(async () => {
    owner = await signUp("owner@roles.test");
    ws = (await owner.post("/workspaces", { name: "Roles" })).json() as Workspace;
    owner.use(ws.id);
    for (const [role, email] of [["admin", "admin@roles.test"], ["editor", "editor@roles.test"], ["viewer", "viewer@roles.test"]]) {
      const token = await invite(owner, email, role);
      const c = await signUp(email, { invitationToken: token });
      c.use(ws.id);
      ids[role] = ((await c.get("/auth/me")).json() as { user: { id: string } }).user.id;
      if (role === "admin") admin = c;
      if (role === "editor") editor = c;
      if (role === "viewer") viewer = c;
    }
    ids.owner = ((await owner.get("/auth/me")).json() as { user: { id: string } }).user.id;
    qr = (await owner.post("/qr", { name: "Shared", ...newQR() })).json() as QRCode;
    campaign = (await owner.post("/campaigns", { name: "Shared campaign" })).json() as Campaign;
  });

  test("VIEWER: read-only on QR codes, campaigns, analytics and members", async () => {
    for (const url of ["/qr", `/qr/${qr.id}`, `/qr/${qr.id}/analytics`, "/campaigns", `/campaigns/${campaign.id}`, `/campaigns/${campaign.id}/analytics`, "/analytics", "/workspace", "/workspace/members"])
      assert.equal((await viewer.get(url)).statusCode, 200, url);
    for (const res of [
      await viewer.post("/qr", newQR()),
      await viewer.patch(`/qr/${qr.id}`, { name: "x" }),
      await viewer.del(`/qr/${qr.id}`),
      await viewer.post("/campaigns", { name: "x" }),
      await viewer.patch(`/campaigns/${campaign.id}`, { name: "x" }),
      await viewer.del(`/campaigns/${campaign.id}`),
      await viewer.get("/workspace/invitations"),
      await viewer.post("/workspace/invitations", { email: "x@roles.test", role: "viewer" }),
      await viewer.patch(`/workspace/members/${ids.editor}`, { role: "viewer" }),
      await viewer.del(`/workspace/members/${ids.editor}`),
      await viewer.patch("/workspace", { name: "x" }),
      await viewer.del("/workspace", { confirm: ws.slug }),
    ]) {
      assert.equal(res.statusCode, 403, res.body);
      assert.equal(errorCode(res), "FORBIDDEN");
    }
  });

  test("EDITOR: manages QR codes and campaigns, not members nor settings", async () => {
    const created = await editor.post("/qr", { name: "Editor code", campaignId: campaign.id, ...newQR() });
    assert.equal(created.statusCode, 201);
    const id = (created.json() as QRCode).id;
    assert.equal((await editor.patch(`/qr/${id}`, { name: "Renamed" })).statusCode, 200);
    assert.equal((await editor.patch(`/campaigns/${campaign.id}`, { description: "by editor" })).statusCode, 200);
    const c = (await editor.post("/campaigns", { name: "Editor campaign" })).json() as Campaign;
    assert.equal((await editor.del(`/campaigns/${c.id}`)).statusCode, 204);
    assert.equal((await editor.del(`/qr/${id}`)).statusCode, 204);
    assert.equal((await editor.get("/analytics")).statusCode, 200);
    for (const res of [
      await editor.get("/workspace/invitations"),
      await editor.post("/workspace/invitations", { email: "x@roles.test", role: "viewer" }),
      await editor.patch(`/workspace/members/${ids.viewer}`, { role: "editor" }),
      await editor.del(`/workspace/members/${ids.viewer}`),
      await editor.patch("/workspace", { name: "x" }),
      await editor.del("/workspace", { confirm: ws.slug }),
      await editor.post("/workspace/transfer", { userId: ids.editor }),
    ])
      assert.equal(res.statusCode, 403, res.body);
  });

  test("ADMIN: invites and manages members below them; no settings, no deletion, no transfer", async () => {
    assert.equal((await admin.post("/qr", newQR())).statusCode, 201);
    assert.equal((await admin.get("/workspace/invitations")).statusCode, 200);
    assert.equal((await admin.post("/workspace/invitations", { email: "new-editor@roles.test", role: "editor" })).statusCode, 201);
    assert.equal((await admin.post("/workspace/invitations", { email: "new-admin@roles.test", role: "admin" })).statusCode, 201);
    assert.equal((await admin.patch(`/workspace/members/${ids.viewer}`, { role: "editor" })).statusCode, 200);
    assert.equal((await admin.patch(`/workspace/members/${ids.viewer}`, { role: "viewer" })).statusCode, 200);

    for (const res of [
      await admin.patch(`/workspace/members/${ids.owner}`, { role: "viewer" }),
      await admin.del(`/workspace/members/${ids.owner}`),
      await admin.patch(`/workspace/members/${ids.admin}`, { role: "viewer" }),
      await admin.patch("/workspace", { name: "Renamed by admin" }),
      await admin.del("/workspace", { confirm: ws.slug }),
      await admin.post("/workspace/transfer", { userId: ids.admin }),
    ])
      assert.equal(res.statusCode, 403, res.body);
    // Nobody can grant ownership through a role change or an invitation.
    assert.equal((await admin.patch(`/workspace/members/${ids.viewer}`, { role: "owner" })).statusCode, 400);
    assert.equal((await admin.post("/workspace/invitations", { email: "o@roles.test", role: "owner" })).statusCode, 400);
  });

  test("OWNER: settings, members, transfer and deletion", async () => {
    const renamed = await owner.patch("/workspace", { name: "Roles & Co", slug: `${ws.slug}-co` });
    assert.equal(renamed.statusCode, 200, renamed.body);
    ws = renamed.json() as Workspace;
    assert.equal((await owner.patch(`/workspace/members/${ids.admin}`, { role: "editor" })).statusCode, 200);
    assert.equal((await owner.patch(`/workspace/members/${ids.admin}`, { role: "admin" })).statusCode, 200);

    // The owner can't leave without handing over the workspace.
    assert.equal((await owner.del(`/workspace/members/${ids.owner}`)).statusCode, 403);
    // Anyone else may leave.
    assert.equal((await viewer.del(`/workspace/members/${ids.viewer}`)).statusCode, 204);
    assert.equal((await viewer.get("/qr")).statusCode, 404, "a former member loses access at once");

    const transfer = await owner.post("/workspace/transfer", { userId: ids.admin });
    assert.equal(transfer.statusCode, 200, transfer.body);
    const members = (await admin.get("/workspace/members")).json() as WorkspaceMember[];
    assert.equal(members.find((m) => m.userId === ids.admin)?.role, "owner");
    assert.equal(members.find((m) => m.userId === ids.owner)?.role, "admin");
    assert.equal(members.filter((m) => m.role === "owner").length, 1);
    assert.equal((await owner.patch("/workspace", { name: "x" })).statusCode, 403, "the former owner is an admin now");

    // Deletion needs the slug typed back.
    const wrong = await admin.del("/workspace", { confirm: "nope" });
    assert.equal(wrong.statusCode, 400);
    const deleted = await admin.del("/workspace", { confirm: ws.slug });
    assert.equal(deleted.statusCode, 204, deleted.body);
    assert.equal((await admin.get("/qr")).statusCode, 404);
    assert.equal((await scan(qr.code)).statusCode, 404, "its codes are gone with it");
    assert.ok(!(await workspacesOf(owner)).some((w) => w.id === ws.id));
  });

  test("a user can't delete their only workspace", async () => {
    const solo = await signUp("solo@roles.test");
    const [personal] = await workspacesOf(solo);
    const res = await solo.del("/workspace", { confirm: personal.slug });
    assert.equal(res.statusCode, 409);
    assert.equal(errorCode(res), "LAST_WORKSPACE");
  });
});

describe("invitations", () => {
  let owner: Client;
  let ws: Workspace;

  before(async () => {
    owner = await signUp("owner@invites.test");
    ws = (await owner.post("/workspaces", { name: "Restaurant Dupont" })).json() as Workspace;
    owner.use(ws.id);
  });

  test("tokens are random, stored hashed, valid 7 days", async () => {
    const res = await owner.post("/workspace/invitations", { email: "Chef@Invites.test", role: "editor" });
    const { invitation, token } = res.json() as CreatedInvitation;
    assert.match(token, /^[A-Za-z0-9_-]{43}$/, "256-bit base64url token");
    assert.equal(invitation.email, "chef@invites.test");
    assert.equal(invitation.status, "pending");
    const days = (new Date(invitation.expiresAt).getTime() - Date.now()) / 86_400_000;
    assert.ok(days > 6.99 && days <= 7, `expires in ${days} days`);
    const [row] = await api.db.select().from(invitations).where(eq(invitations.id, invitation.id));
    assert.notEqual(row.tokenHash, token);
    assert.ok(!JSON.stringify(row).includes(token), "raw token never stored");
  });

  test("an existing user previews, then accepts and joins with the invited role", async () => {
    const guest = await signUp("guest@invites.test");
    const token = await invite(owner, "guest@invites.test", "viewer");

    const preview = await api.app.inject({ method: "GET", url: `/invitations/${token}` });
    assert.equal(preview.statusCode, 200);
    assert.deepEqual(
      { ...(preview.json() as object), expiresAt: undefined },
      { workspaceName: "Restaurant Dupont", email: "guest@invites.test", role: "viewer", invitedBy: "Owner", status: "pending", accountExists: true, expiresAt: undefined },
    );

    const accepted = await guest.post(`/invitations/${token}/accept`);
    assert.equal(accepted.statusCode, 200, accepted.body);
    assert.equal((accepted.json() as Workspace).role, "viewer");
    assert.ok((await workspacesOf(guest)).some((w) => w.id === ws.id && w.role === "viewer"));

    const again = await guest.post(`/invitations/${token}/accept`);
    assert.equal(again.statusCode, 409);
    assert.equal(errorCode(again), "INVITATION_USED");
  });

  test("a new user signs up from the invitation and lands in the workspace", async () => {
    const token = await invite(owner, "newbie@invites.test", "editor");
    const preview = (await api.app.inject({ method: "GET", url: `/invitations/${token}` })).json() as { accountExists: boolean };
    assert.equal(preview.accountExists, false);
    const newbie = await signUp("newbie@invites.test", { invitationToken: token });
    const list = await workspacesOf(newbie);
    assert.deepEqual(list.map((w) => [w.name, w.role]).sort(), [["Personal", "owner"], ["Restaurant Dupont", "editor"]]);
  });

  test("the link only works for the invited address", async () => {
    const token = await invite(owner, "right@invites.test", "editor");
    const wrong = await signUp("wrong@invites.test");
    const res = await wrong.post(`/invitations/${token}/accept`);
    assert.equal(res.statusCode, 403);
    assert.equal(errorCode(res), "INVITATION_EMAIL_MISMATCH");
    const signup = await client(api.app).post("/auth/register", { email: "someone-else@invites.test", password: "password123", invitationToken: token });
    assert.equal(signup.statusCode, 403);
    const [ghost] = await api.db.execute(sql`select id from users where email = 'someone-else@invites.test'`);
    assert.equal(ghost, undefined, "no account is created when the invitation is refused");
  });

  test("an expired invitation can't be used", async () => {
    const token = await invite(owner, "late@invites.test", "viewer");
    await api.db.update(invitations).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(invitations.email, "late@invites.test"));
    const preview = (await api.app.inject({ method: "GET", url: `/invitations/${token}` })).json() as { status: string };
    assert.equal(preview.status, "expired");
    const late = await signUp("late@invites.test");
    const res = await late.post(`/invitations/${token}/accept`);
    assert.equal(res.statusCode, 410);
    assert.equal(errorCode(res), "INVITATION_EXPIRED");
    const listed = (await owner.get("/workspace/invitations")).json() as { email: string; status: string }[];
    assert.equal(listed.find((i) => i.email === "late@invites.test")?.status, "expired");
  });

  test("revoked and replaced links stop working; unknown tokens look the same", async () => {
    const first = await invite(owner, "twice@invites.test", "viewer");
    const second = await invite(owner, "twice@invites.test", "editor");
    assert.equal((await api.app.inject({ method: "GET", url: `/invitations/${first}` })).statusCode, 404, "re-inviting replaces the old link");
    const pending = ((await owner.get("/workspace/invitations")).json() as { id: string; email: string }[]).find((i) => i.email === "twice@invites.test")!;
    assert.equal((await owner.del(`/workspace/invitations/${pending.id}`)).statusCode, 204);
    assert.equal((await api.app.inject({ method: "GET", url: `/invitations/${second}` })).statusCode, 404);
    const unknown = await api.app.inject({ method: "GET", url: `/invitations/${"x".repeat(43)}` });
    assert.equal(unknown.statusCode, 404);
    assert.equal(errorCode(unknown), "INVITATION_NOT_FOUND");
  });

  test("inviting an existing member is refused", async () => {
    const res = await owner.post("/workspace/invitations", { email: "owner@invites.test", role: "viewer" });
    assert.equal(res.statusCode, 409);
    assert.equal(errorCode(res), "ALREADY_MEMBER");
  });
});

describe("migration of data created before workspaces", () => {
  test("each user gets a Personal workspace owning their codes and campaigns; codes keep working", async () => {
    const legacy = await startTestApi({
      seedBefore: {
        upTo: "0001_qr_designer",
        seed: async (db) => {
          const hash = await argon2.hash("password123", { type: argon2.argon2id });
          for (const [email, code] of [["tom@legacy.test", "meg2acy3"], ["ana@legacy.test", "meg2acy4"]]) {
            const [u] = await db.execute<{ id: string }>(sql`insert into users (email, password_hash, name) values (${email}, ${hash}, 'Legacy') returning id`);
            const [c] = await db.execute<{ id: string }>(sql`insert into campaigns (user_id, name) values (${u.id}, 'Old campaign') returning id`);
            await db.execute(sql`insert into qr_codes (user_id, campaign_id, code, name, destination_url, configuration)
              values (${u.id}, ${c.id}, ${code}, 'Printed menu', ${`https://${email.split("@")[0]}.example/menu`}, ${JSON.stringify(STYLE)}::jsonb)`);
          }
        },
      },
    });
    try {
      const members = await legacy.db.execute<{ email: string; name: string; slug: string; role: string; codes: number; campaigns: number }>(sql`
        select u.email, w.name, w.slug, m.role,
          (select count(*)::int from qr_codes q where q.workspace_id = w.id) as codes,
          (select count(*)::int from campaigns c where c.workspace_id = w.id) as campaigns
        from workspace_members m join users u on u.id = m.user_id join workspaces w on w.id = m.workspace_id order by u.email`);
      assert.deepEqual(
        members.map((m) => [m.email, m.name, m.role, m.codes, m.campaigns]),
        [
          ["ana@legacy.test", "Personal", "owner", 1, 1],
          ["tom@legacy.test", "Personal", "owner", 1, 1],
        ],
      );
      assert.ok(members.every((m) => m.slug.startsWith("personal-")));
      const [orphans] = await legacy.db.execute<{ n: number }>(sql`select count(*)::int as n from qr_codes where workspace_id is null`);
      assert.equal(orphans.n, 0);
      // A code and its campaign always end up in the same workspace.
      const [mismatch] = await legacy.db.execute<{ n: number }>(
        sql`select count(*)::int as n from qr_codes q join campaigns c on c.id = q.campaign_id where c.workspace_id <> q.workspace_id`,
      );
      assert.equal(mismatch.n, 0);

      // Printed codes: same public code, still redirecting and counting.
      const scanRes = await legacy.app.inject({ method: "GET", url: "/r/meg2acy3", headers: { "user-agent": UA.iphone } });
      assert.equal(scanRes.statusCode, 302);
      assert.equal(scanRes.headers.location, "https://tom.example/menu");

      const tom = client(legacy.app);
      await tom.post("/auth/login", { email: "tom@legacy.test", password: "password123" });
      const [qr] = (await tom.get("/qr")).json() as QRCode[];
      assert.equal(qr.code, "meg2acy3");
      assert.equal(qr.totalScans, 1);
      assert.equal(qr.campaignId !== null, true);
      const campaigns = (await tom.get("/campaigns")).json() as Campaign[];
      assert.deepEqual(campaigns.map((c) => [c.name, c.qrCodeCount]), [["Old campaign", 1]]);
      assert.equal(((await tom.get("/analytics?range=30d")).json() as { totalScans: number }).totalScans, 1);
      assert.ok(!((await tom.get("/qr")).json() as QRCode[]).some((q) => q.code === "meg2acy4"), "still isolated from the other user");
    } finally {
      await legacy.stop();
    }
  });
});
