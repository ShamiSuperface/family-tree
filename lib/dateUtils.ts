/**
 * Dates are stored as one of:
 * - "YYYY-MM-DD" — a full, exact date
 * - "YYYY" — only the year is known (birth/death dates)
 * - "MM-DD" — only the day and month are known, no year (marriage dates)
 * - null — unknown
 */

export function isYearOnly(date: string | null): boolean {
  return !!date && /^\d{4}$/.test(date);
}

export function isMonthDayOnly(date: string | null): boolean {
  return !!date && /^\d{2}-\d{2}$/.test(date);
}

/** The year to show on a compact card, or "?" when only day/month (no year) is known. */
export function dateYear(date: string | null): string {
  if (!date) return "?";
  if (isMonthDayOnly(date)) return "?";
  return date.slice(0, 4);
}

/** Current age for a living person, or null if deceased or the birth year isn't known. */
export function livingAge(birthDate: string | null, deathDate: string | null): number | null {
  if (deathDate || !birthDate || isMonthDayOnly(birthDate)) return null;
  const birthYear = Number(birthDate.slice(0, 4));
  return new Date().getFullYear() - birthYear;
}

export function formatPersonDate(date: string | null): string {
  if (!date) return "לא ידוע";
  if (isYearOnly(date)) return date;
  if (isMonthDayOnly(date)) {
    const [month, day] = date.split("-").map(Number);
    return new Date(2000, month - 1, day).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
    });
  }
  return new Date(date).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
