import { Button, SpinButton, Tooltip } from "@fluentui/react-components";
import { ArrowClockwiseRegular } from "@fluentui/react-icons";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { spinButtonOnChange } from "../../utils";
import { ColorPickerPopup } from "./ColorPickerPopup";
import Panel from "./Panel";

interface GridPropertiesProps {}

const GridProperties: React.FC<GridPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const gridStyles = useMemo(
    () => elementMap[selectedId].styles,
    [elementMap[selectedId].styles]
  );
  const gridSize = useMemo(
    () => elementMap[selectedId].styles.gridSize,
    [elementMap[selectedId].styles.gridSize]
  );

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
                  value={parseInt(String(gridStyles.gap || 0), 10)}
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
                        useManifestStore
                          .getState()
                          .updateElementProperties(selectedId, {
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
                          useManifestStore
                            .getState()
                            .updateElementProperties(selectedId, {
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
                        useManifestStore
                          .getState()
                          .updateElementProperties(selectedId, {
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
                          useManifestStore
                            .getState()
                            .updateElementProperties(selectedId, {
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
                        useManifestStore
                          .getState()
                          .updateElementProperties(selectedId, {
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
            {
              label: "Background",
              control: (
                <ColorPickerPopup
                  color={gridStyles.backgroundColor || "transparent"}
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
          ],
        },
      ]}
      selectedId={selectedId}
    />
  );
};

export default GridProperties;
