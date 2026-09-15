"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import type { MediaItem, Person } from "@/types/family";
import type { PersonInput } from "@/lib/peopleStore";
import PartialDateInput from "./PartialDateInput";

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
    marriageDates: person?.marriageDates ?? {},
    gallery: person?.gallery ?? [],
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
      <legend className="mb-1 text-sm font-medium text-stone-700">{label}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-stone-400">אין עדיין אנשים אחרים במערכת</p>
      ) : (
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border-2 border-amber-300 p-2">
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

function SpousePicker({
  options,
  selected,
  marriageDates,
  onChangeSelected,
  onChangeDate,
}: {
  options: Person[];
  selected: string[];
  marriageDates: Record<string, string>;
  onChangeSelected: (ids: string[]) => void;
  onChangeDate: (spouseId: string, date: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-stone-700">בני/בנות זוג</legend>
      {options.length === 0 ? (
        <p className="text-sm text-stone-400">אין עדיין אנשים אחרים במערכת</p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border-2 border-amber-300 p-2">
          {options.map((person) => {
            const checked = selected.includes(person.id);
            return (
              <div key={person.id} className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      onChangeSelected(
                        e.target.checked
                          ? [...selected, person.id]
                          : selected.filter((id) => id !== person.id),
                      );
                    }}
                  />
                  {person.firstName} {person.lastName}
                </label>
                {checked && (
                  <PartialDateInput
                    id={`marriage-date-${person.id}`}
                    label="תאריך נישואין"
                    compact
                    value={marriageDates[person.id] ?? null}
                    onChange={(date) => onChangeDate(person.id, date ?? "")}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export default function PersonForm({ people, initial, onSubmit, onCancel, onDelete }: Props) {
  const [input, setInput] = useState<PersonInput>(() => toInput(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
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

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) throw new Error(data.error ?? "שגיאה בהעלאת התמונה");
      setInput((prev) => ({ ...prev, photo: data.path as string }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "שגיאה בהעלאת התמונה");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleGalleryChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setGalleryUploading(true);
    setGalleryError(null);
    try {
      const uploaded: MediaItem[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = (await res.json()) as { path?: string; error?: string };
        if (!res.ok || !data.path) throw new Error(data.error ?? `שגיאה בהעלאת ${file.name}`);
        const type = file.type.startsWith("video/")
          ? "video"
          : file.type === "application/pdf"
            ? "document"
            : "photo";
        uploaded.push({
          id: crypto.randomUUID(),
          url: data.path,
          type,
          filename: file.name,
        });
      }
      setInput((prev) => ({ ...prev, gallery: [...prev.gallery, ...uploaded] }));
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : "שגיאה בהעלאת קבצים");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };

  const removeGalleryItem = (id: string) => {
    setInput((prev) => ({ ...prev, gallery: prev.gallery.filter((item) => item.id !== id) }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">תמונה</label>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={input.photo}
              alt=""
              className="h-16 w-16 rounded-full bg-amber-50 object-cover ring-2 ring-amber-300"
            />
            <label className="cursor-pointer rounded-lg border-2 border-amber-500 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50">
              {uploading ? "מעלה..." : "בחירת תמונה"}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-firstName`} className="mb-1 block text-sm font-medium text-stone-700">
              שם פרטי *
            </label>
            <input
              id={`${uid}-firstName`}
              required
              type="text"
              value={input.firstName}
              onChange={(e) => setInput({ ...input, firstName: e.target.value })}
              className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-lastName`} className="mb-1 block text-sm font-medium text-stone-700">
              שם משפחה *
            </label>
            <input
              id={`${uid}-lastName`}
              required
              type="text"
              value={input.lastName}
              onChange={(e) => setInput({ ...input, lastName: e.target.value })}
              className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${uid}-gender`} className="mb-1 block text-sm font-medium text-stone-700">
            מגדר
          </label>
          <select
            id={`${uid}-gender`}
            value={input.gender}
            onChange={(e) => setInput({ ...input, gender: e.target.value as "male" | "female" })}
            className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
          >
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PartialDateInput
            id={`${uid}-birthDate`}
            label="תאריך לידה"
            value={input.birthDate}
            onChange={(value) => setInput({ ...input, birthDate: value })}
          />
          <PartialDateInput
            id={`${uid}-deathDate`}
            label="תאריך פטירה"
            value={input.deathDate}
            onChange={(value) => setInput({ ...input, deathDate: value })}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-bio`} className="mb-1 block text-sm font-medium text-stone-700">
            סיפור / ביוגרפיה
          </label>
          <textarea
            id={`${uid}-bio`}
            value={input.bio}
            onChange={(e) => setInput({ ...input, bio: e.target.value })}
            rows={4}
            className="w-full resize-none rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            גלריה (תמונות, סרטונים ומסמכים נוספים)
          </label>
          {input.gallery.length > 0 && (
            <ul className="mb-2 grid grid-cols-3 gap-2">
              {input.gallery.map((item) => (
                <li key={item.id} className="relative rounded-lg border-2 border-amber-300 p-1">
                  {item.type === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-16 w-full rounded object-cover"
                    />
                  ) : item.type === "video" ? (
                    <video
                      src={item.url}
                      muted
                      preload="metadata"
                      className="h-16 w-full rounded bg-black object-cover"
                    />
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-16 items-center justify-center rounded bg-amber-50 text-2xl"
                    >
                      📄
                    </a>
                  )}
                  <p className="mt-1 truncate text-center text-xs text-stone-600" title={item.filename}>
                    {item.filename}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(item.id)}
                    aria-label={`הסרת ${item.filename}`}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white hover:bg-red-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="inline-block cursor-pointer rounded-lg border-2 border-amber-500 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50">
            {galleryUploading ? "מעלה..." : "+ הוספת תמונות/סרטונים/מסמכים"}
            <input
              type="file"
              accept="image/*,video/*,application/pdf"
              multiple
              onChange={handleGalleryChange}
              disabled={galleryUploading}
              className="hidden"
            />
          </label>
          {galleryError && <p className="mt-1 text-sm text-red-600">{galleryError}</p>}
        </div>

        <RelationPicker
          label="הורים"
          options={otherPeople}
          selected={input.parents}
          onChange={(ids) => setInput({ ...input, parents: ids })}
        />
        <SpousePicker
          options={otherPeople}
          selected={input.spouses}
          marriageDates={input.marriageDates}
          onChangeSelected={(ids) => setInput({ ...input, spouses: ids })}
          onChangeDate={(spouseId, date) =>
            setInput((prev) => ({
              ...prev,
              marriageDates: date
                ? { ...prev.marriageDates, [spouseId]: date }
                : Object.fromEntries(
                    Object.entries(prev.marriageDates).filter(([k]) => k !== spouseId),
                  ),
            }))
          }
        />
        <RelationPicker
          label="ילדים"
          options={otherPeople}
          selected={input.children}
          onChange={(ids) => setInput({ ...input, children: ids })}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t-2 border-amber-400 pt-4 sm:gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-[var(--accent)] px-2.5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 sm:px-4"
        >
          {saving ? "שומר..." : "שמירה"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border-2 border-amber-500 px-2.5 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4"
        >
          ביטול
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 sm:px-4"
          >
            מחיקה
          </button>
        )}
      </div>
    </form>
  );
}
