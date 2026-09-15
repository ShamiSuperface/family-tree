"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Person } from "@/types/family";
import type { PersonInput } from "@/lib/peopleStore";
import { computeFamilyStats } from "@/lib/stats";
import FamilyTreeView, { type FamilyTreeViewHandle } from "@/components/FamilyTreeView";
import PersonDetailPanel from "@/components/PersonDetailPanel";
import PersonFormPanel from "@/components/PersonFormPanel";
import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";

// Editing is only available when running the site locally (`npm run dev`).
// The publicly deployed production build is view-only.
const EDITING_ENABLED = process.env.NODE_ENV === "development";

function TreeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect x="14" y="19" width="4" height="11" rx="1.5" fill="var(--color-amber-800)" />
      <circle cx="16" cy="10" r="9" fill="var(--color-amber-600)" />
      <circle cx="9" cy="15" r="6" fill="var(--color-amber-500)" />
      <circle cx="23" cy="15" r="6" fill="var(--color-amber-500)" />
    </svg>
  );
}

export default function Home() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<"png" | "pdf" | false>(false);
  const treeRef = useRef<FamilyTreeViewHandle>(null);

  const matches = useMemo(() => {
    const q = query.trim();
    if (!q || !people) return [];
    return people
      .filter((person) => `${person.firstName} ${person.lastName}`.includes(q))
      .slice(0, 6);
  }, [people, query]);

  const selectSearchResult = (person: Person) => {
    treeRef.current?.zoomToPerson(person.id);
    setSelectedPerson(person);
    setQuery("");
  };

  const fetchPeople = async (): Promise<Person[]> => {
    const res = await fetch("/api/people");
    return (await res.json()) as Person[];
  };

  const loadPeople = async () => {
    setPeople(await fetchPeople());
  };

  useEffect(() => {
    let cancelled = false;
    fetchPeople().then((data) => {
      if (!cancelled) setPeople(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreateForm = () => {
    setEditingPerson(undefined);
    setFormOpen(true);
  };

  const openEditForm = (person: Person) => {
    setSelectedPerson(null);
    setEditingPerson(person);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingPerson(undefined);
  };

  const handleSubmit = async (input: PersonInput) => {
    const res = await fetch(editingPerson ? `/api/people/${editingPerson.id}` : "/api/people", {
      method: editingPerson ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "שגיאה בשמירה");
    }
    await loadPeople();
    closeForm();
  };

  const handleDelete = async () => {
    if (!editingPerson) return;
    if (!window.confirm(`למחוק את ${editingPerson.firstName} ${editingPerson.lastName}?`)) return;
    await fetch(`/api/people/${editingPerson.id}`, { method: "DELETE" });
    await loadPeople();
    closeForm();
  };

  const rootId = people?.find((person) => person.parents.length === 0)?.id ?? people?.[0]?.id;

  const handleExport = async (format: "png" | "pdf") => {
    setExporting(format);
    try {
      await treeRef.current?.exportTree(format);
    } finally {
      setExporting(false);
      setExportMenuOpen(false);
    }
  };

  const handleBackup = () => {
    if (!people) return;
    const blob = new Blob([JSON.stringify(people, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `family-tree-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-dvh w-screen flex-col bg-gradient-to-b from-amber-100 to-orange-100">
      <header className="flex flex-col gap-2 border-b-2 border-amber-400 bg-gradient-to-l from-amber-200 via-orange-100 to-amber-100 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <TreeIcon />
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-amber-950 sm:text-xl">שבט יעקב - עץ המשפחה שלנו</h1>
            <p className="hidden text-sm font-medium text-amber-900 sm:block">
              שוטטו בין הדורות, ולחצו על כל בן משפחה כדי להכיר את הסיפור שלו/ה
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {people && people.length > 0 && (
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש לפי שם..."
                className="w-full rounded-lg border-2 border-amber-400 bg-[var(--surface)] px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-amber-600 sm:py-2"
              />
              {matches.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border-2 border-amber-400 bg-[var(--surface)] shadow-md">
                  {matches.map((person) => (
                    <li key={person.id}>
                      <button
                        type="button"
                        onClick={() => selectSearchResult(person)}
                        className="block w-full px-3 py-2 text-start text-sm text-stone-800 hover:bg-amber-50"
                      >
                        {person.firstName} {person.lastName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Link
                href="/calendar"
                title="לוח אירועים"
                className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
              >
                📅 <span className="hidden sm:inline">לוח אירועים</span>
              </Link>
              <Link
                href="/memories"
                title="פינת זיכרונות"
                className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
              >
                💬 <span className="hidden sm:inline">פינת זיכרונות</span>
              </Link>
              <Link
                href="/tasks"
                title="לוח משימות"
                className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
              >
                📋 <span className="hidden sm:inline">לוח משימות</span>
              </Link>
              <Link
                href="/story"
                title="סיפור המשפחה"
                className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
              >
                📖 <span className="hidden sm:inline">סיפור המשפחה</span>
              </Link>
              {people && people.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExportMenuOpen((open) => !open)}
                    title="ייצוא/הדפסה"
                    className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
                  >
                    🖨️ <span className="hidden sm:inline">ייצוא/הדפסה</span>
                  </button>
                  {exportMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                      <ul className="absolute end-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border-2 border-amber-400 bg-[var(--surface)] shadow-md">
                        <li>
                          <button
                            type="button"
                            onClick={() => handleExport("png")}
                            disabled={exporting !== false}
                            className="block w-full px-3 py-2 text-start text-sm text-stone-800 hover:bg-amber-50 disabled:opacity-50"
                          >
                            🖼️ {exporting === "png" ? "מייצא תמונה..." : "שמירה כתמונה (PNG)"}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => handleExport("pdf")}
                            disabled={exporting !== false}
                            className="block w-full px-3 py-2 text-start text-sm text-stone-800 hover:bg-amber-50 disabled:opacity-50"
                          >
                            📄 {exporting === "pdf" ? "מייצא PDF..." : "שמירה כ-PDF"}
                          </button>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              )}
              {people && people.length > 0 && (
                <button
                  type="button"
                  onClick={handleBackup}
                  title="גיבוי JSON"
                  className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
                >
                  💾 <span className="hidden sm:inline">גיבוי JSON</span>
                </button>
              )}
              {EDITING_ENABLED && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  title="הוספת קרוב משפחה"
                  className="rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] sm:px-4 sm:py-2"
                >
                  + <span className="hidden sm:inline">הוספת קרוב משפחה</span>
                </button>
              )}
            </div>
        </div>
      </header>

      {people && people.length > 0 && <StatsBar stats={computeFamilyStats(people)} />}

      <main className="relative flex-1 overflow-hidden">
        {!people ? (
          <div className="flex h-full items-center justify-center text-amber-900">טוען...</div>
        ) : people.length === 0 || !rootId ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-amber-900">
            <p>עדיין אין אנשים בעץ המשפחה</p>
            {EDITING_ENABLED && (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                הוספת האדם הראשון
              </button>
            )}
          </div>
        ) : (
          <FamilyTreeView ref={treeRef} people={people} rootId={rootId} onSelectPerson={setSelectedPerson} />
        )}
      </main>

      <PersonDetailPanel
        person={selectedPerson}
        people={people ?? []}
        onClose={() => setSelectedPerson(null)}
        onEdit={EDITING_ENABLED ? openEditForm : undefined}
      />

      {EDITING_ENABLED && (
        <PersonFormPanel
          open={formOpen}
          people={people ?? []}
          editing={editingPerson}
          onClose={closeForm}
          onSubmit={handleSubmit}
          onDelete={editingPerson ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
