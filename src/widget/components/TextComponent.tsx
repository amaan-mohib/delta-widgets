import React, { useMemo } from "react";
import { IWidgetElement } from "../../types/manifest";
import { useDynamicTextStore } from "../stores/useVariableStore";
import { parseDynamicText } from "../utils";

interface TextComponentProps {
  component: IWidgetElement;
}

const TextComponent: React.FC<TextComponentProps> = ({ component }) => {
  const textVariables = useDynamicTextStore();
  const text = useMemo(
    () => parseDynamicText(component.data?.text || "Text", textVariables),
    [textVariables]
  );
  return (
    <div
      id={`${component.id}-child`}
      dangerouslySetInnerHTML={{
        __html: text,
      }}
    />
  );
};

export default TextComponent;
