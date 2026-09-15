"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import ReactFamilyTree from "react-family-tree";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import type { ExtNode, Node } from "relatives-tree/lib/types";
import type { Person } from "@/types/family";
import { buildTreeNodes } from "@/lib/familyTreeAdapter";
import { computeFamilyColors } from "@/lib/familyColors";
import PersonNodeCard from "./PersonNodeCard";

const NODE_WIDTH = 230;
const NODE_HEIGHT = 116;

export interface FamilyTreeViewHandle {
  zoomToPerson: (id: string) => void;
  exportTree: (format: "png" | "pdf") => Promise<void>;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
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
  const familyColors = computeFamilyColors(people, rootId);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    zoomToPerson: (id: string) => {
      transformRef.current?.zoomToElement(id, 1, 400);
    },
    exportTree: async (format: "png" | "pdf") => {
      const canvas = canvasWrapperRef.current?.querySelector<HTMLElement>(".family-tree-canvas");
      if (!canvas) return;
      const background =
        getComputedStyle(document.documentElement).getPropertyValue("--background").trim() ||
        "#fffbeb";

      const today = new Date().toISOString().slice(0, 10);

      if (format === "png") {
        // Full retina resolution — a wide tree still lands well under 1MB,
        // so there's no reason to sacrifice text sharpness here.
        const dataUrl = await toPng(canvas, { backgroundColor: background, pixelRatio: 2 });
        downloadDataUrl(dataUrl, `עץ-המשפחה-${today}.png`);
        return;
      }

      // jsPDF's page-size cap is 14400pt; with the px_scaling hotfix below,
      // "px" means real CSS px (×0.75 internally), so the usable ceiling is
      // 14400 / 0.75 = 19200px. Only back off pixelRatio (never below 1x —
      // the tree's own layout resolution — to avoid blurring the text) when
      // a very wide tree would exceed that.
      const longerSide = Math.max(canvas.offsetWidth, canvas.offsetHeight, 1);
      const pixelRatio = Math.max(1, Math.min(2, 19000 / longerSide));

      // JPEG keeps the PDF a reasonable size to email or share — a lossless
      // PNG of a large, photo-heavy tree can balloon to tens of megabytes.
      const dataUrl = await toJpeg(canvas, { backgroundColor: background, pixelRatio, quality: 0.85 });
      const image = new Image();
      image.src = dataUrl;
      await new Promise<void>((resolve) => {
        image.onload = () => resolve();
      });
      const pdf = new jsPDF({
        orientation: image.width >= image.height ? "landscape" : "portrait",
        unit: "px",
        format: [image.width, image.height],
        hotfixes: ["px_scaling"],
      });
      pdf.addImage(dataUrl, "JPEG", 0, 0, image.width, image.height);
      pdf.save(`עץ-המשפחה-${today}.pdf`);
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
              <div ref={canvasWrapperRef} style={{ display: "contents" }}>
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
                        familyHue={familyColors.get(person.id)}
                      />
                    );
                  }}
                />
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
});

export default FamilyTreeView;
