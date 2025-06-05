import { useDroppable } from "@dnd-kit/core";
import { Button } from "@fluentui/react-components";
import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { DismissRegular } from "@fluentui/react-icons";

interface CancelZoneProps {}

const CancelZone: React.FC<CancelZoneProps> = () => {
  const isDraggingGlobal = useDataTrackStore((state) => state.isDragging);
  const { isOver, setNodeRef } = useDroppable({
    id: "dnd-cancel-zone",
  });

  if (!isDraggingGlobal) return null;

  return (
    <div ref={setNodeRef}>
      <Button
        appearance={isOver ? "primary" : "outline"}
        shape="circular"
        style={{ borderStyle: isOver ? "solid" : "dashed" }}
        icon={<DismissRegular />}>
        Cancel drop
      </Button>
    </div>
  );
};

export default CancelZone;
