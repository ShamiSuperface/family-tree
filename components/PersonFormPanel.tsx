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
        className="h-full w-full max-w-md overflow-hidden bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {editing ? `עריכת ${editing.firstName} ${editing.lastName}` : "הוספת קרוב משפחה"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
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
