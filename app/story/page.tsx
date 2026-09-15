"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Person } from "@/types/family";
import { computeGenerations } from "@/lib/stats";
import { formatPersonDate } from "@/lib/dateUtils";
import ThemeToggle from "@/components/ThemeToggle";

const ORDINALS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שביעי", "שמיני", "תשיעי", "עשירי"];

function generationLabel(index: number): string {
  const ordinal = ORDINALS[index];
  return ordinal ? `הדור ה${ordinal}` : `דור ${index + 1}`;
}

function birthYearOf(person: Person): number {
  if (!person.birthDate || !/^\d{4}/.test(person.birthDate)) return 9999;
  return Number(person.birthDate.slice(0, 4));
}

export default function StoryPage() {
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

  const withBio = (people ?? []).filter((p) => p.bio.trim());
  const generations = computeGenerations(people ?? []);
  const generationCount = generations.size > 0 ? Math.max(...generations.values()) + 1 : 0;

  const chapters = Array.from({ length: generationCount }, (_, genIndex) => ({
    genIndex,
    people: withBio
      .filter((p) => generations.get(p.id) === genIndex)
      .sort((a, b) => {
        const parentKeyA = [...a.parents].sort().join("|");
        const parentKeyB = [...b.parents].sort().join("|");
        if (parentKeyA !== parentKeyB) return parentKeyA.localeCompare(parentKeyB);
        return birthYearOf(a) - birthYearOf(b);
      }),
  })).filter((chapter) => chapter.people.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-100">
      <header className="flex flex-col gap-2 border-b-2 border-amber-400 bg-gradient-to-l from-amber-200 via-orange-100 to-amber-100 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-950 sm:text-xl">סיפור המשפחה</h1>
          <p className="text-sm font-medium text-amber-900">הביוגרפיות של בני המשפחה, דור אחר דור</p>
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
        ) : chapters.length === 0 ? (
          <p className="text-center text-amber-900">
            עדיין אין סיפורים בעץ. אפשר להוסיף ביוגרפיה לכל אדם דרך עריכת הפרטים שלו/ה.
          </p>
        ) : (
          <div className="space-y-10">
            {chapters.map(({ genIndex, people: chapterPeople }) => {
              return (
                <section key={genIndex}>
                  <h2 className="mb-4 border-b-2 border-amber-400 pb-2 text-xl font-semibold text-amber-950">
                    {generationLabel(genIndex)}
                  </h2>
                  <div className="space-y-6">
                    {chapterPeople.map((person) => (
                      <div
                        key={person.id}
                        className="rounded-2xl border-2 border-amber-400 bg-[var(--surface)] p-4 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.photo}
                            alt={`${person.firstName} ${person.lastName}`}
                            className="h-14 w-14 shrink-0 rounded-full bg-amber-50 object-cover ring-2 ring-amber-300"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900">
                              {person.firstName} {person.lastName}
                            </p>
                            <p className="truncate text-sm font-medium text-amber-800">
                              {formatPersonDate(person.birthDate)}
                              {person.deathDate ? ` – ${formatPersonDate(person.deathDate)}` : ""}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
                          {person.bio}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
