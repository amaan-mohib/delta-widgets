import { Active } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import { Text, tokens } from "@fluentui/react-components";

interface ElementProps {
  id: string;
  styles?: React.CSSProperties;
  wrapperRef?: (node: HTMLElement | null) => void;
  isOver?: boolean;
  active?: Active | null;
}

const Element: React.FC<ElementProps & PropsWithChildren> = ({
  id,
  children,
  styles,
  active,
  isOver,
  wrapperRef,
}) => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const style: React.CSSProperties = {
    ...styles,
    padding: active
      ? `calc(${styles?.padding || "0px"} + 5px)`
      : styles?.padding,
    outline: isOver
      ? `2px solid ${tokens.colorNeutralForeground2BrandHover}`
      : selectedId === id
      ? `2px solid ${tokens.colorNeutralForeground2BrandPressed}`
      : active
      ? `2px dashed ${tokens.colorNeutralForeground2BrandHover}`
      : "2px solid transparent",
    borderRadius: 2,
    position: "relative",
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        useDataTrackStore.setState({ selectedId: id });
      }}
      id={id}
      ref={wrapperRef}
      style={style}
      onMouseOver={(e) => {
        e.stopPropagation();
        document
          .querySelectorAll(".dropable-container-hover")
          .forEach((item) => {
            item.classList.remove("dropable-container-hover");
          });
        const div = e.target as HTMLDivElement;
        if (div.id === id) div.classList.add("dropable-container-hover");
      }}
      onMouseLeave={(e) => {
        const div = e.target as HTMLDivElement;
        div.classList.remove("dropable-container-hover");
      }}>
      {(isOver || selectedId === id) && (
        <div className="selected-element-info">
          <Text size={200}>#{id}</Text>
        </div>
      )}
      {children}
    </div>
  );
};

export default Element;
