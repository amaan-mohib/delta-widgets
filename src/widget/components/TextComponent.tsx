import React, { useMemo } from "react";
import { IWidgetElement } from "../../common/types/manifest";
import { useDynamicTextStore } from "../stores/useVariableStore";
import { parseDynamicText } from "../utils/utils";
import { sanitizeHtml } from "../../common/sanitizeHtml";

interface TextComponentProps {
  component: IWidgetElement;
}

const TextComponent: React.FC<TextComponentProps> = ({ component }) => {
  const textVariables = useDynamicTextStore();
  const text = useMemo(
    () => parseDynamicText(component.data?.text || "Text", textVariables),
    [textVariables],
  );
  return (
    <div
      id={`${component.id}-child`}
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(text),
      }}
    />
  );
};

export default TextComponent;
