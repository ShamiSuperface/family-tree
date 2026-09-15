import { NextResponse } from "next/server";
import { getTasks, addTask, type TaskInput } from "@/lib/tasksStore";
import { readPeople } from "@/lib/peopleStore";

export async function GET() {
  try {
    const tasks = await getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const input = (await request.json()) as TaskInput;

  if (input.personId) {
    const people = await readPeople();
    if (!people.some((p) => p.id === input.personId)) {
      return NextResponse.json({ error: "מזהה קרוב לא קיים" }, { status: 400 });
    }
  }

  try {
    const task = await addTask(input);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    const status = message.includes("לא מוגדרת") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
