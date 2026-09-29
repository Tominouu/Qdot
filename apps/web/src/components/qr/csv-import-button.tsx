"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createQRCode } from "@/lib/api/qr";
import { useI18n } from "@/lib/i18n/provider";
import { DEFAULT_QR_DESIGN } from "@/lib/qr/presets";

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
  const { t } = useI18n();

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
            toast(t.library.csv.noRows, "warning");
            return;
          }
          setBusy(true);
          for (const row of rows) {
            await createQRCode({ name: row.name, mode: "dynamic", content: { type: "url", url: row.url }, category: "website", design: DEFAULT_QR_DESIGN });
          }
          setBusy(false);
          toast(t.library.csv.imported(rows.length));
          onImported();
        }}
      />
      <Button variant="secondary" size="md" className="h-[42px] border-line text-muted-2" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? t.library.csv.importing : t.library.csv.import}
      </Button>
    </>
  );
}
