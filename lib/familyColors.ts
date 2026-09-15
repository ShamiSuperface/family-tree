import type { Person } from "@/types/family";

const HUE_STEP = 137.508; // golden angle — spreads any number of branches evenly around the wheel

function colorForIndex(index: number): string {
  const hue = (index * HUE_STEP) % 360;
  return `hsl(${hue.toFixed(1)} 60% 55%)`;
}

/**
 * Colors each person by which of the root couple's children they (or a
 * spouse who married in) descend from. The whole branch — kids, grandkids,
 * great-grandkids, and anyone who marries into it along the way — shares
 * one color, rather than getting a new color at every generation. The root
 * couple itself is left uncolored (the default border).
 */
export function computeFamilyColors(people: Person[], rootId: string): Map<string, string> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const root = byId.get(rootId);
  if (!root) return new Map();

  const rootCoupleIds = new Set([rootId, ...root.spouses]);
  const branchSeeds = people.filter((p) => p.parents.some((pid) => rootCoupleIds.has(pid)));

  const personColor = new Map<string, string>();
  const queue: string[] = [];
  branchSeeds.forEach((seed, index) => {
    personColor.set(seed.id, colorForIndex(index));
    queue.push(seed.id);
  });

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const current = byId.get(currentId);
    const color = personColor.get(currentId);
    if (!current || !color) continue;

    for (const neighborId of [...current.spouses, ...current.children]) {
      if (personColor.has(neighborId) || rootCoupleIds.has(neighborId)) continue;
      personColor.set(neighborId, color);
      queue.push(neighborId);
    }
  }

  return personColor;
}
