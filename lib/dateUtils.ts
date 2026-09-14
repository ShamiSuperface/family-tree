/** Dates are stored either as a full "YYYY-MM-DD" string, a year-only "YYYY" string, or null. */

export function isYearOnly(date: string | null): boolean {
  return !!date && /^\d{4}$/.test(date);
}

export function formatPersonDate(date: string | null): string {
  if (!date) return "לא ידוע";
  if (isYearOnly(date)) return date;
  return new Date(date).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
