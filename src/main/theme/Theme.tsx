import {
  Button,
  Checkbox,
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
} from "@fluentui/react-components";
import React, { useEffect, useState } from "react";
import { getStore } from "../../common";
import { invoke } from "@tauri-apps/api/core";
import { blue, defaultTheme, green, red, yellow } from "../../common/themes";
import { useThemeStore } from "./useThemeStore";

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

const onSave = async (mode: string, color: string, overrideTheme: boolean) => {
  await invoke("write_to_store_cmd", {
    key: "mode",
    value: mode,
  });
  await invoke("write_to_store_cmd", {
    key: "color",
    value: color,
  });
  await invoke("write_to_store_cmd", {
    key: "overrideTheme",
    value: overrideTheme,
  });
};

const Theme: React.FC<ThemeProps> = ({ open, setOpen }) => {
  const [mode, setMode] = useState("system");
  const [color, setColor] = useState("default");
  const [overrideTheme, setOverrideTheme] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDefaults = async () => {
    const { mode, color, overrideTheme } = await getStore();
    if (mode && colors.find((c) => c.value === color)) {
      setMode(mode);
      setColor(color);
    } else {
      setMode("system");
      setColor("default");
    }
    setOverrideTheme(overrideTheme || false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(mode, color, overrideTheme);
      useThemeStore.setState({ mode, color, overrideTheme });
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
            <Field label="Mode">
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
            <Checkbox
              style={{ margin: "10px 0" }}
              checked={overrideTheme}
              onChange={(_, { checked }) =>
                setOverrideTheme((checked as boolean) || false)
              }
              label="Override theme in widgets if not provided?"
            />
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

export default Theme;
