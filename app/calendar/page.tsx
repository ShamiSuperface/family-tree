"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Person } from "@/types/family";
import { buildEvents, type FamilyEvent } from "@/lib/events";

const TYPE_ICON: Record<FamilyEvent["type"], string> = {
  birthday: "🎂",
  memorial: "🕯️",
  anniversary: "💍",
};

const TYPE_LABEL: Record<FamilyEvent["type"], (years: number | null) => string> = {
  birthday: (years) => (years !== null ? `בן/בת ${years}` : ""),
  memorial: (years) => (years !== null ? `${years} שנים` : ""),
  anniversary: (years) => (years !== null ? `${years} שנות נישואין` : ""),
};

function formatWhen(daysUntil: number, date: Date): string {
  const dateStr = date.toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  if (daysUntil === 0) return `היום! (${dateStr})`;
  if (daysUntil === 1) return `מחר (${dateStr})`;
  return `בעוד ${daysUntil} ימים (${dateStr})`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<FamilyEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/people")
      .then((res) => res.json())
      .then((people: Person[]) => {
        if (!cancelled) setEvents(buildEvents(people));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="flex items-center justify-between border-b border-amber-200 bg-gradient-to-l from-amber-100 via-orange-50 to-amber-50 px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-amber-900">לוח אירועים משפחתי</h1>
          <p className="text-sm text-amber-700/80">ימי הולדת, ימי זיכרון וימי נישואין, מהקרוב לרחוק</p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-800 hover:bg-amber-100"
        >
          חזרה לעץ
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {!events ? (
          <p className="text-center text-amber-700">טוען...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-amber-700">
            עדיין אין תאריכים בעץ המשפחה (תאריכי לידה, פטירה או נישואין)
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-3xl">{TYPE_ICON[event.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-900">{event.title}</p>
                  <p className="text-sm text-amber-700">
                    {formatWhen(event.daysUntil, event.nextDate)}
                    {TYPE_LABEL[event.type](event.yearsCount) && ` · ${TYPE_LABEL[event.type](event.yearsCount)}`}
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
