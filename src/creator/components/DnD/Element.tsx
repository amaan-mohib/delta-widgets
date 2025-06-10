import { Active, DragOverlay, useDraggable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { Card, Text, tokens } from "@fluentui/react-components";
import { ReOrderDotsVerticalRegular } from "@fluentui/react-icons";
import { createPortal } from "react-dom";
import { useElementRect } from "../../hooks/useElementRect";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useManifestStore } from "../../stores/useManifestStore";

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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { move: true },
  });
  const [containerRef] = useElementRect(id);

  const selectedId = useDataTrackStore((state) => state.selectedId);
  const activeId = useDataTrackStore((state) => state.activeId);
  const hoveredId = useDataTrackStore((state) => state.hoveredId);
  const isDraggingGlobal = useDataTrackStore((state) => state.isDragging);
  const elementMap = useManifestStore((state) => state.elementMap);

  const style: React.CSSProperties = {
    ...styles,
    borderRadius: styles?.borderRadius || 2,
    position: "relative",
    ...(isDragging
      ? {
          opacity: 0.5,
        }
      : {
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
  const elementLabel = elementMap[id]?.label || `#${id}`;
  const elementCustomClassName = elementMap[id]?.data?.className;

  return (
    <>
      <div
        className={`${elementCustomClassName || ""} ${
          hoveredId === id && !isDraggingGlobal
            ? "dropable-container-hover"
            : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          useDataTrackStore.setState({ selectedId: id });
        }}
        id={id}
        ref={(ref) => {
          wrapperRef && wrapperRef(ref);
          containerRef(ref);
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
            <Text size={300}>{elementLabel}</Text>
          </div>
        )}
        {children}
      </div>
      {isDragging &&
        createPortal(
          <DragOverlay dropAnimation={null} modifiers={[restrictToWindowEdges]}>
            <Card style={{ opacity: 0.8 }}>
              <Text size={400}>{elementLabel}</Text>
            </Card>
          </DragOverlay>,
          document.querySelector(".fui-FluentProvider")!
        )}
    </>
  );
};

export default Element;
