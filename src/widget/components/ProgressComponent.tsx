import React, { useMemo } from "react";
import { ProgressBar } from "@fluentui/react-components";
import { IWidgetElement } from "../../types/manifest";
import { useDynamicTextStore } from "../stores/useVariableStore";
import { parseDynamicText } from "../utils";

interface ProgressComponentProps {
  component: IWidgetElement;
}

const ProgressComponent: React.FC<ProgressComponentProps> = ({ component }) => {
  const textVariables = useDynamicTextStore();
  const { value, maxValue } = useMemo(
    () => ({
      maxValue: Number(
        parseDynamicText(
          String(component.data?.maxValue || "100"),
          textVariables
        )
      ),
      value: Number(
        parseDynamicText(String(component.data?.value || "100"), textVariables)
      ),
    }),
    [textVariables]
  );

  return (
    <ProgressBar
      value={value / maxValue}
      thickness={component.data?.thickness || "medium"}
    />
  );
};

export default ProgressComponent;
