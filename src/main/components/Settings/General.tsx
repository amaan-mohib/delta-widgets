import React, { useCallback, useEffect, useState } from "react";
import * as autostart from "@tauri-apps/plugin-autostart";
import { Body2, Button, Switch } from "@fluentui/react-components";
import { commands } from "../../../common/commands";

interface IProps {}

const General: React.FC<IProps> = () => {
  const [autostartEnabled, setAutostartEnabled] = useState(false);

  const toggleAutostart = useCallback(async () => {
    if (autostartEnabled) {
      await autostart.disable();
    } else {
      await autostart.enable();
    }
    await commands.writeToStoreCmd({
      key: "autostart",
      value: !autostartEnabled,
    });
    setAutostartEnabled((prev) => !prev);
  }, [autostartEnabled]);

  useEffect(() => {
    autostart.isEnabled().then((enabled) => {
      setAutostartEnabled(enabled);
    });
  }, []);

  return (
    <div>
      <Body2>General</Body2>
      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
        <div
          style={{
            marginLeft: -8,
          }}>
          <Switch
            label={"Launch on startup"}
            labelPosition="before"
            checked={autostartEnabled}
            onChange={() => {
              toggleAutostart();
            }}
          />
        </div>
        {import.meta.env.MODE === "development" && (
          <div>
            <Button
              onClick={() => {
                commands.migrate({ direction: "up" });
              }}>
              Migrate Up
            </Button>
            <Button
              onClick={() => {
                commands.migrate({ direction: "down" });
              }}>
              Migrate Down
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default General;
