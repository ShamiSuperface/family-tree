import { NextResponse } from "next/server";
import { readPeople } from "@/lib/peopleStore";
import { buildEvents } from "@/lib/events";
import { sendReminderEmail } from "@/lib/mailer";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }
  }

  const people = await readPeople();
  const tomorrow = buildEvents(people).filter((event) => event.daysUntil === 1);

  if (tomorrow.length === 0) {
    return NextResponse.json({ sent: false, events: 0 });
  }

  await sendReminderEmail(tomorrow);
  return NextResponse.json({ sent: true, events: tomorrow.length });
}
