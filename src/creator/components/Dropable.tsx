import { useDroppable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";

interface DropableProps {
  id: string;
}

const Dropable: React.FC<DropableProps & PropsWithChildren> = ({
  id,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });
  const style = {
    border: "2px solid transparent",
    boderColor: isOver ? "green" : undefined,
    borderRadius: 2,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
};

export default Dropable;
