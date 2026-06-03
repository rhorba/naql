import { describe, it, expect } from "vitest";
import { MockOcrAdapter, createOcrAdapter } from "../adapter";

describe("MockOcrAdapter", () => {
  it("returns mock text and confidence", async () => {
    const adapter = new MockOcrAdapter("AFRIQUIA 65.30 L 12.85", 0.9);
    const result = await adapter.extract(new Uint8Array([1, 2, 3]), "image/jpeg");
    expect(result.text).toBe("AFRIQUIA 65.30 L 12.85");
    expect(result.confidence).toBe(0.9);
    expect(result.provider).toBe("mock");
  });

  it("returns empty result with defaults", async () => {
    const adapter = new MockOcrAdapter();
    const result = await adapter.extract(new Uint8Array(), "image/png");
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
    expect(result.provider).toBe("mock");
  });

  it("accepts any image data", async () => {
    const adapter = new MockOcrAdapter("test", 0.5);
    const result = await adapter.extract(new Uint8Array(1000), "image/webp");
    expect(result.text).toBe("test");
  });
});

describe("createOcrAdapter", () => {
  it("returns MockOcrAdapter when no GOOGLE_VISION_API_KEY is set", () => {
    const originalKey = process.env.GOOGLE_VISION_API_KEY;
    delete process.env.GOOGLE_VISION_API_KEY;

    const adapter = createOcrAdapter();
    expect(adapter).toBeInstanceOf(MockOcrAdapter);

    process.env.GOOGLE_VISION_API_KEY = originalKey;
  });

  it("returns an adapter with extract method", () => {
    const adapter = createOcrAdapter();
    expect(typeof adapter.extract).toBe("function");
  });
});
