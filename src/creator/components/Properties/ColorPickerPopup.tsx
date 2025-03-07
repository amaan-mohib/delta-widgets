import * as React from "react";
import { TinyColor } from "@ctrl/tinycolor";
import {
  makeStyles,
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tooltip,
  Input,
} from "@fluentui/react-components";
import {
  ColorPicker,
  ColorSlider,
  AlphaSlider,
  ColorPickerProps,
  ColorArea,
} from "@fluentui/react-color-picker-preview";

const useStyles = makeStyles({
  example: {
    width: "300px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  previewColor: {
    margin: "10px 0",
    width: "30px",
    height: "30px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    "@media (forced-colors: active)": {
      forcedColorAdjust: "none",
    },
  },
  row: {
    display: "flex",
    gap: "10px",
  },
  sliders: {
    display: "flex",
    flexDirection: "column",
  },
});

const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{0,8})$/;

export const ColorPickerPopup = ({
  color,
  setColor,
}: {
  color: string;
  setColor: (color: string) => void;
}) => {
  const styles = useStyles();
  const [previewColor, setPreviewColor] = React.useState(
    new TinyColor(color).toHsv()
  );
  const [hex, setHex] = React.useState(new TinyColor(color).toHex8String());

  const handleChange: ColorPickerProps["onColorChange"] = (_, data) => {
    setPreviewColor({ ...data.color, a: data.color.a ?? 1 });
    setHex(new TinyColor(data.color).toHex8String());
  };

  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <>
      <Popover
        positioning={"before"}
        open={popoverOpen}
        trapFocus
        onOpenChange={(_, data) => setPopoverOpen(data.open)}>
        <PopoverTrigger disableButtonEnhancement>
          <Tooltip positioning="after" content={color} relationship="label">
            <div
              className={styles.previewColor}
              style={{ backgroundColor: color }}
            />
          </Tooltip>
        </PopoverTrigger>

        <PopoverSurface>
          <ColorPicker color={previewColor} onColorChange={handleChange}>
            <ColorArea
              inputX={{ "aria-label": "Saturation" }}
              inputY={{ "aria-label": "Brightness" }}
            />
            <div className={styles.row}>
              <div className={styles.sliders}>
                <ColorSlider aria-label="Hue" />
                <AlphaSlider aria-label="Alpha" />
                <Input
                  style={{ margin: "10px 0" }}
                  value={hex}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newColor = new TinyColor(value);
                    if (newColor.isValid) {
                      setPreviewColor(newColor.toHsv());
                    }
                    setHex((oldValue) =>
                      HEX_COLOR_REGEX.test(value) ? value : oldValue
                    );
                  }}
                />
              </div>
              <div
                className={styles.previewColor}
                style={{
                  backgroundColor: new TinyColor(previewColor).toRgbString(),
                }}
              />
            </div>
          </ColorPicker>
          <div className={styles.row}>
            <Button
              appearance="primary"
              onClick={() => {
                const hex = new TinyColor(previewColor).toHex8String();
                setColor(hex);
                setHex(hex);
                setPopoverOpen(false);
              }}>
              Ok
            </Button>
            <Button
              onClick={() => {
                setPopoverOpen(false);
              }}>
              Cancel
            </Button>
          </div>
        </PopoverSurface>
      </Popover>
    </>
  );
};
