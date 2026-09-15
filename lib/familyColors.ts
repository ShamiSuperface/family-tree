import type { Person } from "@/types/family";

const HUE_STEP = 137.508; // golden angle — spreads any number of branches evenly around the wheel

/**
 * Colors each person by which of the root couple's children they (or a
 * spouse who married in) descend from. The whole branch — kids, grandkids,
 * great-grandkids, and anyone who marries into it along the way — shares
 * one hue, rather than getting a new color at every generation. The root
 * couple itself is left uncolored (the default border).
 *
 * Returns a hue (0-360) per person rather than a finished color, so callers
 * can derive both a bold border and a light fill from the same branch hue.
 */
export function computeFamilyColors(people: Person[], rootId: string): Map<string, number> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const root = byId.get(rootId);
  if (!root) return new Map();

  const rootCoupleIds = new Set([rootId, ...root.spouses]);
  const branchSeeds = people.filter((p) => p.parents.some((pid) => rootCoupleIds.has(pid)));

  const personHue = new Map<string, number>();
  const queue: string[] = [];
  branchSeeds.forEach((seed, index) => {
    personHue.set(seed.id, (index * HUE_STEP) % 360);
    queue.push(seed.id);
  });

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const current = byId.get(currentId);
    const hue = personHue.get(currentId);
    if (!current || hue === undefined) continue;

    for (const neighborId of [...current.spouses, ...current.children]) {
      if (personHue.has(neighborId) || rootCoupleIds.has(neighborId)) continue;
      personHue.set(neighborId, hue);
      queue.push(neighborId);
    }
  }

  return personHue;
}
