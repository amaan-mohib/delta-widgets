import React, { useMemo } from "react";
import { Image } from "@fluentui/react-components";
import { IWidgetElement } from "../../types/manifest";
import { useDynamicTextStore } from "../stores/useVariableStore";
import { parseDynamicText } from "../utils";

interface ImageComponentProps {
  component: IWidgetElement;
}

const ImageComponent: React.FC<ImageComponentProps> = ({ component }) => {
  const textVariables = useDynamicTextStore();
  const src = useMemo(
    () =>
      parseDynamicText(component.data?.src, textVariables) ||
      "https://placehold.co/400x400?text=No+Image",
    [textVariables]
  );
  return (
    <div
      style={{
        width: parseInt(String(component.styles.width || "100px")) || 100,
        height: parseInt(String(component.styles.height || "100px")) || 100,
      }}>
      <Image
        id={`${component.id}-child`}
        src={src}
        alt={component.data?.alt}
        fit={component.data?.fit || "cover"}
        shape={component.data?.shape || "square"}
        shadow={component.data?.shadow || false}
        bordered={component.data?.bordered || false}
        block
      />
    </div>
  );
};

export default ImageComponent;
