import { makeStyles } from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import WindowProperties from "./WindowProperties";
import ContainerProperties from "./ContainerProperties";
import TextProperties from "./TextProperties";
import GridProperties from "./GridProperties";

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

  const ElementProperties: React.FC = useMemo(() => {
    if (selectedElement?.type === "container") return ContainerProperties;
    if (selectedElement?.type === "container-grid") return GridProperties;
    if (selectedElement?.type === "text") return TextProperties;
    return WindowProperties;
  }, [selectedElement]);

  return (
    <div className={styles.container}>
      <ElementProperties />
    </div>
  );
};

export default Properties;
