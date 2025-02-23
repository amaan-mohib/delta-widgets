import { useDraggable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";

interface DraggableProps {
  id: string;
}

const Draggable: React.FC<DraggableProps & PropsWithChildren> = ({
  id,
  children,
}) => {
  const { attributes, transform, listeners, setNodeRef } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

export default Draggable;
