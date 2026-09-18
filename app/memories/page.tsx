"use client";

import { Suspense, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { MediaItem, Memory, Person } from "@/types/family";
import ThemeToggle from "@/components/ThemeToggle";

// Editing is only available when running the site locally (`npm run dev`).
const EDITING_ENABLED = process.env.NODE_ENV === "development";

function formatMemoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function fetchMemories(): Promise<{ memories: Memory[]; unavailable: boolean }> {
  const res = await fetch("/api/memories");
  if (res.ok) return { memories: (await res.json()) as Memory[], unavailable: false };
  return { memories: [], unavailable: true };
}

function MemoriesPageContent() {
  const searchParams = useSearchParams();
  const [people, setPeople] = useState<Person[]>([]);
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [memoriesUnavailable, setMemoriesUnavailable] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [personIds, setPersonIds] = useState<string[]>(() => {
    const id = searchParams.get("personId");
    return id ? [id] : [];
  });
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const loadMemories = async () => {
    const { memories: data, unavailable } = await fetchMemories();
    setMemories(data);
    setMemoriesUnavailable(unavailable);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/people")
      .then((res) => res.json())
      .then((data: Person[]) => {
        if (!cancelled) setPeople(data);
      });
    fetchMemories().then(({ memories: data, unavailable }) => {
      if (!cancelled) {
        setMemories(data);
        setMemoriesUnavailable(unavailable);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const peopleById = new Map(people.map((p) => [p.id, p]));

  const handleDeleteMemory = async (id: string) => {
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    setMemories((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
  };

  const handleMediaChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaUploading(true);
    setMediaError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/memories/upload", { method: "POST", body: formData });
      const data = (await res.json()) as MediaItem & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "שגיאה בהעלאת המדיה");
      setMedia({ id: crypto.randomUUID(), url: data.url, type: data.type, filename: data.filename, year: null });
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "שגיאה בהעלאת המדיה");
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          text,
          personIds,
          media,
          website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "שגיאה בשליחה");
      }
      setAuthorName("");
      setText("");
      setPersonIds([]);
      setMedia(null);
      await loadMemories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-100">
      <header className="flex flex-col gap-2 border-b-2 border-amber-400 bg-gradient-to-l from-amber-200 via-orange-100 to-amber-100 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-950 sm:text-xl">פינת זיכרונות</h1>
          <p className="text-sm font-medium text-amber-900">
            כל בן משפחה מוזמן לשתף זיכרון, סיפור או אנקדוטה
          </p>
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
        {memoriesUnavailable && (
          <p className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            פינת הזיכרונות עדיין לא מוגדרת (חסר חיבור למסד נתונים). זו הגדרה חד-פעמית שצריך להשלים.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-3 rounded-2xl border-2 border-amber-400 bg-[var(--surface)] p-4 shadow-md"
        >
          <h2 className="text-sm font-semibold text-amber-900">הוספת זיכרון</h2>

          <input
            type="text"
            required
            placeholder="השם שלך"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={60}
            className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
          />

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-stone-700">
              על מי זה? (אפשר לסמן כמה אנשים, או להשאיר ריק עבור כלל המשפחה)
            </legend>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border-2 border-amber-300 p-2">
              {people.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-stone-800">
                  <input
                    type="checkbox"
                    checked={personIds.includes(p.id)}
                    onChange={(e) =>
                      setPersonIds(
                        e.target.checked
                          ? [...personIds, p.id]
                          : personIds.filter((id) => id !== p.id),
                      )
                    }
                  />
                  {p.firstName} {p.lastName}
                </label>
              ))}
            </div>
          </fieldset>

          <textarea
            required
            placeholder="הזיכרון שלך..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
          />

          <div>
            {media ? (
              <div className="flex items-center gap-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2">
                <span className="text-lg">
                  {media.type === "photo" ? "🖼️" : media.type === "video" ? "🎬" : "📄"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{media.filename}</span>
                <input
                  type="number"
                  placeholder="שנה"
                  value={media.year ?? ""}
                  onChange={(e) =>
                    setMedia({ ...media, year: e.target.value ? Number(e.target.value) : null })
                  }
                  min={1800}
                  max={new Date().getFullYear()}
                  className="w-20 shrink-0 rounded-lg border-2 border-amber-300 bg-[var(--surface)] px-2 py-1 text-sm text-stone-900 outline-none focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  aria-label="הסרת המדיה"
                  className="shrink-0 text-stone-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="inline-block cursor-pointer rounded-lg border-2 border-amber-500 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50">
                {mediaUploading ? "מעלה..." : "+ צירוף תמונה/סרטון/מסמך"}
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  onChange={handleMediaChange}
                  disabled={mediaUploading}
                  className="hidden"
                />
              </label>
            )}
            {mediaError && <p className="mt-1 text-sm text-red-600">{mediaError}</p>}
          </div>

          {/* Honeypot — hidden from real visitors, catches simple bots. */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || mediaUploading || memoriesUnavailable}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {submitting ? "שולח..." : "שליחת זיכרון"}
          </button>
        </form>

        {!memories ? (
          <p className="text-center text-amber-900">טוען...</p>
        ) : memoriesUnavailable ? null : memories.length === 0 ? (
          <p className="text-center text-amber-900">עדיין אין זיכרונות. היו הראשונים לשתף!</p>
        ) : (
          <ul className="space-y-3">
            {memories.map((memory) => {
              const taggedPeople = memory.personIds
                .map((id) => peopleById.get(id))
                .filter((p): p is Person => Boolean(p));
              return (
                <li
                  key={memory.id}
                  className="rounded-2xl border-2 border-amber-400 bg-[var(--surface)] px-4 py-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-line text-stone-800">{memory.text}</p>
                    {EDITING_ENABLED && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(memory.id)}
                        aria-label="מחיקת זיכרון"
                        className="shrink-0 text-stone-400 hover:text-red-600"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  {memory.media &&
                    (memory.media.type === "photo" ? (
                      <a href={memory.media.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memory.media.url}
                          alt={memory.media.filename}
                          className="mt-2 max-h-64 rounded-lg border-2 border-amber-300 object-cover"
                        />
                      </a>
                    ) : memory.media.type === "video" ? (
                      <video
                        src={memory.media.url}
                        controls
                        preload="metadata"
                        className="mt-2 max-h-64 w-full rounded-lg border-2 border-amber-300 bg-black"
                      />
                    ) : (
                      <a
                        href={memory.media.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                      >
                        📄 {memory.media.filename}
                      </a>
                    ))}
                  {memory.media?.year && (
                    <p className="mt-1 text-xs text-stone-500">מ-{memory.media.year}</p>
                  )}
                  <p className="mt-2 text-sm font-medium text-amber-800">
                    — {memory.authorName}, {formatMemoryDate(memory.createdAt)}
                    {taggedPeople.length > 0
                      ? ` · על ${taggedPeople.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function MemoriesPage() {
  return (
    <Suspense>
      <MemoriesPageContent />
    </Suspense>
  );
}
