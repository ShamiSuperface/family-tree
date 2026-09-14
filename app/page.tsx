"use client";

import { useEffect, useState } from "react";
import type { Person } from "@/types/family";
import type { PersonInput } from "@/lib/peopleStore";
import FamilyTreeView from "@/components/FamilyTreeView";
import PersonDetailPanel from "@/components/PersonDetailPanel";
import PersonFormPanel from "@/components/PersonFormPanel";

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

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">עץ המשפחה שלנו</h1>
          <p className="text-sm text-neutral-500">
            גררו וזמזמו כדי לנווט, לחצו על צומת כדי לראות פרטים
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + הוספת קרוב משפחה
        </button>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {!people ? (
          <div className="flex h-full items-center justify-center text-neutral-500">טוען...</div>
        ) : people.length === 0 || !rootId ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-500">
            <p>עדיין אין אנשים בעץ המשפחה</p>
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              הוספת האדם הראשון
            </button>
          </div>
        ) : (
          <FamilyTreeView people={people} rootId={rootId} onSelectPerson={setSelectedPerson} />
        )}
      </main>

      <PersonDetailPanel
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onEdit={openEditForm}
      />

      <PersonFormPanel
        open={formOpen}
        people={people ?? []}
        editing={editingPerson}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onDelete={editingPerson ? handleDelete : undefined}
      />
    </div>
  );
}
