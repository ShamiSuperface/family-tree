import { NextResponse } from "next/server";
import { getMemories, addMemory, type MemoryInput } from "@/lib/memoriesStore";
import { readPeople } from "@/lib/peopleStore";

export async function GET() {
  try {
    const memories = await getMemories();
    return NextResponse.json(memories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const input = (await request.json()) as MemoryInput;

  if (input.personId) {
    const people = await readPeople();
    if (!people.some((p) => p.id === input.personId)) {
      return NextResponse.json({ error: "מזהה קרוב לא קיים" }, { status: 400 });
    }
  }

  try {
    const memory = await addMemory(input);
    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    const status = message.includes("לא מוגדרת") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
