import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { tokens } from "@fluentui/react-components";
import { useDataTrackStore } from "../../../stores/useDataTrackStore";

interface DropZoneProps {
  id: string;
  parentId?: string;
  index: number;
  end?: boolean;
}

const dropZoneHeight = 2;

const DropZone: React.FC<DropZoneProps> = ({ id, parentId, index, end }) => {
  const dropId = `drop-zone-layer-${id}-${parentId || ""}-${index}${
    end ? "-end" : ""
  }`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { dropId, id, parentId, index, end },
  });
  const activeId = useDataTrackStore((state) => state.layerActiveId);
  const isDragging = useDataTrackStore((state) => state.layerIsDragging);
  const offset = !parentId && end ? dropZoneHeight + 4 : 0;
  const padding = parentId ? 0 : 20;

  if (activeId === id || activeId === parentId) return null;

  if (!isDragging) return null;

  return (
    <div
      style={
        offset || padding
          ? { height: offset || dropZoneHeight, paddingLeft: padding }
          : {}
      }>
      <div
        ref={setNodeRef}
        key={id}
        id={dropId}
        className="drop-zone-layer"
        style={{
          background: isOver
            ? tokens.colorNeutralForeground2BrandHover
            : "transparent",
          height: dropZoneHeight,
        }}></div>
    </div>
  );
};

export default DropZone;
