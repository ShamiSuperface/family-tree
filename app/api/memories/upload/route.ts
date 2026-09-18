import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { ALLOWED_UPLOAD_TYPES, validateUpload, mediaTypeOf } from "@/lib/uploadLimits";

/**
 * Public media upload for memories (unlike /api/upload, this must work in
 * production for any visitor — Vercel's filesystem isn't writable/persistent
 * there, so this goes to Vercel Blob storage instead of the local disk.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  }

  const error = validateUpload(file);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    const ext = ALLOWED_UPLOAD_TYPES[file.type];
    const filename = `memories/${crypto.randomUUID()}.${ext}`;
    const blob = await put(filename, file, { access: "public", contentType: file.type });
    return NextResponse.json({
      url: blob.url,
      type: mediaTypeOf(file.type),
      filename: file.name,
    });
  } catch (err) {
    console.error("Blob upload failed:", err);
    // TEMPORARY: surfaces the real error to the page while diagnosing the
    // Blob storage setup — revert to a plain generic message once resolved.
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `העלאת מדיה נכשלה (זמני, לצורך אבחון): ${detail}` },
      { status: 503 },
    );
  }
}
