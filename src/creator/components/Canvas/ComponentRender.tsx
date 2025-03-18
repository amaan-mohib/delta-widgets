import React from "react";
import { IWidgetElement } from "../../../types/manifest";
import Dropable from "../Dropable";
import {
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface ComponentRenderProps {
  component: IWidgetElement;
}

const getComponentStyles = (
  styles: IWidgetElement["styles"]
): React.CSSProperties => {
  const rowSpan = styles.gridItem?.rowSpan || 1;
  const colSpan = styles.gridItem?.columnSpan || 1;

  return {
    ...styles,
    ...(styles.gridSize
      ? {
          gridTemplateColumns:
            styles.gridSize.columns === "auto" ||
            styles.gridSize.columns === undefined
              ? "auto"
              : `repeat(${styles.gridSize.columns}, 1fr)`,
          gridTemplateRows:
            styles.gridSize.rows === "auto" ||
            styles.gridSize.rows === undefined
              ? "auto"
              : `repeat(${styles.gridSize.rows}, 1fr)`,
        }
      : {}),
    ...(styles.gridItem
      ? {
          gridRow: `span ${rowSpan} / span ${rowSpan}`,
          gridColumn: `span ${colSpan} / span ${colSpan}`,
        }
      : {}),
  };
};

const ComponentRender: React.FC<ComponentRenderProps> = ({ component }) => {
  if (component.type === "container" || component.type === "container-grid") {
    return (
      <Dropable id={component.id} styles={getComponentStyles(component.styles)}>
        {component.children && component.children.length > 0 && (
          <SortableContext
            strategy={
              component.styles.flexDirection === "column"
                ? verticalListSortingStrategy
                : horizontalListSortingStrategy
            }
            items={component.children.map((item) => item.id)}>
            {component.children.map((child) => (
              <ComponentRender key={child.id} component={child} />
            ))}
          </SortableContext>
        )}
      </Dropable>
    );
  }
  if (component.type === "text") {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles(component.styles)}
        disableDrop>
        {component.data?.text || "Text"}
      </Dropable>
    );
  }
  return (
    <Dropable
      id={component.id}
      styles={getComponentStyles(component.styles)}
      disableDrop>
      xyz
    </Dropable>
  );
};

export default ComponentRender;
