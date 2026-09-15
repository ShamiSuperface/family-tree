"use client";

import type { Person } from "@/types/family";
import type { PersonInput } from "@/lib/peopleStore";
import PersonForm from "./PersonForm";

interface Props {
  open: boolean;
  people: Person[];
  editing?: Person;
  onClose: () => void;
  onSubmit: (input: PersonInput) => Promise<void>;
  onDelete?: () => void;
}

export default function PersonFormPanel({ open, people, editing, onClose, onSubmit, onDelete }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-hidden bg-gradient-to-b from-amber-50 to-[var(--surface)] p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-lg font-semibold text-amber-900">
            {editing ? `עריכת ${editing.firstName} ${editing.lastName}` : "הוספת קרוב משפחה"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-amber-800 hover:bg-amber-100"
          >
            סגירה ✕
          </button>
        </div>
        <PersonForm
          people={people}
          initial={editing}
          onSubmit={onSubmit}
          onCancel={onClose}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
