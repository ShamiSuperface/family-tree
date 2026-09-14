import type { Person } from "@/types/family";
import { isYearOnly } from "@/lib/dateUtils";

export type FamilyEventType = "birthday" | "memorial" | "anniversary";

export interface FamilyEvent {
  id: string;
  type: FamilyEventType;
  title: string;
  personIds: string[];
  nextDate: Date;
  daysUntil: number;
  yearsCount: number;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextOccurrence(month: number, day: number, today: Date): Date {
  const year = today.getFullYear();
  let candidate = startOfDay(new Date(year, month - 1, day));
  if (candidate < today) {
    candidate = startOfDay(new Date(year + 1, month - 1, day));
  }
  return candidate;
}

function fullName(person: Person): string {
  return `${person.firstName} ${person.lastName}`;
}

interface RawEvent {
  type: FamilyEventType;
  title: string;
  personIds: string[];
  dateStr: string;
}

export function buildEvents(people: Person[], now: Date = new Date()): FamilyEvent[] {
  const today = startOfDay(now);
  const byId = new Map(people.map((p) => [p.id, p]));
  const raw: RawEvent[] = [];

  for (const person of people) {
    if (person.birthDate && !isYearOnly(person.birthDate)) {
      raw.push({
        type: "birthday",
        title: `יום הולדת ל${fullName(person)}`,
        personIds: [person.id],
        dateStr: person.birthDate,
      });
    }
    if (person.deathDate && !isYearOnly(person.deathDate)) {
      raw.push({
        type: "memorial",
        title: `יום זיכרון ל${fullName(person)}`,
        personIds: [person.id],
        dateStr: person.deathDate,
      });
    }
    for (const spouseId of person.spouses) {
      if (person.id < spouseId) {
        const dateStr = person.marriageDates[spouseId];
        if (dateStr && !isYearOnly(dateStr)) {
          const spouse = byId.get(spouseId);
          raw.push({
            type: "anniversary",
            title: `יום נישואין של ${fullName(person)}${spouse ? ` ו${fullName(spouse)}` : ""}`,
            personIds: [person.id, spouseId],
            dateStr,
          });
        }
      }
    }
  }

  return raw
    .map((item) => {
      const [yearStr, monthStr, dayStr] = item.dateStr.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      const nextDate = nextOccurrence(month, day, today);
      const daysUntil = Math.round((nextDate.getTime() - today.getTime()) / 86400000);
      const yearsCount = nextDate.getFullYear() - year;
      return {
        id: `${item.type}-${item.personIds.join("-")}`,
        type: item.type,
        title: item.title,
        personIds: item.personIds,
        nextDate,
        daysUntil,
        yearsCount,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
