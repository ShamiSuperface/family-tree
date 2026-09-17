import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { MediaItem, Person } from "@/types/family";

const DATA_PATH = path.join(process.cwd(), "data", "family.json");

export interface PersonInput {
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  birthDate: string | null;
  deathDate: string | null;
  photo: string;
  bio: string;
  residence: string;
  occupation: string;
  parents: string[];
  spouses: string[];
  children: string[];
  marriageDates: Record<string, string>;
  gallery: MediaItem[];
}

export async function readPeople(): Promise<Person[]> {
  const raw = await readFile(DATA_PATH, "utf-8");
  const people = JSON.parse(raw) as Person[];
  // Backward-compatible with records saved before these fields existed.
  return people.map((person) => ({
    ...person,
    marriageDates: person.marriageDates ?? {},
    gallery: person.gallery ?? [],
    residence: person.residence ?? "",
    occupation: person.occupation ?? "",
  }));
}

async function writePeople(people: Person[]): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(people, null, 2) + "\n", "utf-8");
}

function nextId(people: Person[]): string {
  const numbers = people
    .map((person) => /^p(\d+)$/.exec(person.id))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => parseInt(match[1], 10));
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `p${max + 1}`;
}

type RelationKey = "parents" | "children" | "spouses";

const REVERSE_KEY: Record<RelationKey, RelationKey> = {
  parents: "children",
  children: "parents",
  spouses: "spouses",
};

/** Keeps relationships symmetric: e.g. if A gains parent B, B gains child A. */
function syncRelations(
  people: Person[],
  personId: string,
  next: PersonInput,
  previous?: PersonInput,
): void {
  const byId = new Map(people.map((person) => [person.id, person]));

  (Object.keys(REVERSE_KEY) as RelationKey[]).forEach((key) => {
    const reverseKey = REVERSE_KEY[key];
    const oldIds = previous?.[key] ?? [];
    const newIds = next[key];

    for (const otherId of oldIds.filter((id) => !newIds.includes(id))) {
      const other = byId.get(otherId);
      if (other) other[reverseKey] = other[reverseKey].filter((id) => id !== personId);
    }
    for (const otherId of newIds.filter((id) => !oldIds.includes(id))) {
      const other = byId.get(otherId);
      if (other && !other[reverseKey].includes(personId)) {
        other[reverseKey] = [...other[reverseKey], personId];
      }
    }
  });
}

/** Mirrors the marriage date this person recorded for a spouse onto that spouse's own record. */
function syncMarriageDates(
  people: Person[],
  personId: string,
  next: PersonInput,
  previous?: PersonInput,
): void {
  const byId = new Map(people.map((person) => [person.id, person]));
  const oldSpouses = previous?.spouses ?? [];

  for (const otherId of oldSpouses.filter((id) => !next.spouses.includes(id))) {
    const other = byId.get(otherId);
    if (other) delete other.marriageDates[personId];
  }

  for (const otherId of next.spouses) {
    const other = byId.get(otherId);
    if (!other) continue;
    const date = next.marriageDates[otherId];
    if (date) {
      other.marriageDates[personId] = date;
    } else {
      delete other.marriageDates[personId];
    }
  }
}

function validate(input: PersonInput, people: Person[], selfId?: string): string | null {
  if (!input.firstName.trim()) return "שם פרטי הוא שדה חובה";
  if (!input.lastName.trim()) return "שם משפחה הוא שדה חובה";
  if (input.gender !== "male" && input.gender !== "female") return "יש לבחור מגדר";

  const validIds = new Set(people.map((p) => p.id));
  const allRefs = [...input.parents, ...input.spouses, ...input.children];
  for (const id of allRefs) {
    if (id === selfId) return "אדם לא יכול להיות קרוב משפחה של עצמו";
    if (!validIds.has(id)) return `מזהה קרוב לא קיים: ${id}`;
  }
  return null;
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const people = await readPeople();
  const error = validate(input, people);
  if (error) throw new Error(error);

  const id = nextId(people);
  const person: Person = { id, ...input };
  people.push(person);
  syncRelations(people, id, input);
  syncMarriageDates(people, id, input);
  await writePeople(people);
  return person;
}

export async function updatePerson(id: string, input: PersonInput): Promise<Person> {
  const people = await readPeople();
  const index = people.findIndex((person) => person.id === id);
  if (index === -1) throw new Error("האדם לא נמצא");

  const error = validate(input, people, id);
  if (error) throw new Error(error);

  const previous = people[index];
  const updated: Person = { id, ...input };
  people[index] = updated;
  syncRelations(people, id, input, previous);
  syncMarriageDates(people, id, input, previous);
  await writePeople(people);
  return updated;
}

export async function deletePerson(id: string): Promise<void> {
  const people = await readPeople();
  const remaining = people.filter((person) => person.id !== id);
  for (const person of remaining) {
    person.parents = person.parents.filter((x) => x !== id);
    person.children = person.children.filter((x) => x !== id);
    person.spouses = person.spouses.filter((x) => x !== id);
    delete person.marriageDates[id];
  }
  await writePeople(remaining);
}
