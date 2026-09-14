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
    <div dir="ltr" className="h-full w-full">
      <TransformWrapper
        minScale={0.3}
        maxScale={2}
        initialScale={0.8}
        centerOnInit
        wheel={{ step: 0.15 }}
      >
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
      </TransformWrapper>
    </div>
  );
}
