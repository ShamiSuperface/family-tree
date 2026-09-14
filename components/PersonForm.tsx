"use client";

import { useId, useState, type FormEvent } from "react";
import type { Person } from "@/types/family";
import type { PersonInput } from "@/lib/peopleStore";

interface Props {
  people: Person[];
  initial?: Person;
  onSubmit: (input: PersonInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

function toInput(person?: Person): PersonInput {
  return {
    firstName: person?.firstName ?? "",
    lastName: person?.lastName ?? "",
    gender: person?.gender ?? "male",
    birthDate: person?.birthDate ?? null,
    deathDate: person?.deathDate ?? null,
    photo: person?.photo ?? "/placeholder-avatar.svg",
    bio: person?.bio ?? "",
    parents: person?.parents ?? [],
    spouses: person?.spouses ?? [],
    children: person?.children ?? [],
  };
}

function RelationPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Person[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-neutral-700">{label}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-neutral-400">אין עדיין אנשים אחרים במערכת</p>
      ) : (
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-2">
          {options.map((person) => (
            <label key={person.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(person.id)}
                onChange={(e) => {
                  onChange(
                    e.target.checked
                      ? [...selected, person.id]
                      : selected.filter((id) => id !== person.id),
                  );
                }}
              />
              {person.firstName} {person.lastName}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export default function PersonForm({ people, initial, onSubmit, onCancel, onDelete }: Props) {
  const [input, setInput] = useState<PersonInput>(() => toInput(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const uid = useId();

  const otherPeople = people.filter((p) => p.id !== initial?.id);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-firstName`} className="mb-1 block text-sm font-medium text-neutral-700">
              שם פרטי *
            </label>
            <input
              id={`${uid}-firstName`}
              required
              type="text"
              value={input.firstName}
              onChange={(e) => setInput({ ...input, firstName: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-lastName`} className="mb-1 block text-sm font-medium text-neutral-700">
              שם משפחה *
            </label>
            <input
              id={`${uid}-lastName`}
              required
              type="text"
              value={input.lastName}
              onChange={(e) => setInput({ ...input, lastName: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${uid}-gender`} className="mb-1 block text-sm font-medium text-neutral-700">
            מגדר
          </label>
          <select
            id={`${uid}-gender`}
            value={input.gender}
            onChange={(e) => setInput({ ...input, gender: e.target.value as "male" | "female" })}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400"
          >
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-birthDate`} className="mb-1 block text-sm font-medium text-neutral-700">
              תאריך לידה
            </label>
            <input
              id={`${uid}-birthDate`}
              type="date"
              value={input.birthDate ?? ""}
              onChange={(e) => setInput({ ...input, birthDate: e.target.value || null })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-deathDate`} className="mb-1 block text-sm font-medium text-neutral-700">
              תאריך פטירה
            </label>
            <input
              id={`${uid}-deathDate`}
              type="date"
              value={input.deathDate ?? ""}
              onChange={(e) => setInput({ ...input, deathDate: e.target.value || null })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${uid}-bio`} className="mb-1 block text-sm font-medium text-neutral-700">
            סיפור / ביוגרפיה
          </label>
          <textarea
            id={`${uid}-bio`}
            value={input.bio}
            onChange={(e) => setInput({ ...input, bio: e.target.value })}
            rows={4}
            className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400"
          />
        </div>

        <RelationPicker
          label="הורים"
          options={otherPeople}
          selected={input.parents}
          onChange={(ids) => setInput({ ...input, parents: ids })}
        />
        <RelationPicker
          label="בני/בנות זוג"
          options={otherPeople}
          selected={input.spouses}
          onChange={(ids) => setInput({ ...input, spouses: ids })}
        />
        <RelationPicker
          label="ילדים"
          options={otherPeople}
          selected={input.children}
          onChange={(ids) => setInput({ ...input, children: ids })}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "שומר..." : "שמירה"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          ביטול
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            מחיקה
          </button>
        )}
      </div>
    </form>
  );
}
