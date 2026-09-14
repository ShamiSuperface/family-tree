"use client";

import type { ExtNode } from "relatives-tree/lib/types";
import type { Person } from "@/types/family";

interface Props {
  person: Person;
  node: ExtNode;
  width: number;
  height: number;
  onClick: () => void;
}

const GAP = 10;

export default function PersonNodeCard({ person, node, width, height, onClick }: Props) {
  const birthYear = person.birthDate?.slice(0, 4) ?? "?";
  const deathYear = person.deathDate?.slice(0, 4);
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
        className="flex h-full w-full items-center gap-2.5 rounded-2xl border border-amber-200 bg-white px-2.5 py-2 text-start shadow-sm transition hover:border-amber-500 hover:shadow-md"
        style={{ margin: GAP / 2, width: width - GAP, height: height - GAP }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.photo}
          alt={fullName}
          className="h-10 w-10 shrink-0 rounded-full bg-amber-50 object-cover ring-2 ring-amber-100"
        />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-tight font-medium text-stone-900">
            {fullName}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            {birthYear}
            {deathYear ? ` – ${deathYear}` : ""}
          </p>
        </div>
      </button>
    </div>
  );
}
