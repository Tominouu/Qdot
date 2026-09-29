import { DEFAULT_QR_DESIGN, type QRDesign } from "@/types";

export { DEFAULT_QR_DESIGN };

/** Returns a copy of the default design with some parts replaced. */
export function withDesign(patch: (d: QRDesign) => void): QRDesign {
  const d = structuredClone(DEFAULT_QR_DESIGN);
  patch(d);
  return d;
}

/** Style presets shown in the landing "Beautiful customization" section. */
export const SHOWCASE_PRESETS: { name: string; design: QRDesign }[] = [
  { name: "Gradient Tech", design: DEFAULT_QR_DESIGN },
  {
    name: "Amber Circles",
    design: withDesign((d) => {
      d.modules.shape = "circle";
      d.eyes = { ...d.eyes, outer: "rounded", inner: "rounded", center: "circle" };
    }),
  },
  {
    name: "Classy Sunset",
    design: withDesign((d) => {
      d.modules = { shape: "classy-rounded", textured: false, fill: { type: "linear", rotation: 45, stops: [{ offset: 0, color: "#FAFAFA" }, { offset: 1, color: "#F4A261" }] } };
      d.eyes = { ...d.eyes, outer: "circle", inner: "circle", center: "dot" };
    }),
  },
];
