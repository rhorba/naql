export interface OcrResult {
  text: string;
  confidence: number; // 0–1
  provider: "google_vision" | "aws_textract" | "mock";
}

export interface OcrAdapter {
  extract(imageData: Uint8Array, mimeType: string): Promise<OcrResult>;
}

/** Mock adapter for tests — returns empty result */
export class MockOcrAdapter implements OcrAdapter {
  private _mockText: string;
  private _mockConfidence: number;

  constructor(mockText = "", mockConfidence = 0) {
    this._mockText = mockText;
    this._mockConfidence = mockConfidence;
  }

  async extract(_imageData: Uint8Array, _mimeType: string): Promise<OcrResult> {
    return { text: this._mockText, confidence: this._mockConfidence, provider: "mock" };
  }
}

/** Google Vision adapter — requires GOOGLE_VISION_API_KEY */
export class GoogleVisionAdapter implements OcrAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extract(imageData: Uint8Array, _mimeType: string): Promise<OcrResult> {
    const base64 = Buffer.from(imageData).toString("base64");

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!response.ok) throw new Error(`Vision API error: ${response.status}`);

    const data = (await response.json()) as {
      responses: Array<{
        fullTextAnnotation?: { text: string; pages: Array<{ confidence?: number }> };
      }>;
    };

    const annotation = data.responses[0]?.fullTextAnnotation;
    if (!annotation) return { text: "", confidence: 0, provider: "google_vision" };

    const confidence = annotation.pages[0]?.confidence ?? 0.9;
    return { text: annotation.text, confidence, provider: "google_vision" };
  }
}

/** Factory: returns the appropriate adapter based on env */
export function createOcrAdapter(): OcrAdapter {
  const googleKey = process.env.GOOGLE_VISION_API_KEY;
  if (googleKey) return new GoogleVisionAdapter(googleKey);
  return new MockOcrAdapter();
}
