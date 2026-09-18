import React, { useEffect, useState } from "react";
import { IWidgetElement } from "../../../../common/types/manifest";
import { ResizableBox } from "react-resizable";
import { useManifestStore } from "../../../stores/useManifestStore";
import { useDataTrackStore } from "../../../stores/useDataTrackStore";
import { Image } from "@fluentui/react-components";
import { parseDynamicText } from "../../../utils";
import { getAssetPath } from "../../../../common/utils";

interface ImageComponentProps {
  component: IWidgetElement;
}

const ImageComponent: React.FC<ImageComponentProps> = ({ component }) => {
  const scale = useDataTrackStore((state) => state.scale);
  const widgetDimension = useManifestStore(
    (state) => state.manifest?.dimensions,
  );
  const [bgImage, setBgImage] = useState("");

  useEffect(() => {
    const src: string | undefined = component.data?.src;
    if (!src) {
      setBgImage("");
      return;
    }

    getAssetPath(src)
      .then((img) => {
        setBgImage(img);
      })
      .catch(() => {
        setBgImage("");
      });
  }, [JSON.stringify(component.data || {})]);

  return (
    <ResizableBox
      transformScale={scale}
      className="react-resizable-image"
      maxConstraints={[
        widgetDimension?.width || 0,
        widgetDimension?.height || 0,
      ]}
      onResizeStart={() => {
        useDataTrackStore.setState({ zoomDisabled: true });
      }}
      onResizeStop={() => {
        useDataTrackStore.setState({ zoomDisabled: false });
      }}
      onResize={(_, { size }) => {
        useManifestStore.getState().updateElementProperties(component.id, {
          styles: {
            width: `${size.width}px`,
            height: `${size.height}px`,
          },
        });
      }}
      resizeHandles={["se"]}
      width={parseInt(String(component.styles.width || "100px")) || 100}
      height={parseInt(String(component.styles.height || "100px")) || 100}
      draggableOpts={{ grid: [1, 1] }}>
      <Image
        id={`${component.id}-child`}
        src={
          bgImage ||
          parseDynamicText(component.data?.src) ||
          "https://placehold.co/400x400?text=No+Image"
        }
        alt={component.data?.alt}
        fit={component.data?.fit || "cover"}
        shape={component.data?.shape || "square"}
        shadow={component.data?.shadow || false}
        bordered={component.data?.bordered || false}
        block
      />
    </ResizableBox>
  );
};

export default ImageComponent;
