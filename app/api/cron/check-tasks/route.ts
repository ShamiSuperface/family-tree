import { NextResponse } from "next/server";
import { readPeople } from "@/lib/peopleStore";
import { getTasks, deleteTask } from "@/lib/tasksStore";
import type { Person, Task } from "@/types/family";

function isTaskComplete(task: Task, byId: Map<string, Person>): boolean {
  if (!task.autoCheck || !task.personId) return false;
  const person = byId.get(task.personId);
  if (!person) return false;

  if (task.autoCheck.field === "birthDate") {
    return Boolean(person.birthDate);
  }
  if (task.autoCheck.field === "marriageDate" && task.autoCheck.spouseId) {
    return Boolean(person.marriageDates[task.autoCheck.spouseId]);
  }
  return false;
}

/** Runs daily: removes any auto-checkable task whose underlying data has since been filled in. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }
  }

  try {
    const people = await readPeople();
    const byId = new Map(people.map((p) => [p.id, p]));

    const tasks = await getTasks();
    const openTasks = tasks.filter((t) => !t.done);

    let removed = 0;
    for (const task of openTasks) {
      if (isTaskComplete(task, byId)) {
        await deleteTask(task.id);
        removed++;
      }
    }

    return NextResponse.json({ checked: openTasks.length, removed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
