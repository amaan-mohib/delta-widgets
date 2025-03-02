import React from "react";
import { IWidgetElement } from "../../../types/manifest";
import Dropable from "../Dropable";

interface ComponentRenderProps {
  component: IWidgetElement;
}

const ComponentRender: React.FC<ComponentRenderProps> = ({ component }) => {
  if (component.type === "container") {
    return (
      <Dropable id={component.id} styles={component.styles}>
        {component.children &&
          component.children.map((child) => (
            <ComponentRender key={child.id} component={child} />
          ))}
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
