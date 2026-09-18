import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { ALLOWED_UPLOAD_TYPES, validateUpload } from "@/lib/uploadLimits";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "העלאה זמינה רק בהרצה מקומית" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  }

  const error = validateUpload(file);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "photos");
  await mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ALLOWED_UPLOAD_TYPES[file.type]}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({ path: `/photos/${filename}` });
}
