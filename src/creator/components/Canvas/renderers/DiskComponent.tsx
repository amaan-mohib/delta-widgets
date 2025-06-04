import React from "react";
import { makeStyles, ProgressBar } from "@fluentui/react-components";

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
  const styles = useStyles();

  return (
    <React.Fragment>
      <div className={styles.container}>
        <div className={styles.label}>
          <div>C:\</div>
          <div>93 GB free of 512 GB</div>
        </div>
        <ProgressBar value={(512 - 93) / 512} thickness="large" />
      </div>
      <div className={styles.container}>
        <div className={styles.label}>
          <div>D:\</div>
          <div>50 GB free of 512 GB</div>
        </div>
        <ProgressBar value={(512 - 50) / 512} thickness="large" />
      </div>
    </React.Fragment>
  );
};

export default DiskComponent;
