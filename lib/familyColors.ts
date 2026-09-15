import type { Person } from "@/types/family";

/** The nuclear family a person was born into, keyed by their (sorted) parent ids. */
function familyKey(person: Person): string | null {
  if (person.parents.length === 0) return null;
  return [...person.parents].sort().join("|");
}

/**
 * Assigns each person a color representing the nuclear family they were born
 * into — siblings share a color, so branches of the tree are visually easy
 * to tell apart. People with no recorded parents (the root generation, or
 * someone who married in) get no color and fall back to the default border.
 */
export function computeFamilyColors(people: Person[]): Map<string, string> {
  const keys = new Set<string>();
  for (const person of people) {
    const key = familyKey(person);
    if (key) keys.add(key);
  }

  // Golden-angle hue spacing spreads any number of families across the
  // color wheel so neighboring families don't end up looking alike.
  const keyToColor = new Map<string, string>();
  Array.from(keys)
    .sort()
    .forEach((key, index) => {
      const hue = (index * 137.508) % 360;
      keyToColor.set(key, `hsl(${hue.toFixed(1)} 60% 55%)`);
    });

  const personColor = new Map<string, string>();
  for (const person of people) {
    const key = familyKey(person);
    const color = key ? keyToColor.get(key) : undefined;
    if (color) personColor.set(person.id, color);
  }
  return personColor;
}
