"use client";

import { useMemo, useState } from "react";
import ReactFamilyTree from "react-family-tree";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { ExtNode, Node } from "relatives-tree/lib/types";
import type { Person } from "@/types/family";
import { buildTreeNodes } from "@/lib/familyTreeAdapter";
import PersonNodeCard from "./PersonNodeCard";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

interface Props {
  people: Person[];
  rootId: string;
  onSelectPerson: (person: Person) => void;
}

export default function FamilyTreeView({ people, rootId, onSelectPerson }: Props) {
  const nodes = buildTreeNodes(people) as unknown as Node[];
  const byId = new Map(people.map((person) => [person.id, person]));
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return people
      .filter((person) => `${person.firstName} ${person.lastName}`.includes(q))
      .slice(0, 6);
  }, [people, query]);

  return (
    <div dir="ltr" className="relative h-full w-full">
      <TransformWrapper
        minScale={0.3}
        maxScale={2}
        initialScale={0.8}
        centerOnInit
        wheel={{ step: 0.15 }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView, zoomToElement }) => (
          <>
            <div
              dir="rtl"
              className="absolute top-4 right-4 z-10 w-56 sm:w-64"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש לפי שם..."
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-md outline-none focus:border-blue-400"
              />
              {matches.length > 0 && (
                <ul className="mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-md">
                  {matches.map((person) => (
                    <li key={person.id}>
                      <button
                        type="button"
                        onClick={() => {
                          zoomToElement(person.id, 1, 400);
                          onSelectPerson(person);
                          setQuery("");
                        }}
                        className="block w-full px-3 py-2 text-start text-sm text-neutral-800 hover:bg-neutral-100"
                      >
                        {person.firstName} {person.lastName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="absolute bottom-4 right-4 z-10 flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-md">
              <button
                type="button"
                aria-label="הגדלה"
                onClick={() => zoomIn()}
                className="flex h-10 w-10 items-center justify-center text-lg text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
              >
                +
              </button>
              <button
                type="button"
                aria-label="הקטנה"
                onClick={() => zoomOut()}
                className="flex h-10 w-10 items-center justify-center border-t border-neutral-200 text-lg text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
              >
                −
              </button>
              <button
                type="button"
                aria-label="איפוס תצוגה"
                onClick={() => {
                  resetTransform();
                  centerView();
                }}
                className="flex h-10 w-10 items-center justify-center border-t border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
              >
                ⤢
              </button>
            </div>

            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ padding: "4rem" }}
            >
              <ReactFamilyTree
                nodes={nodes}
                rootId={rootId}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                renderNode={(node: ExtNode) => {
                  const person = byId.get(node.id);
                  if (!person) return null;
                  return (
                    <PersonNodeCard
                      key={node.id}
                      person={person}
                      node={node}
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      onClick={() => onSelectPerson(person)}
                    />
                  );
                }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
