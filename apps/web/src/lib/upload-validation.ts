/** Max upload size: 10 MB */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Allowed image MIME types for receipt OCR */
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUpload(file: Blob): UploadValidationResult {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` };
  }

  const mimeType = file.type.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return { valid: false, error: `File type not allowed: ${mimeType}` };
  }

  return { valid: true };
}
