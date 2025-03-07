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

const ComponentRender: React.FC<ComponentRenderProps> = ({ component }) => {
  if (component.type === "container" || component.type === "container-grid") {
    return (
      <Dropable id={component.id} styles={component.styles}>
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
      <Dropable id={component.id} styles={component.styles} disableDrop>
        {component.data?.text || "Text"}
      </Dropable>
    );
  }
  return (
    <Dropable id={component.id} styles={component.styles} disableDrop>
      xyz
    </Dropable>
  );
};

export default ComponentRender;
