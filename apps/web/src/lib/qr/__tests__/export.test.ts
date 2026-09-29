import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_QR_DESIGN, type QRDesign } from "@/types";
import { exportSvg, fileNameFor } from "../export";
import { buildQRGeometry } from "../render/geometry";
import { decodeSvg, LOGO_DATA_URL } from "./helpers";

const PAYLOAD = "https://qr.qdot.com/r/abcd2345";

function styled(): QRDesign {
  const d = structuredClone(DEFAULT_QR_DESIGN);
  d.modules = { shape: "classy-rounded", textured: false, fill: { type: "linear", rotation: 30, stops: [{ offset: 0, color: "#101010" }, { offset: 1, color: "#1D3557" }] } };
  d.eyes = { outer: "circle", inner: "circle", center: "dot", frameColor: "#101010", centerColor: "#E8503A" };
  d.background = { color: "#FFFFFF", transparent: false, image: null };
  d.logo = { src: LOGO_DATA_URL, size: 0.2, margin: 0.5, background: "#FFFFFF", shape: "circle" };
  return d;
}

describe("SVG export", () => {
  test("keeps dimensions, gradient, logo and quiet zone, and decodes", () => {
    const svg = exportSvg(PAYLOAD, styled(), 2000);
    assert.match(svg, /^<svg [^>]*width="2000" height="2000"/);
    assert.match(svg, /<linearGradient id="qdot-fill" gradientUnits="userSpaceOnUse"[^>]*><stop offset="0" stop-color="#101010"\/><stop offset="1" stop-color="#1D3557"\/><\/linearGradient>/);
    assert.match(svg, /fill="url\(#qdot-fill\)"/);
    assert.ok(svg.includes(`href="${LOGO_DATA_URL}"`), "logo embedded, no external reference");
    const viewBox = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1]);
    const symbol = buildQRGeometry(PAYLOAD, styled());
    assert.equal(symbol.errorCorrection, "H", "a logo raises auto error correction to H");
    assert.equal(viewBox, symbol.size + 2 * styled().margin, "symbol + quiet zone on both sides");
    assert.equal(decodeSvg(svg), PAYLOAD);
  });

  test("transparent background: no background shape at all", () => {
    const d = styled();
    d.background.transparent = true;
    const svg = exportSvg(PAYLOAD, d);
    assert.doesNotMatch(svg, /<rect width=/);
    assert.equal(decodeSvg(svg, 480, "#FFFFFF"), PAYLOAD, "decodes once placed on a light surface");
  });

  test("background image is embedded under the modules with its opacity", () => {
    const d = styled();
    d.background.image = { src: LOGO_DATA_URL, opacity: 0.2 };
    const svg = exportSvg(PAYLOAD, d);
    assert.ok(svg.indexOf('opacity="0.2"') < svg.indexOf("<path"), "image drawn before modules");
    assert.equal(decodeSvg(svg), PAYLOAD);
  });

  test("PNG export path: the same SVG rasterized at print resolution decodes", () => {
    for (const size of [512, 1024, 3000]) assert.equal(decodeSvg(exportSvg(PAYLOAD, styled(), size), size), PAYLOAD, String(size));
  });

  test("legacy exports are unchanged in kind: v1 codes still export and decode", () => {
    const legacySvg = exportSvg(PAYLOAD, DEFAULT_QR_DESIGN);
    assert.equal(decodeSvg(legacySvg), PAYLOAD);
  });

  test("file names", () => {
    assert.equal(fileNameFor("Menu d'été 2026!", "pdf"), "menu-d-ete-2026.pdf");
    assert.equal(fileNameFor("   ", "svg"), "qdot-qr.svg");
  });
});
