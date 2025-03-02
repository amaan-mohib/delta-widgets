import { makeStyles } from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import WindowProperties from "./WindowProperties";

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
    if (selectedElement?.type === "container") return () => <></>;
    return WindowProperties;
  }, [selectedElement]);

  return (
    <div className={styles.container}>
      <ElementProperties />
    </div>
  );
};

export default Properties;
