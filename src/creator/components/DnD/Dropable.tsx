import { useDroppable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import Element from "./Element";

interface DropableProps {
  id: string;
  styles?: React.CSSProperties;
  disableDrop?: boolean;
}

const Dropable: React.FC<DropableProps & PropsWithChildren> = ({
  id,
  children,
  disableDrop,
  styles,
}) => {
  const { isOver, setNodeRef, active } = useDroppable({
    id: id,
  });

  if (disableDrop) {
    return (
      <Element id={id} styles={styles}>
        {children}
      </Element>
    );
  }

  return (
    <Element
      id={id}
      styles={styles}
      active={active}
      isOver={isOver}
      wrapperRef={setNodeRef}>
      {children}
    </Element>
  );
};

export default Dropable;
