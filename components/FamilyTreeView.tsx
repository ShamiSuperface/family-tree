"use client";

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

  return (
    <div dir="ltr" className="relative h-full w-full">
      <TransformWrapper
        minScale={0.3}
        maxScale={2}
        initialScale={0.8}
        centerOnInit
        wheel={{ step: 0.15 }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
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
