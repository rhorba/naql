import { auth } from "@/auth";
import { validateUpload } from "@/lib/upload-validation";
import { CONFIDENCE_THRESHOLD, createOcrAdapter, parseReceipt } from "@naql/ocr";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let imageData: Uint8Array;
  let mimeType = "image/jpeg";

  try {
    const formData = await request.formData();
    const file = formData.get("receipt");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No receipt file" }, { status: 400 });
    }
    const validation = validateUpload(file as Blob);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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
      pricePerLitre: parsed.pricePerLitre ? parsed.pricePerLitre / 100 : undefined,
      total: parsed.total ? parsed.total / 100 : undefined,
      date: parsed.date?.toISOString(),
      station: parsed.station,
      confidence: parsed.confidence,
      requiresReview: parsed.confidence < CONFIDENCE_THRESHOLD,
    },
    provider: ocrResult.provider,
  });
}
