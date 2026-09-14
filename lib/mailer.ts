import nodemailer from "nodemailer";
import type { FamilyEvent } from "@/lib/events";

const TYPE_LABEL: Record<FamilyEvent["type"], string> = {
  birthday: "יום הולדת",
  memorial: "יום זיכרון",
  anniversary: "יום נישואין",
};

const TYPE_ICON: Record<FamilyEvent["type"], string> = {
  birthday: "🎂",
  memorial: "🕯️",
  anniversary: "💍",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function eventsEmailText(events: FamilyEvent[]): string {
  const lines = events.map((event) => `• ${TYPE_LABEL[event.type]}: ${event.title}`);
  return `תזכורת לאירועים משפחתיים שחלים מחר:\n\n${lines.join("\n")}`;
}

export function eventsEmailHtml(events: FamilyEvent[]): string {
  const items = events
    .map(
      (event) => `
        <li style="margin-bottom: 10px; font-size: 16px;">
          <span style="font-size: 20px;">${TYPE_ICON[event.type]}</span>
          <strong>${TYPE_LABEL[event.type]}:</strong> ${escapeHtml(event.title)}
        </li>`,
    )
    .join("");

  return `
    <div dir="rtl" lang="he" style="font-family: Arial, Helvetica, sans-serif; text-align: right; color: #292524; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #92400e; margin-bottom: 16px;">תזכורת לאירועים משפחתיים שחלים מחר</h2>
      <ul style="padding-right: 20px; padding-left: 0; margin: 0; list-style-position: inside;">
        ${items}
      </ul>
    </div>`;
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
    text: eventsEmailText(events),
    html: eventsEmailHtml(events),
  });
}
