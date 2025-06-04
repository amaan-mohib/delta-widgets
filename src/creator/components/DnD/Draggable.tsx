import { useDraggable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";

interface DraggableProps {
  id: string;
  data?: any;
  dragOverlay?: boolean;
}

const Draggable: React.FC<DraggableProps & PropsWithChildren> = ({
  id,
  data,
  children,
  dragOverlay,
}) => {
  const { attributes, isDragging, transform, listeners, setNodeRef } =
    useDraggable({
      id,
      data,
    });
  const style =
    !dragOverlay && transform
      ? {
          zIndex: 1000,
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : isDragging
      ? {
          opacity: 0.5,
        }
      : undefined;

  return (
    <div id={id} ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

export default Draggable;
