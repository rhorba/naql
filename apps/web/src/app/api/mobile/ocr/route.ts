import { createOcrAdapter } from "@naql/ocr";
import { CONFIDENCE_THRESHOLD, parseReceipt } from "@naql/ocr";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

/**
 * POST /api/mobile/ocr
 * Body: multipart/form-data with `receipt` (image) + optional `mimeType`
 * Returns a ReceiptDraft — front-end shows it for human review before saving
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(authHeader.slice(7), secret);
    if (payload.role !== "driver") {
      return NextResponse.json({ error: "Driver role required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let imageData: Uint8Array;
  let mimeType = "image/jpeg";

  try {
    const formData = await request.formData();
    const file = formData.get("receipt");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No receipt file" }, { status: 400 });
    }
    const buffer = await (file as Blob).arrayBuffer();
    imageData = new Uint8Array(buffer);
    mimeType = (file as Blob).type || mimeType;
  } catch {
    return NextResponse.json({ error: "Failed to read image" }, { status: 400 });
  }

  const adapter = createOcrAdapter();
  const ocrResult = await adapter.extract(imageData, mimeType);
  const parsed = parseReceipt(ocrResult.text, ocrResult.confidence);

  return NextResponse.json({
    draft: {
      litres: parsed.litres,
      pricePerLitre: parsed.pricePerLitre ? parsed.pricePerLitre / 100 : undefined, // send as MAD for display
      total: parsed.total ? parsed.total / 100 : undefined,
      date: parsed.date?.toISOString(),
      station: parsed.station,
      confidence: parsed.confidence,
      requiresReview: parsed.confidence < CONFIDENCE_THRESHOLD,
    },
    ocrText: ocrResult.text, // for debugging; omit in production logs
    provider: ocrResult.provider,
  });
}
