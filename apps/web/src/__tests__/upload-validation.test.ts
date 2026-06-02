import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUpload } from "../lib/upload-validation";

function makeBlob(sizeBytes: number, type: string): Blob {
  return new Blob([new Uint8Array(sizeBytes)], { type });
}

describe("Upload validation (S7-03)", () => {
  it("accepts valid JPEG under size limit", () => {
    const result = validateUpload(makeBlob(1024, "image/jpeg"));
    expect(result.valid).toBe(true);
  });

  it("accepts PNG and WebP", () => {
    expect(validateUpload(makeBlob(1024, "image/png")).valid).toBe(true);
    expect(validateUpload(makeBlob(1024, "image/webp")).valid).toBe(true);
  });

  it("rejects file exceeding 10 MB", () => {
    const result = validateUpload(makeBlob(MAX_UPLOAD_BYTES + 1, "image/jpeg"));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("rejects PDF (not an allowed image type)", () => {
    const result = validateUpload(makeBlob(1024, "application/pdf"));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not allowed");
  });

  it("rejects executable content", () => {
    const result = validateUpload(makeBlob(1024, "application/octet-stream"));
    expect(result.valid).toBe(false);
  });

  it("rejects empty MIME type", () => {
    const result = validateUpload(makeBlob(1024, ""));
    expect(result.valid).toBe(false);
  });
});
