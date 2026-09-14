"use client";

import { useState } from "react";
import familyData from "@/data/family.json";
import type { Person } from "@/types/family";
import FamilyTreeView from "@/components/FamilyTreeView";
import PersonDetailPanel from "@/components/PersonDetailPanel";

const people = familyData as Person[];
const rootId = people.find((person) => person.parents.length === 0)?.id ?? people[0].id;

export default function Home() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">עץ המשפחה שלנו</h1>
        <p className="text-sm text-neutral-500">
          גררו וזמזמו כדי לנווט, לחצו על צומת כדי לראות פרטים
        </p>
      </header>
      <main className="relative flex-1 overflow-hidden">
        <FamilyTreeView people={people} rootId={rootId} onSelectPerson={setSelectedPerson} />
      </main>
      <PersonDetailPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} />
    </div>
  );
}
