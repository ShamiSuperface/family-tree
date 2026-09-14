import nodemailer from "nodemailer";
import type { FamilyEvent } from "@/lib/events";

const TYPE_LABEL: Record<FamilyEvent["type"], string> = {
  birthday: "יום הולדת",
  memorial: "יום זיכרון",
  anniversary: "יום נישואין",
};

export function eventsEmailBody(events: FamilyEvent[]): string {
  const lines = events.map((event) => `• ${TYPE_LABEL[event.type]}: ${event.title}`);
  return `תזכורת לאירועים משפחתיים שחלים מחר:\n\n${lines.join("\n")}`;
}

export async function sendReminderEmail(events: FamilyEvent[]): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.REMINDER_EMAIL || user;

  if (!user || !pass || !to) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD / REMINDER_EMAIL not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"עץ המשפחה" <${user}>`,
    to,
    subject: `תזכורת: ${events.length} אירועים משפחתיים מחר`,
    text: eventsEmailBody(events),
  });
}
