"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Person } from "@/types/family";
import { groupByResidence } from "@/lib/familyMap";
import type { MapMarker } from "@/components/FamilyMapView";
import ThemeToggle from "@/components/ThemeToggle";
import PersonDetailPanel from "@/components/PersonDetailPanel";

const FamilyMapView = dynamic(() => import("@/components/FamilyMapView"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-amber-900">טוען מפה...</p>,
});

export default function MapPage() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [markers, setMarkers] = useState<MapMarker[] | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/people")
      .then((res) => res.json())
      .then((data: Person[]) => {
        if (!cancelled) setPeople(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!people) return;
    let cancelled = false;
    const groups = groupByResidence(people);

    Promise.all(
      groups.map(async (group) => {
        const res = await fetch(`/api/geocode?place=${encodeURIComponent(group.place)}`);
        if (!res.ok) return null;
        const location = (await res.json()) as { lat: number; lon: number } | null;
        return location ? { ...group, ...location } : null;
      }),
    ).then((results) => {
      if (!cancelled) {
        setMarkers(results.filter((m): m is MapMarker => m !== null));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [people]);

  const residenceCount = people ? groupByResidence(people).length : 0;

  return (
    <div className="flex h-dvh w-screen flex-col bg-gradient-to-b from-amber-100 to-orange-100">
      <header className="flex flex-col gap-2 border-b-2 border-amber-400 bg-gradient-to-l from-amber-200 via-orange-100 to-amber-100 px-4 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-950 sm:text-xl">מפת המשפחה</h1>
          <p className="text-sm font-medium text-amber-900">איפה בני המשפחה גרים</p>
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

      <main className="relative flex-1">
        {!people ? (
          <div className="flex h-full items-center justify-center text-amber-900">טוען...</div>
        ) : residenceCount === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-amber-900">
            עדיין לא הוזן מקום מגורים לאף אחד בעץ המשפחה. אפשר להוסיף בעריכת כל בן משפחה.
          </div>
        ) : !markers ? (
          <div className="flex h-full items-center justify-center text-amber-900">מאתר מקומות על המפה...</div>
        ) : (
          <FamilyMapView markers={markers} onSelectPerson={setSelectedPerson} />
        )}
      </main>

      <PersonDetailPanel
        person={selectedPerson}
        people={people ?? []}
        onClose={() => setSelectedPerson(null)}
        onSelectPerson={setSelectedPerson}
      />
    </div>
  );
}
