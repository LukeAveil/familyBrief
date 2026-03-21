import { VISION_IMAGE_MEDIA_TYPES } from "@/lib/anthropic";

export const MAX_PARSE_IMAGE_BYTES = 10 * 1024 * 1024;

function extMimeFromFilename(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

/**
 * Picks a concrete MIME for Claude: PDF, a vision-supported raster type, or null if unsupported.
 * Falls back to the filename when `file.type` is empty.
 */
export function resolveMediaTypeForVision(file: File): string | null {
  if (file.type === "application/pdf") return "application/pdf";
  if (file.type && VISION_IMAGE_MEDIA_TYPES.has(file.type)) return file.type;
  if (file.type?.startsWith("image/")) {
    return VISION_IMAGE_MEDIA_TYPES.has(file.type) ? file.type : null;
  }
  return extMimeFromFilename(file.name);
}

export type UploadFileValidation =
  | { ok: true; file: File }
  | { ok: false; error: string };

export function validateUploadedFile(raw: unknown): UploadFileValidation {
  if (!raw || !(raw instanceof File)) {
    return { ok: false, error: "Missing file" };
  }
  if (raw.size === 0) {
    return { ok: false, error: "Empty file" };
  }
  if (raw.size > MAX_PARSE_IMAGE_BYTES) {
    return { ok: false, error: "File too large (max 10MB)" };
  }
  return { ok: true, file: raw };
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}
