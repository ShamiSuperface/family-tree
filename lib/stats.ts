import type { Person } from "@/types/family";
import { isMonthDayOnly } from "@/lib/dateUtils";

function birthYearOf(person: Person): number | null {
  if (!person.birthDate || isMonthDayOnly(person.birthDate)) return null;
  return Number(person.birthDate.slice(0, 4));
}

/**
 * Generation 0 = the family's founders (no recorded parents); each child is
 * one more than the max of their parents' generations. Someone who married
 * in also has no recorded parents, so this first pass puts them at 0 too —
 * as a second pass, anyone with no recorded parents who has a spouse with a
 * higher generation is moved to sit alongside that spouse instead.
 */
export function computeGenerations(people: Person[]): Map<string, number> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const generation = new Map<string, number>();

  function resolve(id: string, seen: Set<string>): number {
    if (generation.has(id)) return generation.get(id) as number;
    if (seen.has(id)) return 0; // guard against a data cycle
    seen.add(id);
    const person = byId.get(id);
    if (!person || person.parents.length === 0) {
      generation.set(id, 0);
      return 0;
    }
    const gen = Math.max(...person.parents.map((pid) => resolve(pid, seen))) + 1;
    generation.set(id, gen);
    return gen;
  }

  for (const person of people) resolve(person.id, new Set());

  let changed = true;
  while (changed) {
    changed = false;
    for (const person of people) {
      if (person.parents.length > 0) continue; // has a real, parent-derived generation
      const spouseGens = person.spouses
        .map((sid) => generation.get(sid))
        .filter((g): g is number => g !== undefined);
      if (spouseGens.length === 0) continue;
      const best = Math.max(...spouseGens);
      if (best > (generation.get(person.id) as number)) {
        generation.set(person.id, best);
        changed = true;
      }
    }
  }

  return generation;
}

export interface FamilyStats {
  peopleCount: number;
  generationCount: number;
  /** Oldest/youngest currently-living person, by birth year. */
  oldest: { person: Person; year: number } | null;
  youngest: { person: Person; year: number } | null;
  earliestYear: number | null;
  yearSpan: number | null;
}

export function computeFamilyStats(people: Person[]): FamilyStats {
  const generations = computeGenerations(people);
  const generationCount = generations.size > 0 ? Math.max(...generations.values()) + 1 : 0;

  const withYears = people
    .map((person) => ({ person, year: birthYearOf(person) }))
    .filter((x): x is { person: Person; year: number } => x.year !== null);

  // The year-span stat covers the family's whole recorded history, so it's
  // anchored to the earliest-born person overall, living or not.
  const earliestBorn = withYears.length
    ? withYears.reduce((min, cur) => (cur.year < min.year ? cur : min))
    : null;

  const livingWithYears = withYears.filter((x) => !x.person.deathDate);

  const oldest = livingWithYears.length
    ? livingWithYears.reduce((min, cur) => (cur.year < min.year ? cur : min))
    : null;
  const youngest = livingWithYears.length
    ? livingWithYears.reduce((max, cur) => (cur.year > max.year ? cur : max))
    : null;

  return {
    peopleCount: people.length,
    generationCount,
    oldest,
    youngest,
    earliestYear: earliestBorn ? earliestBorn.year : null,
    yearSpan: earliestBorn ? new Date().getFullYear() - earliestBorn.year : null,
  };
}
