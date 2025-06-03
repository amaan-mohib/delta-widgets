import { Active, DragOverlay, useDraggable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import { Text, tokens } from "@fluentui/react-components";
import { ReOrderDotsVerticalRegular } from "@fluentui/react-icons";
import { createPortal } from "react-dom";

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
  const { attributes, listeners, setNodeRef, isDragging, node } = useDraggable({
    id,
  });

  const selectedId = useDataTrackStore((state) => state.selectedId);
  const activeId = useDataTrackStore((state) => state.activeId);
  const hoveredId = useDataTrackStore((state) => state.hoveredId);
  const style: React.CSSProperties = {
    ...styles,
    borderRadius: styles?.borderRadius || 2,
    position: "relative",
    ...(isDragging
      ? {
          opacity: 0.5,
        }
      : {
          padding:
            activeId && id.startsWith("container")
              ? `calc(${styles?.padding || "0px"} + 5px)`
              : styles?.padding,
          outline: isOver
            ? `2px solid ${tokens.colorNeutralForeground2BrandHover}`
            : selectedId === id
            ? `2px solid ${tokens.colorNeutralForeground2BrandPressed}`
            : active
            ? `2px dashed ${tokens.colorNeutralForeground2BrandHover}`
            : "2px solid transparent",
        }),
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();
    useDataTrackStore.setState({ hoveredId: id });
  };

  const shouldShowToolbar = isOver || selectedId === id || activeId === id;

  return (
    <>
      <div
        className={hoveredId === id ? "dropable-container-hover" : ""}
        onClick={(e) => {
          e.stopPropagation();
          useDataTrackStore.setState({ selectedId: id });
        }}
        id={id}
        ref={(ref) => {
          wrapperRef && wrapperRef(ref);
          setNodeRef(ref);
        }}
        style={style}
        onMouseOver={(e) => {
          if (isDragging) return;
          handleMouseEnter(e);
        }}>
        {shouldShowToolbar && (
          <div className="selected-element-info">
            {id !== "container" && !isOver && (
              <div
                {...listeners}
                {...attributes}
                style={{
                  cursor: "grab",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <ReOrderDotsVerticalRegular fontSize="16px" />
              </div>
            )}
            <Text size={300}>#{id}</Text>
          </div>
        )}
        {children}
      </div>
      {isDragging &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            <div
              style={{
                ...styles,
                height: node.current?.clientHeight,
                width: node.current?.clientWidth,
                position: "absolute",
              }}>
              {children}
            </div>
          </DragOverlay>,
          document.querySelector(".fui-FluentProvider")!
        )}
    </>
  );
};

export default Element;
