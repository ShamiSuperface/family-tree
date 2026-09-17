import type { Person } from "@/types/family";
import { isMonthDayOnly } from "@/lib/dateUtils";

export type TimelineEventType = "birth" | "death" | "marriage";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  personIds: string[];
  /** "YYYY-MM-DD" or "YYYY" — a marriage date without a year can't be placed, so it's excluded. */
  date: string;
  year: number;
}

function eventTime(dateStr: string): number {
  if (/^\d{4}$/.test(dateStr)) return new Date(Number(dateStr), 0, 1).getTime();
  return new Date(dateStr).getTime();
}

/** Every dated birth, death and marriage in the family, oldest first. */
export function buildTimelineEvents(people: Person[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const person of people) {
    if (person.birthDate && !isMonthDayOnly(person.birthDate)) {
      events.push({
        id: `birth-${person.id}`,
        type: "birth",
        personIds: [person.id],
        date: person.birthDate,
        year: Number(person.birthDate.slice(0, 4)),
      });
    }
    if (person.deathDate && !isMonthDayOnly(person.deathDate)) {
      events.push({
        id: `death-${person.id}`,
        type: "death",
        personIds: [person.id],
        date: person.deathDate,
        year: Number(person.deathDate.slice(0, 4)),
      });
    }
    for (const spouseId of person.spouses) {
      if (person.id >= spouseId) continue; // avoid listing each marriage twice
      const dateStr = person.marriageDates[spouseId];
      if (dateStr && !isMonthDayOnly(dateStr)) {
        events.push({
          id: `marriage-${person.id}-${spouseId}`,
          type: "marriage",
          personIds: [person.id, spouseId],
          date: dateStr,
          year: Number(dateStr.slice(0, 4)),
        });
      }
    }
  }

  return events.sort((a, b) => eventTime(a.date) - eventTime(b.date));
}
