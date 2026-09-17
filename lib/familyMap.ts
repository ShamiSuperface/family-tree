import type { Person } from "@/types/family";

export interface ResidenceGroup {
  /** The exact residence text as entered, used as the geocoding query. */
  place: string;
  people: Person[];
}

/** Groups people by their (trimmed) residence text, skipping anyone without one set. */
export function groupByResidence(people: Person[]): ResidenceGroup[] {
  const groups = new Map<string, ResidenceGroup>();
  for (const person of people) {
    const place = person.residence.trim();
    if (!place) continue;
    const existing = groups.get(place);
    if (existing) {
      existing.people.push(person);
    } else {
      groups.set(place, { place, people: [person] });
    }
  }
  return Array.from(groups.values());
}
