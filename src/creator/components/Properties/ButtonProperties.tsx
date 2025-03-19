import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Checkbox,
  Divider,
  Field,
  InfoLabel,
  Input,
  Link,
  makeStyles,
  Select,
  Text,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  Tooltip,
  typographyStyles,
} from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { MathFormulaRegular } from "@fluentui/react-icons/fonts";
import GridItemProperties from "./GridItemProperties";
import {
  TextAlignCenterRegular,
  TextAlignLeftRegular,
  TextAlignRightRegular,
} from "@fluentui/react-icons";

interface ButtonPropertiesProps {}

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

const ButtonProperties: React.FC<ButtonPropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const buttonData = useMemo(
    () => elementMap[selectedId].data,
    [elementMap[selectedId].data]
  );

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Button</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion collapsible multiple defaultOpenItems={["size", "icon"]}>
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
            <Field orientation="horizontal" label="Type">
              <Select
                value={buttonData?.type || "secondary"}
                onChange={(_, { value }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      data: { type: value || "secondary" },
                    });
                }}>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="subtle">Subtle</option>
                <option value="transparent">Transparent</option>
              </Select>
            </Field>
            <Field orientation="horizontal" label="Shape">
              <Select
                value={buttonData?.shape || "rounded"}
                onChange={(_, { value }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      data: { shape: value || "rounded" },
                    });
                }}>
                <option value="rounded">Rounded</option>
                <option value="circular">Pill</option>
                <option value="square">Square</option>
              </Select>
            </Field>
            <Field orientation="horizontal" label="Size">
              <Select
                value={buttonData?.size || "medium"}
                onChange={(_, { value }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      data: { size: value || "medium" },
                    });
                }}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </Select>
            </Field>
            <Field orientation="horizontal" label="Full width">
              <Checkbox
                checked={buttonData?.full && buttonData?.full !== "true"}
                onChange={(_, { checked }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      data: {
                        full: checked || false,
                      },
                    });
                }}
              />
            </Field>
            <Field orientation="horizontal" label="Alignment">
              <Toolbar
                checkedValues={{
                  textAlign: [
                    elementMap[selectedId].styles.textAlign || "left",
                  ],
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
                </ToolbarRadioGroup>
              </Toolbar>
            </Field>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="icon">
          <AccordionHeader expandIconPosition="end" size="large">
            Icon
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Icon position">
              <Select
                value={buttonData?.iconPosition || "before"}
                onChange={(_, { value }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      data: { iconPosition: value || "before" },
                    });
                }}>
                <option value="before">Start</option>
                <option value="after">End</option>
              </Select>
            </Field>
            <Field orientation="horizontal" label="Icon">
              <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                <Input
                  style={{ width: "140px" }}
                  placeholder="Eg: ArrowClockwiseRegular"
                  onChange={(_, { value }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: { icon: (value || "").replace(/\W+/g, "") },
                      });
                  }}
                  value={elementMap[selectedId].data?.icon || ""}
                />
                <InfoLabel
                  info={
                    <>
                      Go to{" "}
                      <Link
                        href="https://react.fluentui.dev/?path=/docs/icons-catalog--docs"
                        target="_blank">
                        Fluent icons
                      </Link>{" "}
                      and enter the name of any icon
                    </>
                  }
                />
              </div>
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

export default ButtonProperties;
