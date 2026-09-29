import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_QR_DESIGN, EYE_CENTER_SHAPES, EYE_FRAME_SHAPES, MODULE_SHAPES, type QRDesign, type QRFill } from "@/types";
import { isReliableEyeCombo } from "../render/eyes";
import { buildQRGeometry } from "../render/geometry";
import { analyzeDesign } from "../scannability";
import { contentPayload, defaultContent } from "../types";
import { decodeDesign, LOGO_DATA_URL } from "./helpers";

/**
 * Every visual option is rendered to pixels and decoded with jsQR. A design the
 * analyzer calls "ok" or "warning" must decode; this is what keeps the editor honest.
 */
const SHORT_URL = "https://qr.tom-leclercq.fr/r/abcd2345";

const FILLS: Record<string, QRFill> = {
  solid: { type: "solid", color: "#111111" },
  linear: { type: "linear", rotation: 45, stops: [{ offset: 0, color: "#111111" }, { offset: 0.5, color: "#7A1F12" }, { offset: 1, color: "#1D3557" }] },
  radial: { type: "radial", rotation: 0, stops: [{ offset: 0, color: "#1D3557" }, { offset: 1, color: "#111111" }] },
};

function design(patch: (d: QRDesign) => void): QRDesign {
  const d: QRDesign = {
    ...structuredClone(DEFAULT_QR_DESIGN),
    modules: { shape: "square", textured: false, fill: FILLS.solid },
    eyes: { outer: "square", inner: "square", center: "square", frameColor: "#111111", centerColor: "#E8503A" },
    background: { color: "#FFFFFF", transparent: false, image: null },
  };
  patch(d);
  return d;
}

const label = (d: QRDesign) =>
  `${d.modules.shape}/${d.modules.fill.type}/eyes ${d.eyes.outer}-${d.eyes.inner}-${d.eyes.center}/logo ${d.logo ? d.logo.size : "none"}/ec ${d.errorCorrection}`;

describe("decoding real renders", () => {
  test("every module shape × fill, with and without a logo", () => {
    const failures: string[] = [];
    for (const shape of MODULE_SHAPES)
      for (const fill of Object.values(FILLS))
        for (const logo of [false, true]) {
          const d = design((x) => {
            x.modules.shape = shape;
            x.modules.fill = fill;
            if (logo) x.logo = { src: LOGO_DATA_URL, size: 0.2, margin: 0.5, background: "#FFFFFF", shape: "rounded" };
          });
          const status = analyzeDesign(d, buildQRGeometry(SHORT_URL, d)).status;
          if (status !== "error" && decodeDesign(SHORT_URL, d) !== SHORT_URL) failures.push(label(d));
        }
    assert.deepEqual(failures, []);
  });

  test("every eye combination the editor allows decodes, and the unreliable table is accurate", () => {
    const failures: string[] = [];
    let allowed = 0;
    for (const outer of EYE_FRAME_SHAPES)
      for (const inner of EYE_FRAME_SHAPES)
        for (const center of EYE_CENTER_SHAPES) {
          const eyes = { outer, inner, center };
          if (!isReliableEyeCombo(eyes)) continue;
          allowed++;
          for (const fill of [FILLS.solid, FILLS.linear]) {
            const d = design((x) => {
              x.eyes = { ...x.eyes, ...eyes };
              x.modules.fill = fill;
            });
            if (decodeDesign(SHORT_URL, d) !== SHORT_URL) failures.push(label(d));
          }
          // Also on the dark signature style (inverted colors, rounded modules).
          const dark = { ...structuredClone(DEFAULT_QR_DESIGN), eyes: { ...DEFAULT_QR_DESIGN.eyes, ...eyes } };
          if (decodeDesign(SHORT_URL, dark) !== SHORT_URL) failures.push(`dark ${label(dark)}`);
        }
    assert.deepEqual(failures, []);
    assert.ok(allowed >= 40, `${allowed} reliable combinations`);
  });

  test("the signature dark style (light modules on zinc, texture, coral eyes)", () => {
    assert.equal(decodeDesign(SHORT_URL, DEFAULT_QR_DESIGN), SHORT_URL);
  });

  test("error correction levels, logo plate shapes and sizes within the recommended range", () => {
    for (const errorCorrection of ["L", "M", "Q", "H"] as const)
      assert.equal(decodeDesign(SHORT_URL, design((x) => void (x.errorCorrection = errorCorrection))), SHORT_URL, errorCorrection);
    for (const shape of ["square", "rounded", "circle"] as const)
      for (const size of [0.1, 0.2, 0.25]) {
        const d = design((x) => void (x.logo = { src: LOGO_DATA_URL, size, margin: 1, background: "#FFFFFF", shape }));
        const status = analyzeDesign(d, buildQRGeometry(SHORT_URL, d)).status;
        if (status !== "error") assert.equal(decodeDesign(SHORT_URL, d), SHORT_URL, `${shape} ${size}`);
      }
  });

  test("margins from the minimum to the maximum", () => {
    for (const margin of [2, 4, 10]) assert.equal(decodeDesign(SHORT_URL, design((x) => void (x.margin = margin))), SHORT_URL, String(margin));
  });

  test("static contents decode to the exact payload, special characters included", () => {
    const contents = [
      { type: "url" as const, url: "https://exemple.fr/café?q=1&r=été" },
      { ...defaultContent("wifi"), ssid: 'Café;"Guest"', password: "p@ss:w;rd\\", security: "WPA" as const, hidden: true },
      { ...defaultContent("vcard"), firstName: "Zoë", lastName: "Müller", organization: "A, B; C", phone: "+49 30 123456", email: "zoe@example.de", city: "Berlin" },
      { type: "email" as const, to: "hello@example.com", subject: "Réservation & menu", body: "Bonjour,\nune table pour 4 ?" },
      { type: "sms" as const, phone: "+33 6 12 34 56 78", message: "Table 4 🍷 merci !" },
      { type: "phone" as const, phone: "+33 6 12 34 56 78" },
    ];
    for (const content of contents) {
      const payload = contentPayload(content);
      assert.equal(decodeDesign(payload, design(() => {}), 640), payload, content.type);
    }
  });
});
