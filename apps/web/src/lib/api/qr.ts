import { mockShortUrl } from "@/data/qr-codes";
import { USE_MOCK_API } from "@/lib/config";
import { generateSlug } from "@/lib/qr/slug";
import { CreateQRCodeSchema, UpdateQRCodeSchema, type CreateQRCodeInput, type QRCode, type QRStatus, type UpdateQRCodeInput } from "@/types";
import { ApiError, apiRequest, toQuery } from "./client";
import { delay, mockWorkspaceId, readStore, writeStore } from "./mock-store";

export interface ListQRCodesParams {
  status?: QRStatus;
  search?: string;
}

export async function listQRCodes(params: ListQRCodesParams = {}): Promise<QRCode[]> {
  if (!USE_MOCK_API) return apiRequest<QRCode[]>(`/qr${toQuery({ ...params })}`);

  const search = params.search?.trim().toLowerCase();
  const ws = mockWorkspaceId();
  const items = readStore()
    .qrCodes.filter((q) => q.workspaceId === ws)
    .filter((q) => !params.status || q.status === params.status)
    .filter((q) => !search || q.name.toLowerCase().includes(search) || (q.destinationUrl ?? "").toLowerCase().includes(search));
  return delay(items);
}

export async function getQRCode(id: string): Promise<QRCode> {
  if (!USE_MOCK_API) return apiRequest<QRCode>(`/qr/${encodeURIComponent(id)}`);

  const qr = readStore().qrCodes.find((q) => q.id === id && q.workspaceId === mockWorkspaceId());
  if (!qr) throw new ApiError("QR code not found", 404, "QR_NOT_FOUND");
  return delay(qr);
}

/** The API assigns the public code; the response carries `code` and `shortUrl`. */
export async function createQRCode(input: CreateQRCodeInput): Promise<QRCode> {
  if (!USE_MOCK_API) return apiRequest<QRCode>("/qr", { method: "POST", body: JSON.stringify(input) });

  // Same validation and normalization as the API.
  const parsed = CreateQRCodeSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid request.", 400, "VALIDATION_ERROR");
  const data = parsed.data;
  const now = new Date().toISOString();
  const code = generateSlug(8);
  const qr: QRCode = {
    id: `qr_${crypto.randomUUID().slice(0, 8)}`,
    workspaceId: mockWorkspaceId(),
    code,
    shortUrl: mockShortUrl(code),
    name: data.name || "Untitled QR code",
    type: data.content.type,
    mode: data.mode,
    category: data.category,
    content: data.content,
    contentRedacted: false,
    destinationUrl: data.mode === "dynamic" && data.content.type === "url" ? data.content.url : null,
    status: data.status,
    design: data.design,
    campaignId: data.campaignId ?? null,
    totalScans: 0,
    uniqueScans: 0,
    lastScanAt: null,
    createdAt: now,
    updatedAt: now,
  };
  writeStore((s) => {
    s.qrCodes.unshift(qr);
    if (qr.campaignId) s.campaigns.find((c) => c.id === qr.campaignId)?.qrCodeIds.push(qr.id);
  });
  return delay(qr);
}

export async function updateQRCode(id: string, patch: UpdateQRCodeInput): Promise<QRCode> {
  if (!USE_MOCK_API) return apiRequest<QRCode>(`/qr/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });

  const parsed = UpdateQRCodeSchema.safeParse(patch);
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid request.", 400, "VALIDATION_ERROR");
  const { content, design, ...fields } = parsed.data;
  const current = readStore().qrCodes.find((q) => q.id === id && q.workspaceId === mockWorkspaceId());
  if (current?.mode === "dynamic" && content && content.type !== "url")
    throw new ApiError("Dynamic QR codes can only point to a URL.", 400, "VALIDATION_ERROR");
  let updated: QRCode | undefined;
  writeStore((s) => {
    const qr = s.qrCodes.find((q) => q.id === id && q.workspaceId === mockWorkspaceId());
    if (!qr) return;
    Object.assign(qr, Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)), { updatedAt: new Date().toISOString() });
    if (fields.name !== undefined) qr.name = fields.name || "Untitled QR code";
    if (design) qr.design = design;
    if (content) {
      qr.content = content;
      qr.type = content.type;
      if (qr.mode === "dynamic" && content.type === "url") qr.destinationUrl = content.url;
    }
    updated = qr;
  });
  if (!updated) throw new ApiError("QR code not found", 404, "QR_NOT_FOUND");
  return delay(updated);
}

export async function deleteQRCode(id: string): Promise<void> {
  if (!USE_MOCK_API) return apiRequest<void>(`/qr/${encodeURIComponent(id)}`, { method: "DELETE" });

  writeStore((s) => {
    s.qrCodes = s.qrCodes.filter((q) => !(q.id === id && q.workspaceId === mockWorkspaceId()));
    for (const c of s.campaigns) c.qrCodeIds = c.qrCodeIds.filter((q) => q !== id);
  });
  return delay(undefined);
}
