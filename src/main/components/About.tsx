import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Caption2,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Image,
  Link,
  Spinner,
} from "@fluentui/react-components";
import { getVersion, getName } from "@tauri-apps/api/app";
import { check as checkUpdate, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { sendMixpanelEvent } from "../utils/analytics";

interface AboutProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const About: React.FC<AboutProps> = ({ open, setOpen }) => {
  const [appName, setAppName] = useState<string>("Delta Widgets");
  const [version, setVersion] = useState<string>("v0.0.1");
  const [updateData, setUpdateData] = useState<Update | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  const checkForUpdates = useCallback(async () => {
    setLoading(true);
    if (import.meta.env.MODE !== "development") {
      const update = await checkUpdate();
      setUpdateData(update);
    }
    setLoading(false);
  }, []);

  const checkVersion = useCallback(async () => {
    const version = await getVersion();
    setVersion(version);
    const name = await getName();
    setAppName(name);
  }, []);

  useEffect(() => {
    if (open) {
      checkForUpdates();
    }
  }, [open]);

  useEffect(() => {
    checkVersion();
  }, []);

  const handleUpdate = useCallback(async () => {
    if (updateData) {
      setUpdateLoading(true);
      try {
        await sendMixpanelEvent("update_clicked", {
          from: version,
          to: updateData.version,
        });
        await updateData.downloadAndInstall();
        await relaunch();
      } catch (error) {
        console.error("Update failed:", error);
      }
      setUpdateLoading(false);
    }
  }, [version, updateData]);

  return (
    <Dialog open={open} onOpenChange={(_, { open }) => setOpen(open)}>
      <DialogSurface style={{ width: "400px" }}>
        <DialogBody>
          <DialogTitle>About</DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "flex-start",
                marginTop: "1rem",
              }}>
              <Image
                src="/assets/delta-widgets.png"
                width={40}
                height={40}
                alt="logo"
              />
              <b>{appName}</b>
              <p>Version: {version}</p>
              <Link
                style={{ width: "fit-content" }}
                as="a"
                href="https://github.com/amaan-mohib/delta-widgets"
                target="_blank">
                Source code
              </Link>
              <Caption2>
                This app collects anonymous usage statistics (install and widget
                enable events) via Mixpanel. No personal data is tracked. Data
                is only used to measure installs and improve the app.
              </Caption2>
              {updateData && (
                <Button
                  icon={updateLoading ? <Spinner size="tiny" /> : null}
                  appearance="primary"
                  onClick={() => handleUpdate()}
                  disabled={updateLoading}>
                  Update available (v{updateData.version})
                </Button>
              )}
              {loading && <Spinner />}
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default About;
