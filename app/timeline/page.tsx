"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Person } from "@/types/family";
import { formatPersonDate } from "@/lib/dateUtils";
import { toHebrewDateString } from "@/lib/hebrewDate";
import { buildTimelineEvents, type TimelineEvent } from "@/lib/timeline";
import ThemeToggle from "@/components/ThemeToggle";

const TYPE_ICON: Record<TimelineEvent["type"], string> = {
  birth: "👶",
  death: "🕯️",
  marriage: "💍",
};

function fullName(person: Person): string {
  return `${person.firstName} ${person.lastName}`;
}

function eventTitle(event: TimelineEvent, byId: Map<string, Person>): string {
  const [first, second] = event.personIds.map((id) => byId.get(id));
  if (!first) return "";
  switch (event.type) {
    case "birth":
      return `${fullName(first)} נולד${first.gender === "female" ? "ה" : ""}`;
    case "death":
      return `${fullName(first)} נפטר${first.gender === "female" ? "ה" : ""}`;
    case "marriage":
      return second ? `${fullName(first)} ו${fullName(second)} נישאו` : `${fullName(first)} נישא/ה`;
  }
}

function decadeLabel(year: number): string {
  const start = Math.floor(year / 10) * 10;
  return `${start}–${start + 9}`;
}

function formatDateLine(date: string): string {
  const gregorian = formatPersonDate(date);
  const hebrew = toHebrewDateString(date);
  return hebrew ? `${gregorian} (${hebrew})` : gregorian;
}

export default function TimelinePage() {
  const [people, setPeople] = useState<Person[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/people")
      .then((res) => res.json())
      .then((data: Person[]) => {
        if (!cancelled) setPeople(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allPeople = people ?? [];
  const byId = new Map(allPeople.map((p) => [p.id, p]));
  const events = buildTimelineEvents(allPeople);

  const decades = Array.from(new Set(events.map((e) => Math.floor(e.year / 10) * 10))).map(
    (start) => ({
      start,
      events: events.filter((e) => Math.floor(e.year / 10) * 10 === start),
    }),
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-100">
      <header className="flex flex-col gap-2 border-b-2 border-amber-400 bg-gradient-to-l from-amber-200 via-orange-100 to-amber-100 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-950 sm:text-xl">ציר זמן משפחתי</h1>
          <p className="text-sm font-medium text-amber-900">לידות, נישואין ופטירות, מהעבר הרחוק להיום</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <ThemeToggle />
          <Link
            href="/"
            className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
          >
            חזרה לעץ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {!people ? (
          <p className="text-center text-amber-900">טוען...</p>
        ) : decades.length === 0 ? (
          <p className="text-center text-amber-900">
            עדיין אין תאריכים בעץ המשפחה (תאריכי לידה, פטירה או נישואין)
          </p>
        ) : (
          <div className="relative space-y-10 before:absolute before:bottom-0 before:right-[27px] before:top-2 before:w-0.5 before:bg-amber-300 sm:before:right-[31px]">
            {decades.map(({ start, events: decadeEvents }) => (
              <section key={start}>
                <h2 className="mb-4 border-b-2 border-amber-400 pb-2 text-xl font-semibold text-amber-950">
                  <bdi dir="ltr">{decadeLabel(start)}</bdi>
                </h2>
                <ul className="space-y-3">
                  {decadeEvents.map((event) => (
                    <li key={event.id} className="relative flex items-center gap-4 ps-0">
                      <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-[var(--surface)] text-2xl shadow-md">
                        {TYPE_ICON[event.type]}
                      </span>
                      <div className="min-w-0 flex-1 rounded-2xl border-2 border-amber-400 bg-[var(--surface)] px-4 py-3 shadow-md">
                        <p className="font-medium text-stone-900">{eventTitle(event, byId)}</p>
                        <p className="text-sm font-medium text-amber-800">{formatDateLine(event.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
