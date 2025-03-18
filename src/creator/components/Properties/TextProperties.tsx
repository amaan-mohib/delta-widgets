import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Checkbox,
  Divider,
  Field,
  Input,
  makeStyles,
  SpinButton,
  Text,
  tokens,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
  Tooltip,
  typographyStyles,
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
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { MathFormulaRegular } from "@fluentui/react-icons/fonts";
import { spinButtonOnChange } from "../../utils";
import { ColorPickerPopup } from "./ColorPickerPopup";
import GridItemProperties from "./GridItemProperties";

interface TextPropertiesProps {}

const useStyles = makeStyles({
  padding: {
    padding: "10px 12px",
  },
  title: typographyStyles.subtitle2,
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
});

const TextProperties: React.FC<TextPropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const textStyles = useMemo(
    () => elementMap[selectedId].styles,
    [elementMap[selectedId].styles]
  );

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Text</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion collapsible multiple defaultOpenItems={["size"]}>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end" size="large">
            Properties
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Text">
              <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                <Input
                  style={{ width: "140px" }}
                  placeholder="Enter text"
                  onChange={(_, { value }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: { text: value || "" },
                      });
                  }}
                  value={elementMap[selectedId].data?.text || ""}
                />
                <Tooltip
                  content="Expression"
                  relationship="label"
                  positioning={"above-end"}
                  withArrow>
                  <Button
                    size="small"
                    appearance="outline"
                    icon={<MathFormulaRegular style={{ fontSize: "16px" }} />}
                  />
                </Tooltip>
              </div>
            </Field>
            <Field orientation="horizontal" label="Alignment">
              <Toolbar
                checkedValues={{
                  textAlign: [textStyles.textAlign || "left"],
                }}
                onCheckedValueChange={(_, { name, checkedItems }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
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
            </Field>
            <Field orientation="horizontal" label="Formatting">
              <Toolbar
                checkedValues={{
                  fontWeight: [String(textStyles.fontWeight || "normal")],
                  fontStyle: [String(textStyles.fontStyle || "normal")],
                  textDecoration: [
                    String(textStyles.textDecoration || "normal"),
                  ],
                }}
                onCheckedValueChange={(_, { name, checkedItems }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
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
            </Field>
            <Field orientation="horizontal" label="Size (px)">
              <SpinButton
                value={parseInt(String(textStyles.fontSize || 16), 10)}
                onChange={(event, data) => {
                  spinButtonOnChange(
                    event,
                    data,
                    (value) => {
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
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
            </Field>
            <Field orientation="horizontal" label="Shadow">
              <Checkbox
                checked={
                  textStyles.textShadow && textStyles.textShadow !== "none"
                }
                onChange={(_, { checked }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      styles: {
                        textShadow: checked ? "1px 1px black" : "none",
                      },
                    });
                }}
              />
            </Field>
            <Field orientation="horizontal" label="Color">
              <ColorPickerPopup
                color={
                  textStyles.color ||
                  window
                    .getComputedStyle(
                      document.querySelector(".fui-FluentProvider")!
                    )
                    .getPropertyValue(
                      tokens.colorNeutralForeground1.replace(/var\(|\)/g, "")
                    )
                }
                setColor={(color) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      styles: {
                        color,
                      },
                    });
                }}
              />
            </Field>
          </AccordionPanel>
        </AccordionItem>
        <GridItemProperties
          selectedId={selectedId}
          gridItemStyles={elementMap[selectedId].styles.gridItem}
        />
      </Accordion>
    </div>
  );
};

export default TextProperties;
