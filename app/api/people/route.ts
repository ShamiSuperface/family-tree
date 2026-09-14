import { NextResponse } from "next/server";
import { readPeople, createPerson, type PersonInput } from "@/lib/peopleStore";

export async function GET() {
  const people = await readPeople();
  return NextResponse.json(people);
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "עריכה זמינה רק בהרצה מקומית" }, { status: 403 });
  }
  const input = (await request.json()) as PersonInput;
  try {
    const person = await createPerson(input);
    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
