import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 40 * 1024 * 1024;

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "העלאה זמינה רק בהרצה מקומית" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "סוג קובץ לא נתמך (רק תמונות, סרטונים או PDF)" }, { status: 400 });
  }
  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_SIZE;
  if (file.size > maxSize) {
    const limitLabel = isVideo ? "40MB" : "5MB";
    return NextResponse.json({ error: `הקובץ גדול מדי (מקסימום ${limitLabel})` }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "photos");
  await mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({ path: `/photos/${filename}` });
}
