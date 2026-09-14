"use client";

import { useEffect } from "react";
import type { Person } from "@/types/family";

interface Props {
  person: Person | null;
  onClose: () => void;
  onEdit?: (person: Person) => void;
}

function formatDate(date: string | null): string {
  if (!date) return "לא ידוע";
  return new Date(date).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PersonDetailPanel({ person, onClose, onEdit }: Props) {
  useEffect(() => {
    if (!person) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [person, onClose]);

  if (!person) return null;

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
              className="rounded-full border border-amber-300 px-3 py-1 text-sm text-amber-800 hover:bg-amber-100"
            >
              עריכה ✎
            </button>
          )}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.photo}
          alt={`${person.firstName} ${person.lastName}`}
          className="mx-auto h-40 w-40 rounded-full bg-amber-50 object-cover ring-4 ring-amber-100"
        />

        <h2 className="mt-4 text-center text-2xl font-semibold text-stone-900">
          {person.firstName} {person.lastName}
        </h2>

        <p className="mt-1 text-center text-sm text-amber-700">
          {formatDate(person.birthDate)}
          {person.deathDate ? ` – ${formatDate(person.deathDate)}` : ""}
        </p>

        {person.bio && (
          <p className="mt-6 whitespace-pre-line leading-relaxed text-stone-700">
            {person.bio}
          </p>
        )}
      </div>
    </div>
  );
}
