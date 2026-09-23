import React, { useEffect, useState } from "react";
import { IEmitSettings } from "../../../common/types/variables";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import { listen } from "@tauri-apps/api/event";
import DateField from "./DateField";
import WeatherCity from "./WeatherCity";

interface WidgetSettingsDialogProps {}

const WidgetSettingsDialog: React.FC<WidgetSettingsDialogProps> = () => {
  const [widgetSettings, setWidgetSettings] = useState<IEmitSettings | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = listen<IEmitSettings>("widget-settings", ({ payload }) => {
      setOpen(true);
      setWidgetSettings(payload);
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  const onCancel = () => {
    setOpen(false);
    setWidgetSettings(null);
  };

  if (!widgetSettings) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(_, { open }) => {
        if (!open) {
          onCancel();
        }
      }}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{widgetSettings.label} Widget Settings</DialogTitle>
          <DialogContent
            style={{
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
            {Object.entries(widgetSettings.dateValues).map(([type, values]) =>
              values.map((value, index) => (
                <DateField
                  key={`${type}-${index}`}
                  type={type}
                  dateStr={value}
                  index={index}
                  manifestPath={widgetSettings.path}
                  manifestKey={widgetSettings.key}
                />
              )),
            )}
            {widgetSettings.hasWeather && (
              <WeatherCity
                manifestKey={widgetSettings.key}
                manifestPath={widgetSettings.path}
              />
            )}
          </DialogContent>
        </DialogBody>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default WidgetSettingsDialog;
