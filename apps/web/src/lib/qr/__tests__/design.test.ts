import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CreateQRCodeSchema,
  DEFAULT_QR_DESIGN,
  legacyStyleToDesign,
  normalizeDesign,
  QR_EYE_SHAPES,
  QR_PATTERNS,
  QRDesignSchema,
  resolveErrorCorrection,
  type QRStyle,
} from "@/types";
import { upgradeMockQR, QR_CODES } from "@/data/qr-codes";
import { analyzeDesign } from "../scannability";
import { buildQRGeometry } from "../render/geometry";
import { LOGO_DATA_URL } from "./helpers";

const LEGACY: QRStyle = { pattern: "rounded", eyeShape: "rounded", foreground: "#FAFAFA", background: "#27272A", eyeColor: "#E8503A", textured: true, logo: null };

describe("design model", () => {
  test("every legacy (v1) style upgrades to a valid v2 design", () => {
    for (const pattern of QR_PATTERNS)
      for (const eyeShape of QR_EYE_SHAPES)
        for (const logo of [null, LOGO_DATA_URL]) {
          const design = normalizeDesign({ ...LEGACY, pattern, eyeShape, logo });
          assert.ok(QRDesignSchema.safeParse(design).success, `${pattern}/${eyeShape}`);
          assert.equal(design.modules.fill.type === "solid" && design.modules.fill.color, "#FAFAFA");
          assert.equal(design.eyes.centerColor, "#E8503A");
          assert.equal(design.logo?.src ?? null, logo);
        }
    assert.equal(normalizeDesign({ ...LEGACY, pattern: "dots" }).modules.shape, "circle", "v1 dots were full circles");
    assert.equal(normalizeDesign({ ...LEGACY, pattern: "squares" }).modules.shape, "square");
  });

  test("v1 rendering rules are kept: auto error correction, 3-module export margin", () => {
    const design = legacyStyleToDesign({ ...LEGACY, logo: LOGO_DATA_URL });
    assert.equal(design.margin, 3);
    assert.equal(resolveErrorCorrection(design), "H");
    assert.equal(resolveErrorCorrection(legacyStyleToDesign(LEGACY)), "M");
  });

  test("v2 designs load unchanged; garbage falls back to the default", () => {
    const custom = { ...DEFAULT_QR_DESIGN, margin: 7, errorCorrection: "Q" as const };
    assert.deepEqual(normalizeDesign(structuredClone(custom)), custom);
    assert.deepEqual(normalizeDesign(null), DEFAULT_QR_DESIGN);
    assert.deepEqual(normalizeDesign({ version: 2, modules: "nope" }), DEFAULT_QR_DESIGN);
  });

  test("create input: legacy v1 body and v2 body produce the same kind of data", () => {
    const v1 = CreateQRCodeSchema.parse({ destinationUrl: "https://a.example", style: LEGACY });
    assert.deepEqual(v1.content, { type: "url", url: "https://a.example" });
    assert.equal(v1.mode, "dynamic");
    assert.deepEqual(v1.design, legacyStyleToDesign(LEGACY));
    const v2 = CreateQRCodeSchema.parse({ content: { type: "sms", phone: "+33612345678" }, mode: "static" });
    assert.deepEqual(v2.design, DEFAULT_QR_DESIGN);
    assert.equal(CreateQRCodeSchema.safeParse({ content: { type: "sms", phone: "+33612345678" } }).success, false, "SMS can't be dynamic");
  });

  test("mock codes stored in the old format are upgraded (demo mode / localStorage)", () => {
    assert.ok(QR_CODES.every((q) => q.design.version === 2 && q.content));
    const upgraded = upgradeMockQR({ ...QR_CODES[0], design: undefined, mode: undefined, content: undefined, style: LEGACY } as never);
    assert.equal(upgraded.mode, "dynamic");
    assert.deepEqual(upgraded.content, { type: "url", url: QR_CODES[0].destinationUrl });
  });
});

describe("scannability analysis", () => {
  const report = (design: typeof DEFAULT_QR_DESIGN, payload = "https://qr.qdot.com/r/abcd2345") => analyzeDesign(design, buildQRGeometry(payload, design));
  const ids = (design: typeof DEFAULT_QR_DESIGN) => report(design).checks.map((c) => c.id);

  test("the default design is easy to scan", () => {
    assert.deepEqual(report(DEFAULT_QR_DESIGN), { status: "ok", checks: [] });
  });

  test("flags risky designs", () => {
    const lowContrast = structuredClone(DEFAULT_QR_DESIGN);
    lowContrast.modules.fill = { type: "solid", color: "#3A3A3F" };
    assert.ok(ids(lowContrast).includes("low-contrast"));

    const gradient = structuredClone(DEFAULT_QR_DESIGN);
    gradient.modules.fill = { type: "linear", rotation: 0, stops: [{ offset: 0, color: "#FAFAFA" }, { offset: 1, color: "#30303A" }] };
    assert.ok(ids(gradient).includes("low-contrast"), "every gradient stop is checked");

    const bigLogo = structuredClone(DEFAULT_QR_DESIGN);
    bigLogo.logo = { src: LOGO_DATA_URL, size: 0.3, margin: 0.5, background: "#27272A", shape: "square" };
    bigLogo.errorCorrection = "M";
    assert.ok(ids(bigLogo).includes("logo-too-large"));
    assert.ok(ids(bigLogo).includes("low-error-correction"));
    assert.equal(report(bigLogo).status, "error");

    const tight = { ...structuredClone(DEFAULT_QR_DESIGN), margin: 2 };
    assert.ok(ids(tight).includes("quiet-zone"));

    const transparent = structuredClone(DEFAULT_QR_DESIGN);
    transparent.background.transparent = true;
    assert.ok(ids(transparent).includes("transparent"));
  });
});

describe("eye combinations", () => {
  test("picking a part keeps it and adjusts the others to a reliable combination", async () => {
    const { isReliableEyeCombo, reliableEyes } = await import("../render/eyes");
    const picked = reliableEyes({ outer: "square", inner: "square", center: "circle" }, "center");
    assert.equal(picked.center, "circle");
    assert.ok(isReliableEyeCombo(picked));
    const same = { outer: "rounded" as const, inner: "rounded" as const, center: "rounded" as const };
    assert.equal(reliableEyes(same, "outer"), same, "reliable picks are untouched");
    // Every single pick can be honoured.
    for (const part of ["outer", "inner", "center"] as const)
      for (const v of part === "center" ? ["square", "rounded", "dot", "circle", "leaf"] : ["square", "rounded", "circle", "leaf"]) {
        const r = reliableEyes({ outer: "square", inner: "square", center: "square", [part]: v } as never, part);
        assert.equal(r[part], v);
        assert.ok(isReliableEyeCombo(r));
      }
  });
});
