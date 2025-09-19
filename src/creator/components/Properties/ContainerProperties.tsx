import {
  Select,
  SpinButton,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  Tooltip,
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
import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import {
  IUpdateElementProperties,
  useManifestStore,
} from "../../stores/useManifestStore";
import { spinButtonOnChange } from "../../utils";
import Panel from "./Panel";
import NewColorPicker from "./NewColorPicker";
import ImagePicker from "./ImagePicker";

interface ContainerPropertiesProps {}

const ContainerProperties: React.FC<ContainerPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  const updateProperties = (value: IUpdateElementProperties) => {
    if (!selectedId) return;
    useManifestStore.getState().updateElementProperties(selectedId, value);
  };

  if (!selectedId || !elementMap[selectedId]) return null;

  const isRow = elementMap[selectedId].styles.flexDirection || "row" === "row";

  return (
    <Panel
      title="Container"
      selectedId={selectedId}
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Padding (px)",
              control: (
                <SpinButton
                  min={0}
                  value={parseInt(
                    String(elementMap[selectedId].styles.padding || 0),
                    10
                  )}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      updateProperties({
                        styles: {
                          padding: `${value}px`,
                        },
                      });
                    });
                  }}
                />
              ),
            },
            {
              label: "Roundness (px)",
              control: (
                <SpinButton
                  min={0}
                  value={parseInt(
                    String(elementMap[selectedId].styles.borderRadius || 2),
                    10
                  )}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      updateProperties({
                        styles: {
                          borderRadius: `${value}px`,
                        },
                      });
                    });
                  }}
                />
              ),
            },
          ],
        },
        {
          label: "Flex",
          value: "flex",
          fields: [
            {
              label: "Direction",
              control: (
                <Toolbar
                  checkedValues={{
                    flexDirection: [
                      elementMap[selectedId].styles.flexDirection || "row",
                    ],
                  }}
                  onCheckedValueChange={(_, { name, checkedItems }) => {
                    updateProperties({
                      styles: { [name]: checkedItems[0] },
                    });
                  }}>
                  <ToolbarRadioGroup>
                    <Tooltip
                      content="Horizontal"
                      relationship="label"
                      withArrow>
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
              ),
            },
            {
              label: "Align",
              control: (
                <Toolbar
                  checkedValues={{
                    alignItems: [
                      elementMap[selectedId].styles.alignItems || "flex-start",
                    ],
                  }}
                  onCheckedValueChange={(_, { name, checkedItems }) => {
                    updateProperties({
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
                            <AlignStartVerticalRegular />
                          ) : (
                            <AlignStartHorizontalRegular />
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
                            <AlignEndVerticalRegular />
                          ) : (
                            <AlignEndHorizontalRegular />
                          )
                        }
                      />
                    </Tooltip>
                  </ToolbarRadioGroup>
                </Toolbar>
              ),
            },
            {
              label: "Justify",
              control: (
                <Toolbar
                  checkedValues={{
                    justifyContent: [
                      elementMap[selectedId].styles.justifyContent ||
                        "flex-start",
                    ],
                  }}
                  onCheckedValueChange={(_, { name, checkedItems }) => {
                    updateProperties({
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
              ),
            },
            {
              label: "Gap (px)",
              control: (
                <SpinButton
                  min={0}
                  value={parseInt(
                    String(elementMap[selectedId].styles.gap || 0),
                    10
                  )}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      updateProperties({
                        styles: {
                          gap: `${value}px`,
                        },
                      });
                    });
                  }}
                />
              ),
            },
            {
              label: "Flex (%)",
              control: (
                <SpinButton
                  step={10}
                  min={1}
                  max={100}
                  value={
                    parseFloat(
                      String(elementMap[selectedId].styles.flex || 1)
                    ) * 100
                  }
                  onChange={(event, data) => {
                    spinButtonOnChange(
                      event,
                      data,
                      (value) => {
                        if (value === 0) value = 1;
                        updateProperties({
                          styles: {
                            flex: value / 100,
                          },
                        });
                      },
                      16
                    );
                  }}
                />
              ),
            },
          ],
        },
        {
          label: "Background",
          value: "background",
          fields: [
            {
              label: "Color",
              control: (
                <NewColorPicker
                  color={elementMap[selectedId].styles}
                  setColor={(color) => {
                    updateProperties({
                      styles: color,
                    });
                  }}
                />
              ),
            },
            {
              label: "Image",
              control: (
                <ImagePicker
                  imageData={elementMap[selectedId].data?.imageData || null}
                  setImage={(data) => {
                    updateProperties({
                      data: { imageData: data },
                    });
                  }}
                />
              ),
            },
            {
              label: "Size",
              control: elementMap[selectedId].data?.imageData ? (
                <Select
                  value={elementMap[selectedId].styles.backgroundSize || "auto"}
                  onChange={(_, { value }) => {
                    updateProperties({
                      styles: { backgroundSize: value || "auto" },
                    });
                  }}>
                  <option value="auto">Auto</option>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </Select>
              ) : null,
            },
          ],
        },
      ]}
    />
  );
};

export default ContainerProperties;
