import React from "react";
import { makeStyles, ProgressBar } from "@fluentui/react-components";
import { useVariableStore } from "../stores/useVariableStore";
import { humanStorageSize } from "../utils/utils";

interface DiskComponentProps {}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
});

const DiskComponent: React.FC<DiskComponentProps> = () => {
  const {
    systemInfo: { disks = [] },
  } = useVariableStore();
  const styles = useStyles();

  return (
    <React.Fragment>
      {disks.map((disk) => (
        <div key={disk.name} className={styles.container}>
          <div className={styles.label}>
            <div>
              {disk.name} ({disk.mount_point})
            </div>
            <div>
              {`${humanStorageSize(
                disk.available_space,
                true
              )} free of ${humanStorageSize(disk.total_space, true)}`}
            </div>
          </div>
          <ProgressBar
            value={(disk.total_space - disk.available_space) / disk.total_space}
            thickness="large"
          />
        </div>
      ))}
    </React.Fragment>
  );
};

export default DiskComponent;
