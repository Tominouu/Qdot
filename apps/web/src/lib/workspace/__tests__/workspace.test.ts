import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { listCampaigns } from "@/lib/api/campaigns";
import { createQRCode, getQRCode, listQRCodes } from "@/lib/api/qr";
import { createWorkspace, deleteWorkspace, listWorkspaces } from "@/lib/api/workspaces";
import { DEFAULT_QR_DESIGN, can, PERMISSIONS, WORKSPACE_ROLES, type Permission, type WorkspaceRole } from "@/types";
import { getActiveWorkspaceId, setActiveWorkspaceId } from "../store";

/** The spec, written independently of the implementation. */
const EXPECTED: Record<WorkspaceRole, Permission[]> = {
  owner: Object.keys(PERMISSIONS) as Permission[],
  admin: ["qr:read", "qr:write", "campaign:read", "campaign:write", "analytics:read", "members:read", "members:manage"],
  editor: ["qr:read", "qr:write", "campaign:read", "campaign:write", "analytics:read", "members:read"],
  viewer: ["qr:read", "campaign:read", "analytics:read", "members:read"],
};

describe("permission matrix", () => {
  test("each role gets exactly its permissions", () => {
    for (const role of WORKSPACE_ROLES)
      for (const permission of Object.keys(PERMISSIONS) as Permission[])
        assert.equal(can(role, permission), EXPECTED[role].includes(permission), `${role} → ${permission}`);
  });

  test("no role means no access", () => {
    assert.equal(can(null, "qr:read"), false);
    assert.equal(can(undefined, "analytics:read"), false);
  });

  test("only the owner deletes, transfers or changes settings", () => {
    for (const p of ["workspace:delete", "workspace:transfer", "workspace:update"] as const)
      assert.deepEqual(WORKSPACE_ROLES.filter((r) => can(r, p)), ["owner"]);
  });
});

describe("workspace switching (demo mode)", () => {
  test("each workspace only shows its own codes and campaigns", async () => {
    setActiveWorkspaceId("ws_personal");
    const personal = await listQRCodes();
    assert.ok(personal.length > 0);
    assert.ok(personal.every((q) => q.workspaceId === "ws_personal"));
    assert.ok((await listCampaigns()).length > 0);

    setActiveWorkspaceId("ws_acme");
    assert.deepEqual(await listQRCodes(), [], "switching changes what is listed");
    assert.deepEqual(await listCampaigns(), []);
    await assert.rejects(getQRCode(personal[0].id), /not found/i, "a code is unreachable from another workspace");

    const created = await createQRCode({ name: "ACME menu", mode: "dynamic", content: { type: "url", url: "https://acme.example" }, design: DEFAULT_QR_DESIGN });
    assert.equal(created.workspaceId, "ws_acme");
    assert.deepEqual((await listQRCodes()).map((q) => q.id), [created.id]);

    setActiveWorkspaceId("ws_personal");
    assert.ok(!(await listQRCodes()).some((q) => q.id === created.id));
  });

  test("creating and deleting a workspace", async () => {
    const before = (await listWorkspaces()).length;
    const ws = await createWorkspace({ name: "Restaurant Dupont" });
    assert.equal(ws.role, "owner");
    assert.equal(ws.slug, "restaurant-dupont");
    assert.equal((await listWorkspaces()).length, before + 1);

    setActiveWorkspaceId(ws.id);
    assert.equal(getActiveWorkspaceId(), ws.id);
    await assert.rejects(deleteWorkspace("wrong"), /slug/i);
    await deleteWorkspace("restaurant-dupont");
    assert.equal((await listWorkspaces()).length, before);
  });
});
