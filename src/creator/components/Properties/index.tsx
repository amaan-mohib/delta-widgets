import { makeStyles } from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";

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
  const elementProperties = useMemo(() => {
    if (!selectedId) return null;
    return elementMap[selectedId];
  }, [selectedId]);

  if (!selectedId || !elementProperties) return null;
  return (
    <div className={styles.container}>
      {selectedId}
      {JSON.stringify(elementProperties, null, 2)}
    </div>
  );
};

export default Properties;
