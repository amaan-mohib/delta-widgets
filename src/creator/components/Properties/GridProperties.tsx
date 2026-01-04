import { Button, SpinButton, Tooltip } from "@fluentui/react-components";
import { ArrowClockwiseRegular } from "@fluentui/react-icons";
import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import {
  IUpdateElementProperties,
  useManifestStore,
} from "../../stores/useManifestStore";
import { spinButtonOnChange } from "../../utils";
import Panel from "./Panel";
import { useBackgroundProperties } from "./BackgroundProperties";

interface GridPropertiesProps {}

const GridProperties: React.FC<GridPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  const updateProperties = (value: IUpdateElementProperties) => {
    if (!selectedId) return;
    useManifestStore.getState().updateElementProperties(selectedId, value);
  };

  const backgroundProperties = useBackgroundProperties({
    elementMap,
    selectedId,
    updateProperties,
  });

  if (!selectedId || !elementMap[selectedId]) return null;

  const gridStyles = elementMap[selectedId].styles;
  const gridSize = elementMap[selectedId].styles.gridSize;

  return (
    <Panel
      title="Grid"
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Padding (px)",
              control: (
                <SpinButton
                  value={parseInt(String(gridStyles.padding || 0), 10)}
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
            {
              label: "Gap (px)",
              control: (
                <SpinButton
                  value={parseInt(String(gridStyles.gap || 0), 10)}
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
              label: "Width (%)",
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
                        updateProperties({
                          styles: {
                            flex: value / 100,
                          },
                        });
                      },
                      1
                    );
                  }}
                />
              ),
            },
            {
              label: "Rows",
              control: (
                <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                  <SpinButton
                    style={{ width: "140px" }}
                    value={parseInt(String(gridSize?.rows || 0), 10) || 0}
                    displayValue={String(gridSize?.rows || "auto")}
                    min={1}
                    onChange={(event, data) => {
                      spinButtonOnChange(
                        event,
                        data,
                        (value) => {
                          updateProperties({
                            styles: {
                              gridSize: {
                                ...(gridSize || {}),
                                rows: value,
                              },
                            },
                          });
                        },
                        16
                      );
                    }}
                  />
                  <Tooltip
                    content="Reset"
                    relationship="label"
                    positioning={"above-end"}
                    withArrow>
                    <Button
                      disabled={
                        gridSize?.rows === "auto" ||
                        gridSize?.rows === undefined
                      }
                      size="small"
                      appearance="outline"
                      icon={<ArrowClockwiseRegular />}
                      onClick={() => {
                        updateProperties({
                          styles: {
                            gridSize: {
                              ...(gridSize || {}),
                              rows: "auto",
                            },
                          },
                        });
                      }}
                    />
                  </Tooltip>
                </div>
              ),
            },
            {
              label: "Columns",
              control: (
                <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                  <SpinButton
                    style={{ width: "140px" }}
                    value={parseInt(String(gridSize?.columns || 0), 10) || 0}
                    displayValue={String(gridSize?.columns || "auto")}
                    min={1}
                    onChange={(event, data) => {
                      spinButtonOnChange(
                        event,
                        data,
                        (value) => {
                          updateProperties({
                            styles: {
                              gridSize: {
                                ...(gridSize || {}),
                                columns: value,
                              },
                            },
                          });
                        },
                        16
                      );
                    }}
                  />
                  <Tooltip
                    content="Reset"
                    relationship="label"
                    positioning={"above-end"}
                    withArrow>
                    <Button
                      disabled={
                        gridSize?.columns === "auto" ||
                        gridSize?.columns === undefined
                      }
                      size="small"
                      appearance="outline"
                      icon={<ArrowClockwiseRegular />}
                      onClick={() => {
                        updateProperties({
                          styles: {
                            gridSize: {
                              ...(gridSize || {}),
                              columns: "auto",
                            },
                          },
                        });
                      }}
                    />
                  </Tooltip>
                </div>
              ),
            },
          ],
        },
        backgroundProperties!,
      ]}
      selectedId={selectedId}
    />
  );
};

export default GridProperties;
