import React, { useEffect, useMemo } from "react";
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
  SpinButton,
  tokens,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
  Tooltip,
} from "@fluentui/react-components";
import {
  SettingsRegular,
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
import DateField from "../../../common/components/DateField";
import WeatherCity, {
  WeatherCityValue,
} from "../../../common/components/WeatherCity";
import "react-fontpicker-ts/dist/index.css";

interface TextPropertiesProps {}

const dateExpressionRegex = /\{\{(date|time|datetime)(?::([^}]+))?\}\}/g;
const weatherExpressionRegex = /\{\{weather(?::[^}]+)?\}\}/;

const replaceDateExpression = (
  text: string,
  targetIndex: number,
  value: string,
) => {
  let occurrence = 0;
  return text.replace(dateExpressionRegex, (match) => {
    const replacement = occurrence === targetIndex ? value : match;
    occurrence++;
    return replacement;
  });
};

// const defaultFont = `'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif`;

const TextProperties: React.FC<TextPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);
  const manifest = useManifestStore((state) => state.manifest);
  const [isDefaultFont, setIsDefaultFont] = React.useState(true);
  const selectedElement = selectedId ? elementMap[selectedId] : undefined;
  const textValue = String(selectedElement?.data?.text || "");
  const hasWeatherVariable = weatherExpressionRegex.test(textValue);
  const dateFields = useMemo(() => {
    return Array.from(textValue.matchAll(dateExpressionRegex)).map(
      ([match, type, format]) => ({
        type,
        dateStr: `${type}${format ? `:${format}` : ""}`,
        match,
      }),
    );
  }, [textValue]);
  const textStyles = selectedElement?.styles || {};
  const defaultColor = useMemo(
    () =>
      window
        .getComputedStyle(document.querySelector(".fui-FluentProvider")!)
        .getPropertyValue(
          tokens.colorNeutralForeground1.replace(/var\(|\)/g, ""),
        ),
    [],
  );

  const updateProperties = (value: IUpdateElementProperties) => {
    if (!selectedId) return;
    if (
      value.styles?.fontFamily &&
      textStyles.fontFamily === value.styles?.fontFamily
    )
      return;

    useManifestStore.getState().updateElementProperties(selectedId, value);
  };

  useEffect(() => {
    if (!selectedId || !selectedElement) return;
    if (textStyles.fontFamily) {
      setIsDefaultFont(textStyles.fontFamily === tokens.fontFamilyBase);
    } else {
      setIsDefaultFont(true);
    }
  }, [selectedId, selectedElement, textStyles.fontFamily]);

  if (!selectedId || !selectedElement) return null;

  const updateText = (text: string) => {
    updateProperties({ data: { text } });
  };

  const selectWeatherCity = (weatherCity: WeatherCityValue) => {
    useManifestStore.getState().updateCustomValues({ weatherCity });
  };

  const resetWeatherCity = () => {
    useManifestStore.getState().removeCustomValues("weatherCity");
  };

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
                  value={selectedElement.data?.text}
                  onChange={(value) => {
                    updateText(value || "");
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
                              selectedElement.data?.previousFont ||
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
                          : selectedElement.data?.previousFont
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
            ...(dateFields.length !== 0
              ? [
                  {
                    label: "Date & Time",
                    control: (
                      <Dialog>
                        <DialogTrigger disableButtonEnhancement>
                          <Button icon={<SettingsRegular />} />
                        </DialogTrigger>
                        <DialogSurface>
                          <DialogBody>
                            <DialogTitle>Date & Time Settings</DialogTitle>
                            <DialogContent>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 12,
                                }}>
                                {dateFields.map((field, index) => (
                                  <DateField
                                    key={`${field.type}-${index}`}
                                    type={field.type}
                                    index={index}
                                    dateStr={field.dateStr}
                                    onSubmit={(value) => {
                                      updateText(
                                        replaceDateExpression(
                                          textValue,
                                          index,
                                          value,
                                        ),
                                      );
                                    }}
                                  />
                                ))}
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
                    ),
                  },
                ]
              : []),
            ...(hasWeatherVariable
              ? [
                  {
                    label: "Weather City",
                    control: (
                      <Dialog>
                        <DialogTrigger disableButtonEnhancement>
                          <Button icon={<SettingsRegular />} />
                        </DialogTrigger>
                        <DialogSurface>
                          <DialogBody>
                            <DialogTitle>Weather Settings</DialogTitle>
                            <DialogContent>
                              <WeatherCity
                                weatherCity={
                                  manifest?.customFields?.weatherCity
                                }
                                onSelect={selectWeatherCity}
                                onReset={resetWeatherCity}
                              />
                            </DialogContent>
                            <DialogActions>
                              <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">Close</Button>
                              </DialogTrigger>
                            </DialogActions>
                          </DialogBody>
                        </DialogSurface>
                      </Dialog>
                    ),
                  },
                ]
              : []),
            {
              label: "Alignment",
              control: (
                <Toolbar
                  size="small"
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
                  size="small"
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
                      size="small"
                      name="fontWeight"
                      appearance="subtle"
                      value="bold"
                      icon={<TextBoldRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Italic" relationship="label" withArrow>
                    <ToolbarToggleButton
                      size="small"
                      name="fontStyle"
                      appearance="subtle"
                      value="italic"
                      icon={<TextItalicRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Underline" relationship="label" withArrow>
                    <ToolbarToggleButton
                      size="small"
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
                  size="small"
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
                      16,
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
