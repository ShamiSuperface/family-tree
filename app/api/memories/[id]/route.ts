import { NextResponse } from "next/server";
import { deleteMemory } from "@/lib/memoriesStore";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "מחיקה זמינה רק בהרצה מקומית" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteMemory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
