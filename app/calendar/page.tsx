"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Person } from "@/types/family";
import { ageWord } from "@/lib/dateUtils";
import { hebrewDateOf } from "@/lib/hebrewDate";
import { buildEvents, type FamilyEvent } from "@/lib/events";
import { buildIcsContent } from "@/lib/ics";
import ThemeToggle from "@/components/ThemeToggle";

const TYPE_ICON: Record<FamilyEvent["type"], string> = {
  birthday: "🎂",
  memorial: "🕯️",
  anniversary: "💍",
};

function eventYearsLabel(event: FamilyEvent, byId: Map<string, Person>): string {
  if (event.yearsCount === null) return "";
  switch (event.type) {
    case "birthday": {
      if (event.deceased) return `נולד/ה לפני ${event.yearsCount} שנים`;
      const person = byId.get(event.personIds[0]);
      return `${person ? ageWord(person.gender) : "בן/בת"} ${event.yearsCount}`;
    }
    case "memorial":
      return `${event.yearsCount} שנים`;
    case "anniversary":
      return `${event.yearsCount} שנות נישואין`;
  }
}

function formatWhen(daysUntil: number, date: Date): string {
  const dateStr = date.toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  const hebrewStr = hebrewDateOf(date);
  const full = `${dateStr}, ${hebrewStr}`;
  if (daysUntil === 0) return `היום! (${full})`;
  if (daysUntil === 1) return `מחר (${full})`;
  return `בעוד ${daysUntil} ימים (${full})`;
}

export default function CalendarPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<FamilyEvent[] | null>(null);
  const [peopleById, setPeopleById] = useState<Map<string, Person>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/people")
      .then((res) => res.json())
      .then((data: Person[]) => {
        if (!cancelled) {
          setPeople(data);
          setEvents(buildEvents(data));
          setPeopleById(new Map(data.map((p) => [p.id, p])));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExportIcs = () => {
    const blob = new Blob([buildIcsContent(people)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "family-tree-events.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-100">
      <header className="flex flex-col gap-2 border-b-2 border-amber-400 bg-gradient-to-l from-amber-200 via-orange-100 to-amber-100 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-950 sm:text-xl">לוח אירועים משפחתי</h1>
          <p className="text-sm font-medium text-amber-900">ימי הולדת, ימי זיכרון וימי נישואין, מהקרוב לרחוק</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <ThemeToggle />
          {events && events.length > 0 && (
            <button
              type="button"
              onClick={handleExportIcs}
              title="ייצוא ליומן Google"
              className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
            >
              📆 <span className="hidden sm:inline">ייצוא ליומן</span>
            </button>
          )}
          <Link
            href="/"
            className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
          >
            חזרה לעץ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {!events ? (
          <p className="text-center text-amber-900">טוען...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-amber-900">
            עדיין אין תאריכים בעץ המשפחה (תאריכי לידה, פטירה או נישואין)
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-4 rounded-2xl border-2 border-amber-400 bg-[var(--surface)] px-4 py-3 shadow-md"
              >
                <span className="text-3xl">{TYPE_ICON[event.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-900">{event.title}</p>
                  <p className="text-sm font-medium text-amber-800">
                    {formatWhen(event.daysUntil, event.nextDate)}
                    {eventYearsLabel(event, peopleById) && ` · ${eventYearsLabel(event, peopleById)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
