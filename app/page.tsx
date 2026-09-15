"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Person } from "@/types/family";
import type { PersonInput } from "@/lib/peopleStore";
import { computeFamilyStats } from "@/lib/stats";
import FamilyTreeView from "@/components/FamilyTreeView";
import PersonDetailPanel from "@/components/PersonDetailPanel";
import PersonFormPanel from "@/components/PersonFormPanel";
import StatsBar from "@/components/StatsBar";

// Editing is only available when running the site locally (`npm run dev`).
// The publicly deployed production build is view-only.
const EDITING_ENABLED = process.env.NODE_ENV === "development";

function TreeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect x="14" y="19" width="4" height="11" rx="1.5" fill="#92400e" />
      <circle cx="16" cy="10" r="9" fill="#d97706" />
      <circle cx="9" cy="15" r="6" fill="#f59e0b" />
      <circle cx="23" cy="15" r="6" fill="#f59e0b" />
    </svg>
  );
}

export default function Home() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>(undefined);

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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/calendar"
            title="לוח אירועים"
            className="rounded-lg border-2 border-amber-500 bg-white px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
          >
            📅 <span className="hidden sm:inline">לוח אירועים</span>
          </Link>
          <Link
            href="/memories"
            title="פינת זיכרונות"
            className="rounded-lg border-2 border-amber-500 bg-white px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
          >
            💬 <span className="hidden sm:inline">פינת זיכרונות</span>
          </Link>
          {people && people.length > 0 && (
            <button
              type="button"
              onClick={handleBackup}
              title="גיבוי JSON"
              className="rounded-lg border-2 border-amber-500 bg-white px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
            >
              💾 <span className="hidden sm:inline">גיבוי JSON</span>
            </button>
          )}
          {EDITING_ENABLED && (
            <button
              type="button"
              onClick={openCreateForm}
              title="הוספת קרוב משפחה"
              className="rounded-lg bg-amber-800 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-amber-900 sm:px-4 sm:py-2"
            >
              + <span className="hidden sm:inline">הוספת קרוב משפחה</span>
            </button>
          )}
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
                className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
              >
                הוספת האדם הראשון
              </button>
            )}
          </div>
        ) : (
          <FamilyTreeView people={people} rootId={rootId} onSelectPerson={setSelectedPerson} />
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
