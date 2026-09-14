import type { Person } from "@/types/family";

export interface TreeNode {
  id: string;
  gender: "male" | "female";
  parents: { id: string; type: "blood" }[];
  children: { id: string; type: "blood" }[];
  siblings: { id: string; type: "blood" }[];
  spouses: { id: string; type: "married" }[];
}

export function buildTreeNodes(people: Person[]): TreeNode[] {
  const byId = new Map(people.map((person) => [person.id, person]));

  return people.map((person) => {
    const siblingIds = new Set<string>();
    for (const parentId of person.parents) {
      byId.get(parentId)?.children.forEach((childId) => {
        if (childId !== person.id) siblingIds.add(childId);
      });
    }

    return {
      id: person.id,
      gender: person.gender,
      parents: person.parents.map((id) => ({ id, type: "blood" as const })),
      children: person.children.map((id) => ({ id, type: "blood" as const })),
      siblings: Array.from(siblingIds).map((id) => ({ id, type: "blood" as const })),
      spouses: person.spouses.map((id) => ({ id, type: "married" as const })),
    };
  });
}
