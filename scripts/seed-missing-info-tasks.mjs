// One-time script: scans data/family.json for missing birth dates and
// missing marriage dates, and adds a task for each to the family tasks
// board (via the local dev server's API, which writes to the shared
// Upstash database — so this reaches the live site too).
//
// Run with the local dev server running (`npm run dev` in another terminal):
//   node scripts/seed-missing-info-tasks.mjs
//
// Safe to re-run: it skips any task whose text already exists on the board.

import { readFileSync } from "fs";

const API_BASE = "http://localhost:3000";
const AUTHOR_NAME = "שמי";

const people = JSON.parse(readFileSync(new URL("../data/family.json", import.meta.url), "utf-8"));
const byId = new Map(people.map((p) => [p.id, p]));
const fullName = (p) => `${p.firstName} ${p.lastName}`;

const tasksToAdd = [];

for (const p of people) {
  if (!p.birthDate) {
    tasksToAdd.push({ text: `חסר תאריך לידה ל${fullName(p)}`, personId: p.id });
  }
}

const seenPairs = new Set();
for (const p of people) {
  for (const spouseId of p.spouses ?? []) {
    const pairKey = [p.id, spouseId].sort().join("-");
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    const hasDate = (p.marriageDates ?? {})[spouseId];
    if (!hasDate) {
      const spouse = byId.get(spouseId);
      const spouseName = spouse ? fullName(spouse) : spouseId;
      tasksToAdd.push({ text: `חסר תאריך נישואין של ${fullName(p)} ו${spouseName}`, personId: p.id });
    }
  }
}

console.log(`Found ${tasksToAdd.length} missing-info items to add as tasks.`);

let existingRes;
try {
  existingRes = await fetch(`${API_BASE}/api/tasks`);
} catch {
  console.error("Could not reach http://localhost:3000 — is `npm run dev` running? Aborting.");
  process.exit(1);
}
if (!existingRes.ok) {
  const data = await existingRes.json().catch(() => ({}));
  console.error("Tasks API returned an error:", data.error ?? existingRes.status);
  console.error("(If it mentions Upstash/missing env vars, the tasks board isn't connected yet.)");
  process.exit(1);
}
const existing = await existingRes.json();
const existingTexts = new Set(existing.map((t) => t.text));

let added = 0;
let skipped = 0;
for (const task of tasksToAdd) {
  if (existingTexts.has(task.text)) {
    skipped++;
    continue;
  }
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...task, authorName: AUTHOR_NAME, website: "" }),
  });
  if (res.ok) {
    added++;
    console.log("Added:", task.text);
  } else {
    const data = await res.json().catch(() => ({}));
    console.error("Failed:", task.text, data.error ?? res.status);
  }
}

console.log(`\nDone. Added ${added}, skipped ${skipped} already-existing.`);
