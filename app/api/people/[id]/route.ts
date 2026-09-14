import { NextResponse } from "next/server";
import { updatePerson, deletePerson, type PersonInput } from "@/lib/peopleStore";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "עריכה זמינה רק בהרצה מקומית" }, { status: 403 });
  }
  const { id } = await params;
  const input = (await request.json()) as PersonInput;
  try {
    const person = await updatePerson(id, input);
    return NextResponse.json(person);
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "עריכה זמינה רק בהרצה מקומית" }, { status: 403 });
  }
  const { id } = await params;
  await deletePerson(id);
  return NextResponse.json({ ok: true });
}
