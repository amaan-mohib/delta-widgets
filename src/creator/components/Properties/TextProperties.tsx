import React, { useEffect, useMemo } from "react";
import {
  Checkbox,
  SpinButton,
  tokens,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
  Tooltip,
} from "@fluentui/react-components";
import {
  TextAlignCenterRegular,
  TextAlignJustifyRegular,
  TextAlignLeftRegular,
  TextAlignRightRegular,
  TextBoldRegular,
  TextItalicRegular,
  TextUnderlineRegular,
} from "@fluentui/react-icons";
import FontPicker from "react-fontpicker-ts";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import {
  IUpdateElementProperties,
  useManifestStore,
} from "../../stores/useManifestStore";
import { spinButtonOnChange } from "../../utils";
import { ColorPickerPopup } from "./ColorPickerPopup";
import Panel from "./Panel";
import TemplateEditor from "../TemplateEditor";
import "react-fontpicker-ts/dist/index.css";

interface TextPropertiesProps {}

// const defaultFont = `'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif`;

const TextProperties: React.FC<TextPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);
  const [isDefaultFont, setIsDefaultFont] = React.useState(true);
  const textStyles = selectedId ? elementMap[selectedId].styles : {};
  const defaultColor = useMemo(
    () =>
      window
        .getComputedStyle(document.querySelector(".fui-FluentProvider")!)
        .getPropertyValue(
          tokens.colorNeutralForeground1.replace(/var\(|\)/g, "")
        ),
    []
  );

  const updateProperties = (value: IUpdateElementProperties) => {
    if (!selectedId) return;
    useManifestStore.getState().updateElementProperties(selectedId, value);
  };

  useEffect(() => {
    if (!selectedId) return;
    if (textStyles.fontFamily) {
      setIsDefaultFont(textStyles.fontFamily === tokens.fontFamilyBase);
    } else {
      setIsDefaultFont(true);
    }
  }, [selectedId, textStyles.fontFamily]);

  if (!selectedId || !elementMap[selectedId]) return null;

  return (
    <Panel
      title="Text"
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Text",
              control: (
                <TemplateEditor
                  value={elementMap[selectedId].data?.text}
                  onChange={(value) => {
                    updateProperties({
                      data: { text: value || "" },
                    });
                  }}
                  isHtml
                />
              ),
            },
            {
              label: "Font",
              control: (
                <div>
                  <Checkbox
                    label="Default"
                    checked={isDefaultFont}
                    onChange={(_, { checked }) => {
                      console.log({ checked });
                      setIsDefaultFont(Boolean(checked));
                      if (checked) {
                        updateProperties({
                          styles: {
                            fontFamily: tokens.fontFamilyBase,
                          },
                          data: {
                            previousFont:
                              textStyles.fontFamily || tokens.fontFamilyBase,
                          },
                        });
                      } else {
                        updateProperties({
                          styles: {
                            fontFamily:
                              elementMap[selectedId].data?.previousFont ||
                              tokens.fontFamilyBase,
                          },
                        });
                      }
                    }}
                  />
                  {!isDefaultFont && (
                    <FontPicker
                      defaultValue={
                        textStyles.fontFamily !== tokens.fontFamilyBase
                          ? textStyles.fontFamily
                          : elementMap[selectedId].data?.previousFont
                      }
                      value={(value) => {
                        updateProperties({
                          styles: {
                            fontFamily: value,
                          },
                        });
                      }}
                    />
                  )}
                </div>
              ),
            },
            {
              label: "Alignment",
              control: (
                <Toolbar
                  checkedValues={{
                    textAlign: [textStyles.textAlign || "left"],
                  }}
                  onCheckedValueChange={(_, { name, checkedItems }) => {
                    updateProperties({
                      styles: { [name]: checkedItems[0] },
                    });
                  }}>
                  <ToolbarRadioGroup>
                    <Tooltip content="Left" relationship="label" withArrow>
                      <ToolbarRadioButton
                        appearance="subtle"
                        name="textAlign"
                        value="left"
                        icon={<TextAlignLeftRegular />}
                      />
                    </Tooltip>
                    <Tooltip content="Center" relationship="label" withArrow>
                      <ToolbarRadioButton
                        name="textAlign"
                        appearance="subtle"
                        value="center"
                        icon={<TextAlignCenterRegular />}
                      />
                    </Tooltip>
                    <Tooltip content="Right" relationship="label" withArrow>
                      <ToolbarRadioButton
                        name="textAlign"
                        appearance="subtle"
                        value="right"
                        icon={<TextAlignRightRegular />}
                      />
                    </Tooltip>
                    <Tooltip content="Justify" relationship="label" withArrow>
                      <ToolbarRadioButton
                        name="textAlign"
                        appearance="subtle"
                        value="justify"
                        icon={<TextAlignJustifyRegular />}
                      />
                    </Tooltip>
                  </ToolbarRadioGroup>
                </Toolbar>
              ),
            },
            {
              label: "Formatting",
              control: (
                <Toolbar
                  checkedValues={{
                    fontWeight: [String(textStyles.fontWeight || "normal")],
                    fontStyle: [String(textStyles.fontStyle || "normal")],
                    textDecoration: [
                      String(textStyles.textDecoration || "normal"),
                    ],
                  }}
                  onCheckedValueChange={(_, { name, checkedItems }) => {
                    updateProperties({
                      styles: { [name]: checkedItems[1] },
                    });
                  }}>
                  <Tooltip content="Bold" relationship="label" withArrow>
                    <ToolbarToggleButton
                      name="fontWeight"
                      appearance="subtle"
                      value="bold"
                      icon={<TextBoldRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Italic" relationship="label" withArrow>
                    <ToolbarToggleButton
                      name="fontStyle"
                      appearance="subtle"
                      value="italic"
                      icon={<TextItalicRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Underline" relationship="label" withArrow>
                    <ToolbarToggleButton
                      name="textDecoration"
                      appearance="subtle"
                      value="underline"
                      icon={<TextUnderlineRegular />}
                    />
                  </Tooltip>
                </Toolbar>
              ),
            },
            {
              label: "Size (px)",
              control: (
                <SpinButton
                  value={parseInt(String(textStyles.fontSize || 16), 10)}
                  onChange={(event, data) => {
                    spinButtonOnChange(
                      event,
                      data,
                      (value) => {
                        updateProperties({
                          styles: {
                            fontSize: `${value}px`,
                            lineHeight: `${value}px`,
                          },
                        });
                      },
                      16
                    );
                  }}
                />
              ),
            },
            {
              label: "Shadow",
              control: (
                <Checkbox
                  checked={
                    !!(
                      textStyles.textShadow && textStyles.textShadow !== "none"
                    )
                  }
                  onChange={(_, { checked }) => {
                    updateProperties({
                      styles: {
                        textShadow: checked ? "1px 1px black" : "none",
                      },
                    });
                  }}
                />
              ),
            },
            {
              label: "Color",
              control: (
                <ColorPickerPopup
                  color={textStyles.color || defaultColor}
                  setColor={(color) => {
                    updateProperties({
                      styles: {
                        color,
                      },
                    });
                  }}
                />
              ),
            },
          ],
        },
      ]}
      selectedId={selectedId}
    />
  );
};

export default TextProperties;
