export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_SIZE = 40 * 1024 * 1024;

/** Checks an uploaded File's type/size, returning a Hebrew error message or null if valid. */
export function validateUpload(file: File): string | null {
  if (!ALLOWED_UPLOAD_TYPES[file.type]) {
    return "סוג קובץ לא נתמך (רק תמונות, סרטונים או PDF)";
  }
  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_UPLOAD_SIZE : MAX_UPLOAD_SIZE;
  if (file.size > maxSize) {
    const limitLabel = isVideo ? "40MB" : "5MB";
    return `הקובץ גדול מדי (מקסימום ${limitLabel})`;
  }
  return null;
}

export function mediaTypeOf(mimeType: string): "photo" | "video" | "document" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "document";
  return "photo";
}
