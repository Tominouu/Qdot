"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createQRCode } from "@/lib/api/qr";
import { DEFAULT_QR_STYLE } from "@/lib/qr/presets";

/** Parses `name,url` rows (header optional) and creates one QR code per row. */
function parseCsv(text: string): { name: string; url: string }[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")))
    .filter(([name, url]) => name && url && /^https?:\/\//i.test(url))
    .map(([name, url]) => ({ name, url }));
}

export function CsvImportButton({ onImported }: { onImported: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const rows = parseCsv(await file.text());
          if (!rows.length) {
            toast("No valid rows found. Expected: name,url", "warning");
            return;
          }
          setBusy(true);
          for (const row of rows) {
            await createQRCode({ name: row.name, destinationUrl: row.url, type: "url", category: "website", style: DEFAULT_QR_STYLE });
          }
          setBusy(false);
          toast(`Imported ${rows.length} QR code${rows.length > 1 ? "s" : ""}`);
          onImported();
        }}
      />
      <Button variant="secondary" size="md" className="h-[42px] border-line text-muted-2" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? "Importing…" : "Import from CSV"}
      </Button>
    </>
  );
}
