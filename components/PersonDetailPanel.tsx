"use client";

import { useEffect } from "react";
import type { Person } from "@/types/family";
import { formatPersonDate } from "@/lib/dateUtils";
import { toHebrewDateString } from "@/lib/hebrewDate";

interface Props {
  person: Person | null;
  people: Person[];
  onClose: () => void;
  onEdit?: (person: Person) => void;
}

function formatDateLine(date: string | null): string {
  const gregorian = formatPersonDate(date);
  const hebrew = toHebrewDateString(date);
  return hebrew ? `${gregorian} (${hebrew})` : gregorian;
}

export default function PersonDetailPanel({ person, people, onClose, onEdit }: Props) {
  useEffect(() => {
    if (!person) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [person, onClose]);

  if (!person) return null;

  const byId = new Map(people.map((p) => [p.id, p]));
  const marriages = person.spouses
    .map((spouseId) => byId.get(spouseId))
    .filter((spouse): spouse is Person => Boolean(spouse))
    .map((spouse) => ({ spouse, date: person.marriageDates[spouse.id] }));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-stone-900/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-amber-50 to-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-amber-800 hover:bg-amber-100"
          >
            סגירה ✕
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(person)}
              className="rounded-full border-2 border-amber-500 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              עריכה ✎
            </button>
          )}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.photo}
          alt={`${person.firstName} ${person.lastName}`}
          className="mx-auto h-40 w-40 rounded-full bg-amber-50 object-cover ring-4 ring-amber-300"
        />

        <h2 className="mt-4 text-center text-2xl font-semibold text-stone-900">
          {person.firstName} {person.lastName}
        </h2>

        <p className="mt-1 text-center text-sm font-medium text-amber-800">
          {formatDateLine(person.birthDate)}
          {person.deathDate ? ` – ${formatDateLine(person.deathDate)}` : ""}
        </p>

        {marriages.length > 0 && (
          <div className="mt-3 space-y-1 text-center text-sm text-stone-600">
            {marriages.map(({ spouse, date }) => (
              <p key={spouse.id}>
                💍 {spouse.firstName} {spouse.lastName}
                {date ? ` — נישאו ב-${formatPersonDate(date)}` : ""}
              </p>
            ))}
          </div>
        )}

        {person.bio && (
          <p className="mt-6 whitespace-pre-line leading-relaxed text-stone-700">
            {person.bio}
          </p>
        )}

        {person.gallery.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-amber-900">גלריה</h3>
            <div className="grid grid-cols-3 gap-2">
              {person.gallery.map((item) =>
                item.type === "photo" ? (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    title={item.filename}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-20 w-full rounded-lg border-2 border-amber-300 object-cover"
                    />
                  </a>
                ) : (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    title={item.filename}
                    className="flex h-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-amber-300 bg-amber-50 px-1 text-amber-800"
                  >
                    <span className="text-2xl">📄</span>
                    <span className="line-clamp-1 w-full text-center text-[10px]">
                      {item.filename}
                    </span>
                  </a>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
