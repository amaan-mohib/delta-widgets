import React, { useCallback, useEffect, useState } from "react";
import {
  Body2,
  Button,
  Caption2,
  Divider,
  Image,
  Link,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import { getVersion, getName } from "@tauri-apps/api/app";
import { check as checkUpdate, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { sendMixpanelEvent } from "../../utils/analytics";

const links = [
  {
    label: "Changelog",
    href: "https://github.com/amaan-mohib/delta-widgets/releases/latest",
  },
  {
    label: "Source code",
    href: "https://github.com/amaan-mohib/delta-widgets",
  },
  {
    label: "Report an issue",
    href: "https://github.com/amaan-mohib/delta-widgets/issues",
  },
  {
    label: "License",
    href: "https://github.com/amaan-mohib/delta-widgets/blob/main/LICENSE",
  },
];
interface AboutProps {}

const About: React.FC<AboutProps> = () => {
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
    checkForUpdates();
  }, []);

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
    <div>
      <Body2>About</Body2>
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
        <div style={{ display: "flex", gap: "8px" }}>
          {links.map((item, index) => (
            <React.Fragment key={item.label}>
              <Link
                style={{ fontSize: "12px" }}
                as="a"
                href={item.href}
                target="_blank">
                {item.label}
              </Link>
              {index < links.length - 1 && (
                <Divider vertical style={{ height: "100%" }} />
              )}
            </React.Fragment>
          ))}
        </div>
        <Caption2 style={{ color: tokens.colorNeutralForeground2 }}>
          This app collects anonymous usage statistics (install and widget
          enable events) via Mixpanel. No personal data is tracked. Data is only
          used to measure installs and improve the app.
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
    </div>
  );
};

export default About;
