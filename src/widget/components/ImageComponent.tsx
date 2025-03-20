import React from "react";
import { Image } from "@fluentui/react-components";
import { IWidgetElement } from "../../types/manifest";

interface ImageComponentProps {
  component: IWidgetElement;
}

const ImageComponent: React.FC<ImageComponentProps> = ({ component }) => {
  return (
    <div
      style={{
        width: parseInt(String(component.styles.width || "100px")) || 100,
        height: parseInt(String(component.styles.height || "100px")) || 100,
      }}>
      <Image
        id={`${component.id}-child`}
        src={
          component.data?.src || "https://placehold.co/400x400?text=No+Image"
        }
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
