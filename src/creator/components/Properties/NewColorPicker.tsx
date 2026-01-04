import {
  Button,
  makeStyles,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tooltip,
} from "@fluentui/react-components";
import React, { useState } from "react";
import ColorPicker from "react-best-gradient-color-picker";

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
    marginTop: "10px",
  },
  sliders: {
    display: "flex",
    flexDirection: "column",
  },
});

interface IBackgroundObj {
  backgroundColor?: string;
  backgroundImage?: string;
}

interface NewColorPickerProps {
  color: IBackgroundObj;
  setColor: (color: IBackgroundObj) => void;
}

const NewColorPicker: React.FC<NewColorPickerProps> = ({ color, setColor }) => {
  const styles = useStyles();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const colorString =
    color.backgroundColor || color.backgroundImage || "transparent";
  const [previewColor, setPreviewColor] = React.useState(colorString);

  return (
    <>
      <Popover
        positioning={"before"}
        open={popoverOpen}
        trapFocus
        onOpenChange={(_, data) => setPopoverOpen(data.open)}>
        <PopoverTrigger disableButtonEnhancement>
          <Tooltip
            positioning="after"
            content={colorString}
            relationship="label">
            <div
              className={styles.previewColor}
              style={{ background: colorString }}
            />
          </Tooltip>
        </PopoverTrigger>

        <PopoverSurface>
          <ColorPicker
            hideColorGuide
            value={previewColor}
            onChange={(value) => {
              setPreviewColor(value);
            }}
          />
          <div className={styles.row}>
            <Button
              appearance="primary"
              onClick={() => {
                if (previewColor.includes("gradient")) {
                  setColor({
                    backgroundImage: previewColor,
                    backgroundColor: "",
                  });
                } else {
                  setColor({
                    backgroundColor: previewColor,
                    backgroundImage: "",
                  });
                }
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

export default NewColorPicker;
