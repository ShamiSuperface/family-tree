"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import ReactFamilyTree from "react-family-tree";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { ExtNode, Node } from "relatives-tree/lib/types";
import type { Person } from "@/types/family";
import { buildTreeNodes } from "@/lib/familyTreeAdapter";
import { computeFamilyColors } from "@/lib/familyColors";
import PersonNodeCard from "./PersonNodeCard";

const NODE_WIDTH = 230;
const NODE_HEIGHT = 116;

export interface FamilyTreeViewHandle {
  zoomToPerson: (id: string) => void;
}

interface Props {
  people: Person[];
  rootId: string;
  onSelectPerson: (person: Person) => void;
}

const FamilyTreeView = forwardRef<FamilyTreeViewHandle, Props>(function FamilyTreeView(
  { people, rootId, onSelectPerson },
  ref,
) {
  const nodes = buildTreeNodes(people) as unknown as Node[];
  const byId = new Map(people.map((person) => [person.id, person]));
  const familyColors = computeFamilyColors(people);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  useImperativeHandle(ref, () => ({
    zoomToPerson: (id: string) => {
      transformRef.current?.zoomToElement(id, 1, 400);
    },
  }));

  return (
    <div dir="ltr" className="relative h-full w-full">
      <TransformWrapper
        ref={transformRef}
        minScale={0.3}
        maxScale={2}
        initialScale={0.8}
        centerOnInit
        wheel={{ step: 0.15 }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            <div className="absolute bottom-4 right-4 z-10 flex flex-col overflow-hidden rounded-xl border-2 border-amber-400 bg-[var(--surface)] shadow-md">
              <button
                type="button"
                aria-label="הגדלה"
                onClick={() => zoomIn()}
                className="flex h-10 w-10 items-center justify-center text-lg font-medium text-amber-900 hover:bg-amber-50 active:bg-amber-100"
              >
                +
              </button>
              <button
                type="button"
                aria-label="הקטנה"
                onClick={() => zoomOut()}
                className="flex h-10 w-10 items-center justify-center border-t-2 border-amber-400 text-lg font-medium text-amber-900 hover:bg-amber-50 active:bg-amber-100"
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
                className="flex h-10 w-10 items-center justify-center border-t-2 border-amber-400 text-xs font-medium text-amber-900 hover:bg-amber-50 active:bg-amber-100"
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
                className="family-tree-canvas"
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
                      familyColor={familyColors.get(person.id)}
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
});

export default FamilyTreeView;
