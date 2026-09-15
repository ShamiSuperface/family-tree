import { NextResponse } from "next/server";
import { setTaskDone, deleteTask } from "@/lib/tasksStore";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { done } = (await request.json()) as { done: boolean };
  try {
    const task = await setTaskDone(id, done);
    if (!task) return NextResponse.json({ error: "המשימה לא נמצאה" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "מחיקה זמינה רק בהרצה מקומית" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
