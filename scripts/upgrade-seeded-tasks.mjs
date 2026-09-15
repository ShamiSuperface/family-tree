// One-time fix-up: the first run of seed-missing-info-tasks.mjs (before it
// gained the autoCheck tagging) created tasks without it, so the daily
// cron can't auto-detect when they're done. This finds any existing task
// whose text matches what the (now-updated) seed script would generate,
// and — only if it's missing autoCheck — deletes and re-adds it with the
// tag attached. Everything else on the board (manually added tasks, or
// ones already tagged) is left untouched.
//
// Run with the local dev server running:
//   node scripts/upgrade-seeded-tasks.mjs

import { readFileSync } from "fs";

const API_BASE = "http://localhost:3000";

const people = JSON.parse(readFileSync(new URL("../data/family.json", import.meta.url), "utf-8"));
const byId = new Map(people.map((p) => [p.id, p]));
const fullName = (p) => `${p.firstName} ${p.lastName}`;

const intended = [];

for (const p of people) {
  if (!p.birthDate) {
    intended.push({
      text: `חסר תאריך לידה ל${fullName(p)}`,
      personId: p.id,
      autoCheck: { field: "birthDate" },
    });
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
      intended.push({
        text: `חסר תאריך נישואין של ${fullName(p)} ו${spouseName}`,
        personId: p.id,
        autoCheck: { field: "marriageDate", spouseId },
      });
    }
  }
}

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
  process.exit(1);
}
const existingTasks = await existingRes.json();

let upgraded = 0;
let alreadyTagged = 0;
let notFound = 0;

for (const item of intended) {
  const match = existingTasks.find((t) => t.text === item.text);
  if (!match) {
    notFound++;
    continue;
  }
  if (match.autoCheck) {
    alreadyTagged++;
    continue;
  }

  const delRes = await fetch(`${API_BASE}/api/tasks/${match.id}`, { method: "DELETE" });
  if (!delRes.ok) {
    console.error("Could not delete old task:", item.text);
    continue;
  }
  const addRes = await fetch(`${API_BASE}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...item, authorName: match.authorName, website: "" }),
  });
  if (addRes.ok) {
    upgraded++;
    console.log("Upgraded:", item.text);
  } else {
    console.error("Failed to re-add:", item.text);
  }
}

console.log(
  `\nDone. Upgraded ${upgraded}, already tagged ${alreadyTagged}, not found on board ${notFound}.`,
);
