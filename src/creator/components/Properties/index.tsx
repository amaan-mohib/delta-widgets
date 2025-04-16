import { makeStyles } from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import WindowProperties from "./WindowProperties";
import ContainerProperties from "./ContainerProperties";
import TextProperties from "./TextProperties";
import GridProperties from "./GridProperties";
import ButtonProperties from "./ButtonProperties";
import ImageProperties from "./ImageProperties";
import SliderProperties from "./SliderProperties";

interface PropertiesProps {}

const useStyles = makeStyles({
  container: {
    height: "100%",
    width: "var(--sidebar-width)",
    display: "flex",
    flexDirection: "column",
  },
});

const Properties: React.FC<PropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);
  const selectedElement = useMemo(() => {
    if (!selectedId) return null;
    return elementMap[selectedId];
  }, [selectedId]);

  const elementProperties = useMemo(() => {
    switch (selectedElement?.type) {
      case "container":
        return <ContainerProperties />;
      case "container-grid":
        return <GridProperties />;
      case "text":
        return <TextProperties />;
      case "button":
        return <ButtonProperties />;
      case "toggle-play":
      case "media-next":
      case "media-prev":
      case "media-select":
        return <ButtonProperties disableDynamic />;
      case "image":
        return <ImageProperties />;
      case "slider":
        return <SliderProperties />;
      case "media-slider":
        return <SliderProperties disableDynamic />;
      default:
        return <WindowProperties />;
    }
  }, [selectedElement]);

  return <div className={styles.container}>{elementProperties}</div>;
};

export default Properties;
