import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import Panel from "./Panel";
import { ColorPickerPopup } from "./ColorPickerPopup";
import { Select, SpinButton, tokens } from "@fluentui/react-components";
import { spinButtonOnChange } from "../../utils";

interface DiskPropertiesProps {}

const DiskProperties: React.FC<DiskPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const containerData = elementMap[selectedId]?.styles;

  return (
    <Panel
      title="Disk"
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
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          styles: {
                            borderRadius: `${value}px`,
                          },
                        });
                    });
                  }}
                />
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
              ),
            },
            {
              label: "Fit",
              control: (
                <Select
                  value={containerData?.flexDirection || "column"}
                  onChange={(_, { value }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        styles: { flexDirection: value as any },
                      });
                  }}>
                  <option value="column">Vertical</option>
                  <option value="row">Horizontal</option>
                </Select>
              ),
            },
          ],
        },
        {
          label: "Color",
          value: "color",
          fields: [
            {
              label: "Background",
              control: (
                <ColorPickerPopup
                  color={
                    elementMap[selectedId].styles.backgroundColor ||
                    "transparent"
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
              ),
            },
            {
              label: "Text",
              control: (
                <ColorPickerPopup
                  color={
                    elementMap[selectedId].styles.color ||
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
              ),
            },
          ],
        },
      ]}
    />
  );
};

export default DiskProperties;
