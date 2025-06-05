import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { createPortal } from "react-dom";
import { useDroppable } from "@dnd-kit/core";
import { tokens } from "@fluentui/react-components";

interface DropZoneProps {
  id: string;
  parentId?: string;
  index: number;
  direction: "row" | "column";
  end?: boolean;
}

const dropZoneWidth = 4;

const DropZone: React.FC<DropZoneProps> = ({
  id,
  parentId,
  index,
  direction,
  end,
}) => {
  const dropId = `drop-zone-${id}-${parentId || ""}-${index}${
    end ? "-end" : ""
  }`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { dropId, id, parentId, index, end },
  });
  const rectMap = useDataTrackStore((state) => state.rectMap);
  const isDraggingGlobal = useDataTrackStore((state) => state.isDragging);
  const activeId = useDataTrackStore((state) => state.activeId);
  const rect = rectMap[id];
  const isColumn = direction === "column";
  const isRow = direction === "row";
  const offset = parentId ? 0 : end ? dropZoneWidth * -2 : dropZoneWidth;

  if (activeId === id || activeId === parentId || !rect) return null;

  if (!isDraggingGlobal) return null;

  return createPortal(
    <div
      ref={setNodeRef}
      key={id}
      id={dropId}
      className="drop-zone"
      style={{
        background: isOver
          ? tokens.colorNeutralForeground2BrandHover
          : "transparent",
        top: isColumn ? rect[end ? "bottom" : "top"] + offset : rect.top,
        left: isColumn ? rect.left : rect[end ? "right" : "left"] + offset,
        width: isRow ? dropZoneWidth : rect.width,
        height: isRow ? rect.height : dropZoneWidth,
      }}></div>,
    document.querySelector(".fui-FluentProvider")!
  );
};

export default DropZone;
