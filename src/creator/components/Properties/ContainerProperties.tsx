import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Divider,
  Field,
  makeStyles,
  SpinButton,
  Text,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  Tooltip,
  typographyStyles,
} from "@fluentui/react-components";
import {
  AlignCenterHorizontalRegular,
  AlignCenterVerticalRegular,
  AlignEndHorizontalRegular,
  AlignEndVerticalRegular,
  AlignSpaceAroundHorizontalRegular,
  AlignSpaceAroundVerticalRegular,
  AlignSpaceBetweenHorizontalRegular,
  AlignSpaceBetweenVerticalRegular,
  AlignStartHorizontalRegular,
  AlignStartVerticalRegular,
  CenterHorizontalRegular,
  CenterVerticalRegular,
  LayoutColumnTwoRegular,
  LayoutRowTwoRegular,
} from "@fluentui/react-icons";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { ColorPickerPopup } from "./ColorPickerPopup";
import { spinButtonOnChange } from "../../utils";
import GridItemProperties from "./GridItemProperties";

interface ContainerPropertiesProps {}

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

const ContainerProperties: React.FC<ContainerPropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const isRow = useMemo(
    () => elementMap[selectedId].styles.flexDirection === "row",
    [elementMap, selectedId]
  );

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Container</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion
        collapsible
        multiple
        defaultOpenItems={["size", "flex", "background"]}>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end" size="large">
            Properties
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Padding (px)">
              <SpinButton
                min={0}
                value={parseInt(
                  String(elementMap[selectedId].styles.padding || 0),
                  10
                )}
                onChange={(event, data) => {
                  spinButtonOnChange(event, data, (value) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        styles: {
                          padding: `${value}px`,
                        },
                      });
                  });
                }}
              />
            </Field>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="flex">
          <AccordionHeader expandIconPosition="end" size="large">
            Flex
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Direction">
              <Toolbar
                checkedValues={{
                  flexDirection: [
                    elementMap[selectedId].styles.flexDirection || "row",
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
                  <Tooltip content="Horizontal" relationship="label" withArrow>
                    <ToolbarRadioButton
                      appearance="subtle"
                      name="flexDirection"
                      value="row"
                      icon={<LayoutColumnTwoRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Vertical" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="flexDirection"
                      appearance="subtle"
                      value="column"
                      icon={<LayoutRowTwoRegular />}
                    />
                  </Tooltip>
                </ToolbarRadioGroup>
              </Toolbar>
            </Field>
            <Field orientation="horizontal" label="Align">
              <Toolbar
                checkedValues={{
                  alignItems: [
                    elementMap[selectedId].styles.alignItems || "flex-start",
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
                  <Tooltip content="Start" relationship="label" withArrow>
                    <ToolbarRadioButton
                      appearance="subtle"
                      name="alignItems"
                      value="flex-start"
                      icon={
                        isRow ? (
                          <AlignStartHorizontalRegular />
                        ) : (
                          <AlignStartVerticalRegular />
                        )
                      }
                    />
                  </Tooltip>
                  <Tooltip content="Center" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="alignItems"
                      appearance="subtle"
                      value="center"
                      icon={
                        isRow ? (
                          <AlignCenterHorizontalRegular />
                        ) : (
                          <AlignCenterVerticalRegular />
                        )
                      }
                    />
                  </Tooltip>
                  <Tooltip content="End" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="alignItems"
                      appearance="subtle"
                      value="flex-end"
                      icon={
                        isRow ? (
                          <AlignEndHorizontalRegular />
                        ) : (
                          <AlignEndVerticalRegular />
                        )
                      }
                    />
                  </Tooltip>
                </ToolbarRadioGroup>
              </Toolbar>
            </Field>
            <Field orientation="horizontal" label="Justify">
              <Toolbar
                checkedValues={{
                  justifyContent: [
                    elementMap[selectedId].styles.justifyContent ||
                      "flex-start",
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
                  <Tooltip content="Start" relationship="label" withArrow>
                    <ToolbarRadioButton
                      appearance="subtle"
                      name="justifyContent"
                      value="flex-start"
                      icon={
                        isRow ? (
                          <AlignStartHorizontalRegular />
                        ) : (
                          <AlignStartVerticalRegular />
                        )
                      }
                    />
                  </Tooltip>
                  <Tooltip content="Center" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="justifyContent"
                      appearance="subtle"
                      value="center"
                      icon={
                        isRow ? (
                          <CenterHorizontalRegular />
                        ) : (
                          <CenterVerticalRegular />
                        )
                      }
                    />
                  </Tooltip>
                  <Tooltip content="End" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="justifyContent"
                      appearance="subtle"
                      value="flex-end"
                      icon={
                        isRow ? (
                          <AlignEndHorizontalRegular />
                        ) : (
                          <AlignEndVerticalRegular />
                        )
                      }
                    />
                  </Tooltip>
                  <Tooltip
                    content="Space around"
                    relationship="label"
                    withArrow>
                    <ToolbarRadioButton
                      name="justifyContent"
                      appearance="subtle"
                      value="space-around"
                      icon={
                        isRow ? (
                          <AlignSpaceAroundVerticalRegular />
                        ) : (
                          <AlignSpaceAroundHorizontalRegular />
                        )
                      }
                    />
                  </Tooltip>
                  <Tooltip
                    content="Space between"
                    relationship="label"
                    withArrow>
                    <ToolbarRadioButton
                      name="justifyContent"
                      appearance="subtle"
                      value="space-between"
                      icon={
                        isRow ? (
                          <AlignSpaceBetweenVerticalRegular />
                        ) : (
                          <AlignSpaceBetweenHorizontalRegular />
                        )
                      }
                    />
                  </Tooltip>
                </ToolbarRadioGroup>
              </Toolbar>
            </Field>
            <Field orientation="horizontal" label="Gap (px)">
              <SpinButton
                min={0}
                value={parseInt(
                  String(elementMap[selectedId].styles.gap || 0),
                  10
                )}
                onChange={(event, data) => {
                  spinButtonOnChange(event, data, (value) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        styles: {
                          gap: `${value}px`,
                        },
                      });
                  });
                }}
              />
            </Field>
            <Field orientation="horizontal" label="Width (%)">
              <SpinButton
                step={10}
                min={1}
                max={100}
                value={
                  parseFloat(String(elementMap[selectedId].styles.flex || 1)) *
                  100
                }
                onChange={(event, data) => {
                  spinButtonOnChange(
                    event,
                    data,
                    (value) => {
                      if (value === 0) {
                        value = 1;
                      }
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          styles: {
                            flex: value / 100,
                          },
                        });
                    },
                    16
                  );
                }}
              />
            </Field>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="background">
          <AccordionHeader expandIconPosition="end" size="large">
            Background
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Color">
              <ColorPickerPopup
                color={
                  elementMap[selectedId].styles.backgroundColor || "transparent"
                }
                setColor={(color) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      styles: {
                        backgroundColor: color,
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

export default ContainerProperties;
