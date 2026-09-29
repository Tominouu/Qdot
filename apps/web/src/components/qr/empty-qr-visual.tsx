import { DEFAULT_QR_DESIGN } from "@/lib/qr/presets";
import { StyledQR } from "./styled-qr";

/** Soft-edged QR illustration used by the "No QR codes yet" empty state. */
export function EmptyQRVisual() {
  return (
    <div className="relative size-[200px] animate-pop" aria-hidden>
      <div className="absolute inset-0 rounded-3xl bg-surface blur-2xl" />
      <div className="relative rounded-xl bg-surface p-0 [mask-image:radial-gradient(circle,black_62%,transparent_100%)]">
        <StyledQR value="https://qr.example.com/welcome" design={DEFAULT_QR_DESIGN} size={200} title="" />
      </div>
    </div>
  );
}
