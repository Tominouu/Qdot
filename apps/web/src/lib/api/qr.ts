import { USE_MOCK_API } from "@/lib/config";
import type { CreateQRCodeInput, QRCode, QRStatus, UpdateQRCodeInput } from "@/types";
import { ApiError, apiRequest, toQuery } from "./client";
import { generateSlug } from "@/lib/qr/slug";
import { delay, readStore, writeStore } from "./mock-store";

export interface ListQRCodesParams {
  status?: QRStatus;
  search?: string;
}

export async function listQRCodes(params: ListQRCodesParams = {}): Promise<QRCode[]> {
  if (!USE_MOCK_API) return apiRequest<QRCode[]>(`/qr-codes${toQuery({ ...params })}`);

  const search = params.search?.trim().toLowerCase();
  const items = readStore()
    .qrCodes.filter((q) => !params.status || q.status === params.status)
    .filter((q) => !search || q.name.toLowerCase().includes(search) || q.destinationUrl.toLowerCase().includes(search));
  return delay(items);
}

export async function getQRCode(id: string): Promise<QRCode> {
  if (!USE_MOCK_API) return apiRequest<QRCode>(`/qr-codes/${encodeURIComponent(id)}`);

  const qr = readStore().qrCodes.find((q) => q.id === id);
  if (!qr) throw new ApiError("QR code not found", 404);
  return delay(qr);
}

export async function createQRCode(input: CreateQRCodeInput): Promise<QRCode> {
  if (!USE_MOCK_API) return apiRequest<QRCode>("/qr-codes", { method: "POST", body: JSON.stringify(input) });

  const now = new Date().toISOString();
  const qr: QRCode = {
    id: `qr_${crypto.randomUUID().slice(0, 8)}`,
    slug: input.slug ?? generateSlug(),
    name: input.name.trim() || "Untitled QR code",
    type: input.type,
    category: input.category,
    destinationUrl: input.destinationUrl.trim(),
    status: input.status ?? "active",
    style: input.style,
    campaignId: input.campaignId ?? null,
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
  if (!USE_MOCK_API)
    return apiRequest<QRCode>(`/qr-codes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });

  let updated: QRCode | undefined;
  writeStore((s) => {
    const qr = s.qrCodes.find((q) => q.id === id);
    if (!qr) return;
    Object.assign(qr, patch, { updatedAt: new Date().toISOString() });
    updated = qr;
  });
  if (!updated) throw new ApiError("QR code not found", 404);
  return delay(updated);
}

export async function deleteQRCode(id: string): Promise<void> {
  if (!USE_MOCK_API) return apiRequest<void>(`/qr-codes/${encodeURIComponent(id)}`, { method: "DELETE" });

  writeStore((s) => {
    s.qrCodes = s.qrCodes.filter((q) => q.id !== id);
    for (const c of s.campaigns) c.qrCodeIds = c.qrCodeIds.filter((q) => q !== id);
  });
  return delay(undefined);
}
