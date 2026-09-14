import { isMonthDayOnly, isYearOnly } from "@/lib/dateUtils";

const dateFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HUNDREDS = ["", "ק", "ר", "ש", "ת"];
const GERESH = "׳";
const GERSHAYIM = "״";

/**
 * Converts a number to Hebrew numeral letters (gematria), e.g. 15 -> "ט״ו".
 * Uses the traditional טו / טז substitution to avoid spelling divine names.
 * `punctuate` adds a geresh/gershayim mark; day-of-month is traditionally
 * written without one (e.g. "ט תשרי"), while a year usually has one.
 */
function hebrewNumeral(num: number, punctuate: boolean): string {
  if (num <= 0) return "";
  let n = num;
  let letters = "";

  while (n >= 400) {
    letters += "ת";
    n -= 400;
  }
  if (n >= 100) {
    letters += HUNDREDS[Math.floor(n / 100)];
    n %= 100;
  }

  if (n === 15) {
    letters += "טו";
    n = 0;
  } else if (n === 16) {
    letters += "טז";
    n = 0;
  } else {
    if (n >= 10) {
      letters += TENS[Math.floor(n / 10)];
      n %= 10;
    }
    if (n > 0) {
      letters += ONES[n];
    }
  }

  if (!punctuate || letters.length === 0) return letters;
  if (letters.length === 1) return letters + GERESH;
  return letters.slice(0, -1) + GERSHAYIM + letters.slice(-1);
}

/** Hebrew-calendar equivalent of a concrete Gregorian date, e.g. "ט תשרי תשנ״ה". */
export function hebrewDateOf(date: Date): string {
  const parts = dateFormatter.formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 0);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? 0);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const dayLetters = hebrewNumeral(day, false);
  const yearLetters = hebrewNumeral(year % 1000, true);
  return `${dayLetters} ${month} ${yearLetters}`;
}

/**
 * Hebrew-calendar equivalent of a full Gregorian date string, e.g. "ט תשרי תשנ״ה".
 * Returns null when only the year or only the day/month is known, since a
 * partial date can't be reliably converted.
 */
export function toHebrewDateString(date: string | null): string | null {
  if (!date || isYearOnly(date) || isMonthDayOnly(date)) return null;
  return hebrewDateOf(new Date(date));
}
