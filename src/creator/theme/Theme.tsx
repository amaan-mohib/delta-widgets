import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Radio,
  RadioGroup,
  Tooltip,
} from "@fluentui/react-components";
import React, { useEffect, useMemo, useState } from "react";
import { blue, defaultTheme, green, red, yellow } from "../../common/themes";
import { useThemeStore } from "./useThemeStore";
import { useManifestStore } from "../stores/useManifestStore";

const modes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const colors = [
  { label: "Default", value: "default", color: defaultTheme.color },
  { label: "Blue", value: "blue", color: blue.color },
  { label: "Red", value: "red", color: red.color },
  { label: "Green", value: "green", color: green.color },
  { label: "Yellow", value: "yellow", color: yellow.color },
];

interface ThemeProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Theme: React.FC<ThemeProps> = ({ open, setOpen }) => {
  const [mode, setMode] = useState("system");
  const [color, setColor] = useState("default");
  const [loading, setLoading] = useState(false);
  const store = useThemeStore();

  const getDefaults = async () => {
    setMode(store.mode);
    setColor(store.color);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      useManifestStore.getState().updateManifest({
        theme: { mode: mode as any, color },
      });
      useThemeStore.setState({ mode, color });
      setLoading(false);
      setOpen(false);
    } catch (error) {
      console.error("Error saving theme settings:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    getDefaults();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(_, { open }) => setOpen(open)}>
      <DialogSurface style={{ width: "400px" }}>
        <DialogBody>
          <DialogTitle>Theme</DialogTitle>
          <DialogContent>
            <div>These settings apply only to the widget</div>
            <Field label="Mode" style={{ marginTop: 10 }}>
              <RadioGroup
                value={mode}
                onChange={(_, { value }) => {
                  setMode(value);
                }}>
                {modes.map((mode) => (
                  <Radio
                    key={mode.value}
                    value={mode.value}
                    label={mode.label}
                  />
                ))}
              </RadioGroup>
            </Field>
            <Field label="Color" style={{ marginTop: 10 }}>
              <RadioGroup
                value={color}
                onChange={(_, { value }) => {
                  setColor(value);
                }}>
                {colors.map((color) => (
                  <Radio
                    key={color.value}
                    value={color.value}
                    label={
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: color.color,
                            borderRadius: 4,
                          }}></div>
                        <span>{color.label}</span>
                      </div>
                    }
                  />
                ))}
              </RadioGroup>
            </Field>
          </DialogContent>
        </DialogBody>
        <DialogActions>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="secondary">Close</Button>
          </DialogTrigger>
          <DialogTrigger disableButtonEnhancement>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={loading}>
              Save
            </Button>
          </DialogTrigger>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export const ThemePicker: React.FC<{}> = () => {
  const [open, setOpen] = useState(false);
  const { color } = useThemeStore();

  const colorHex = useMemo(
    () => colors.find((c) => c.value === color)?.color || defaultTheme.color,
    [color]
  );

  return (
    <>
      <Theme open={open} setOpen={setOpen} />
      <Tooltip content="Theme applied on the widget" relationship="label">
        <Button
          size="small"
          appearance="subtle"
          onClick={() => {
            setOpen(true);
          }}
          icon={
            <div
              style={{
                backgroundColor: colorHex,
                width: 16,
                height: 16,
                borderRadius: 4,
              }}
            />
          }>
          Theme
        </Button>
      </Tooltip>
    </>
  );
};

export default Theme;
