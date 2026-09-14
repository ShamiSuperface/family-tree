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
        className="flex h-full w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-start shadow-sm transition hover:border-blue-400 hover:shadow-md"
        style={{ margin: GAP / 2, width: width - GAP, height: height - GAP }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.photo}
          alt={`${person.firstName} ${person.lastName}`}
          className="h-12 w-12 shrink-0 rounded-full bg-neutral-100 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">
            {person.firstName} {person.lastName}
          </p>
          <p className="text-xs text-neutral-500">
            {birthYear}
            {deathYear ? ` – ${deathYear}` : ""}
          </p>
        </div>
      </button>
    </div>
  );
}
