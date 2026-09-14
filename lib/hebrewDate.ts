import { isMonthDayOnly, isYearOnly } from "@/lib/dateUtils";

const hebrewFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  day: "numeric",
  month: "long",
});

/** Hebrew-calendar equivalent of a concrete Gregorian date, e.g. "ה' בשבט תשפ״ד". */
export function hebrewDateOf(date: Date): string {
  return hebrewFormatter.format(date);
}

/**
 * Hebrew-calendar equivalent of a full Gregorian date string, e.g. "ה' בשבט תשפ״ד".
 * Returns null when only the year or only the day/month is known, since a
 * partial date can't be reliably converted.
 */
export function toHebrewDateString(date: string | null): string | null {
  if (!date || isYearOnly(date) || isMonthDayOnly(date)) return null;
  return hebrewDateOf(new Date(date));
}
