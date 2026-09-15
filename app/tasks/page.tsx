"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Person, Task } from "@/types/family";
import ThemeToggle from "@/components/ThemeToggle";

// Deleting a task is only available when running the site locally (`npm run dev`).
const EDITING_ENABLED = process.env.NODE_ENV === "development";

function formatTaskDate(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function fetchTasks(): Promise<{ tasks: Task[]; unavailable: boolean }> {
  const res = await fetch("/api/tasks");
  if (res.ok) return { tasks: (await res.json()) as Task[], unavailable: false };
  return { tasks: [], unavailable: true };
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [tasksUnavailable, setTasksUnavailable] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [personId, setPersonId] = useState<string>(searchParams.get("personId") ?? "");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    const { tasks: data, unavailable } = await fetchTasks();
    setTasks(data);
    setTasksUnavailable(unavailable);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/people")
      .then((res) => res.json())
      .then((data: Person[]) => {
        if (!cancelled) setPeople(data);
      });
    fetchTasks().then(({ tasks: data, unavailable }) => {
      if (!cancelled) {
        setTasks(data);
        setTasksUnavailable(unavailable);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const peopleById = new Map(people.map((p) => [p.id, p]));

  const handleToggleDone = async (task: Task) => {
    setTasks((prev) =>
      prev ? prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)) : prev,
    );
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
  };

  const handleDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          text,
          personId: personId || null,
          website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "שגיאה בשליחה");
      }
      setText("");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setSubmitting(false);
    }
  };

  const openTasks = tasks?.filter((t) => !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  const renderTask = (task: Task) => {
    const person = task.personId ? peopleById.get(task.personId) : undefined;
    return (
      <li
        key={task.id}
        className="flex items-start gap-3 rounded-2xl border-2 border-amber-400 bg-[var(--surface)] px-4 py-3 shadow-md"
      >
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => handleToggleDone(task)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className={`text-stone-800 ${task.done ? "line-through opacity-60" : ""}`}>
            {task.text}
          </p>
          <p className="mt-1 text-sm font-medium text-amber-800">
            — {task.authorName}, {formatTaskDate(task.createdAt)}
            {person ? ` · על ${person.firstName} ${person.lastName}` : ""}
          </p>
        </div>
        {EDITING_ENABLED && (
          <button
            type="button"
            onClick={() => handleDeleteTask(task.id)}
            aria-label="מחיקת משימה"
            className="shrink-0 text-stone-400 hover:text-red-600"
          >
            🗑
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-100">
      <header className="flex flex-col gap-2 border-b-2 border-amber-400 bg-gradient-to-l from-amber-200 via-orange-100 to-amber-100 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-950 sm:text-xl">לוח משימות משפחתי</h1>
          <p className="text-sm font-medium text-amber-900">
            מידע חסר או משימות לעץ המשפחה — כל בן משפחה מוזמן להוסיף ולסמן כשהושלם
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
        {tasksUnavailable && (
          <p className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            לוח המשימות עדיין לא מוגדר (חסר חיבור למסד נתונים). זו הגדרה חד-פעמית שצריך להשלים.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-3 rounded-2xl border-2 border-amber-400 bg-[var(--surface)] p-4 shadow-md"
        >
          <h2 className="text-sm font-semibold text-amber-900">הוספת משימה</h2>

          <input
            type="text"
            required
            placeholder="לדוגמה: חסר תאריך לידה לסבא משה"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="השם שלך"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={60}
              className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
            />
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600"
            >
              <option value="">כלל המשפחה</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
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
            disabled={submitting || tasksUnavailable}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {submitting ? "שולח..." : "הוספת משימה"}
          </button>
        </form>

        {!tasks ? (
          <p className="text-center text-amber-900">טוען...</p>
        ) : tasksUnavailable ? null : tasks.length === 0 ? (
          <p className="text-center text-amber-900">עדיין אין משימות. היו הראשונים להוסיף!</p>
        ) : (
          <>
            {openTasks.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-amber-900">משימות פתוחות</h2>
                <ul className="space-y-3">{openTasks.map(renderTask)}</ul>
              </div>
            )}
            {doneTasks.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-amber-900">✅ הושלמו</h2>
                <ul className="space-y-3">{doneTasks.map(renderTask)}</ul>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageContent />
    </Suspense>
  );
}
