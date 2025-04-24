import React from "react";
import { ProgressBar } from "@fluentui/react-components";
import { IWidgetElement } from "../../../types/manifest";

interface ProgressComponentProps {
  component: IWidgetElement;
}

const ProgressComponent: React.FC<ProgressComponentProps> = ({ component }) => {
  const maxValue = parseFloat(String(component.data?.maxValue)) || 100;
  const value = parseFloat(String(component.data?.value)) || 10;

  return (
    <ProgressBar
      value={value / maxValue}
      thickness={component.data?.thickness || "medium"}
    />
  );
};

export default ProgressComponent;
