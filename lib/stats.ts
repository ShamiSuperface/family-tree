import type { Person } from "@/types/family";
import { isMonthDayOnly } from "@/lib/dateUtils";

function birthYearOf(person: Person): number | null {
  if (!person.birthDate || isMonthDayOnly(person.birthDate)) return null;
  return Number(person.birthDate.slice(0, 4));
}

/** Generation 0 = people with no recorded parents; each child is parent's generation + 1. */
function computeGenerations(people: Person[]): Map<string, number> {
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
  return generation;
}

export interface FamilyStats {
  peopleCount: number;
  generationCount: number;
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

  const oldest = withYears.length
    ? withYears.reduce((min, cur) => (cur.year < min.year ? cur : min))
    : null;
  const youngest = withYears.length
    ? withYears.reduce((max, cur) => (cur.year > max.year ? cur : max))
    : null;

  return {
    peopleCount: people.length,
    generationCount,
    oldest,
    youngest,
    earliestYear: oldest ? oldest.year : null,
    yearSpan: oldest ? new Date().getFullYear() - oldest.year : null,
  };
}
