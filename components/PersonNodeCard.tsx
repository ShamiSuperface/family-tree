"use client";

import type { ExtNode } from "relatives-tree/lib/types";
import type { Person } from "@/types/family";
import { ageWord, dateYear, livingAge } from "@/lib/dateUtils";

interface Props {
  person: Person;
  node: ExtNode;
  width: number;
  height: number;
  onClick: () => void;
  /** Color representing this person's nuclear family (see lib/familyColors.ts). */
  familyColor?: string;
}

const GAP = 10;

export default function PersonNodeCard({
  person,
  node,
  width,
  height,
  onClick,
  familyColor,
}: Props) {
  const birthYear = dateYear(person.birthDate);
  const deathYear = person.deathDate ? dateYear(person.deathDate) : null;
  const age = livingAge(person.birthDate, person.deathDate);
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <div
      id={person.id}
      className="absolute"
      style={{
        width,
        height,
        transform: `translate(${node.left * (width / 2)}px, ${node.top * (height / 2)}px)`,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        title={fullName}
        className="flex h-full w-full items-center gap-2.5 rounded-2xl border-2 border-amber-400 bg-[var(--surface)] px-2.5 py-2 text-start shadow-md transition hover:shadow-lg"
        style={{
          margin: GAP / 2,
          width: width - GAP,
          height: height - GAP,
          borderColor: familyColor,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.photo}
          alt={fullName}
          className="h-10 w-10 shrink-0 rounded-full bg-amber-50 object-cover ring-2 ring-amber-300"
        />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-tight font-medium text-stone-900">
            {fullName}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-amber-800">
            {birthYear}
            {age !== null ? ` (${ageWord(person.gender)} ${age})` : ""}
            {deathYear ? ` – ${deathYear}` : ""}
          </p>
        </div>
      </button>
    </div>
  );
}
