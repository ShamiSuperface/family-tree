import type { Person } from "@/types/family";
import { isMonthDayOnly } from "@/lib/dateUtils";
import { collectRawEvents } from "@/lib/events";

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Folds a line to <=75 octets per RFC 5545, splitting on UTF-8 byte boundaries. */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const chunks: string[] = [];
  let start = 0;
  let first = true;
  while (start < line.length) {
    const limit = first ? 75 : 74; // continuation lines lose a byte to the leading space
    let end = line.length;
    while (encoder.encode(line.slice(start, end)).length > limit) {
      end--;
    }
    chunks.push(line.slice(start, end));
    start = end;
    first = false;
  }
  return chunks.join("\r\n ");
}

function dateStamp(): string {
  const now = new Date();
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

/**
 * Builds a .ics calendar with one yearly-recurring all-day event per birthday,
 * memorial, and anniversary — importable into Google Calendar or any other app.
 */
export function buildIcsContent(people: Person[]): string {
  const raw = collectRawEvents(people);
  const stamp = dateStamp();
  const currentYear = new Date().getFullYear();

  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//שבט יעקב//עץ המשפחה//HE", "CALSCALE:GREGORIAN"];

  raw.forEach((item, index) => {
    let year: number;
    let month: number;
    let day: number;
    if (isMonthDayOnly(item.dateStr)) {
      [month, day] = item.dateStr.split("-").map(Number);
      year = currentYear;
    } else {
      const [yearStr, monthStr, dayStr] = item.dateStr.split("-");
      year = Number(yearStr);
      month = Number(monthStr);
      day = Number(dayStr);
    }
    const dtstart = `${year}${pad(month)}${pad(day)}`;

    lines.push(
      "BEGIN:VEVENT",
      foldLine(`UID:${item.type}-${item.personIds.join("-")}-${index}@family-tree`),
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      "RRULE:FREQ=YEARLY",
      foldLine(`SUMMARY:${escapeIcsText(item.title)}`),
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
