import {
  Button,
  Checkbox,
  Input,
  Select,
  SpinButton,
  Tooltip,
} from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { MathFormulaRegular } from "@fluentui/react-icons/fonts";
import { spinButtonOnChange } from "../../utils";
import Panel from "./Panel";

interface ImagePropertiesProps {}

const ImageProperties: React.FC<ImagePropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const imageData = useMemo(
    () => elementMap[selectedId].data,
    [elementMap[selectedId].data]
  );

  return (
    <Panel
      title="Image"
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Source",
              control: (
                <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                  <Input
                    style={{ width: "140px" }}
                    placeholder="Enter source"
                    onChange={(_, { value }) => {
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          data: { src: value || "" },
                        });
                    }}
                    value={elementMap[selectedId].data?.src || ""}
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
              ),
            },
            {
              label: "Fit",
              control: (
                <Select
                  value={imageData?.fit || "cover"}
                  onChange={(_, { value }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: { fit: value || "cover" },
                      });
                  }}>
                  <option value="default">Default</option>
                  <option value="center">Center</option>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="none">None</option>
                </Select>
              ),
            },
            {
              label: "Shape",
              control: (
                <Select
                  value={imageData?.shape || "square"}
                  onChange={(_, { value }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: { shape: value || "square" },
                      });
                  }}>
                  <option value="rounded">Rounded</option>
                  <option value="circular">Circular</option>
                  <option value="square">Square</option>
                </Select>
              ),
            },
            {
              label: "Shadow",
              control: (
                <Checkbox
                  checked={imageData?.shadow && imageData?.shadow !== "true"}
                  onChange={(_, { checked }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: {
                          shadow: checked || false,
                        },
                      });
                  }}
                />
              ),
            },
            {
              label: "Bordered",
              control: (
                <Checkbox
                  checked={
                    imageData?.bordered && imageData?.bordered !== "true"
                  }
                  onChange={(_, { checked }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: {
                          bordered: checked || false,
                        },
                      });
                  }}
                />
              ),
            },
          ],
        },
        {
          label: "Size",
          value: "size",
          fields: [
            {
              label: "Width (px)",
              control: (
                <SpinButton
                  min={0}
                  value={parseInt(
                    String(elementMap[selectedId].styles.width || 100),
                    10
                  )}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          styles: {
                            width: `${value}px`,
                          },
                        });
                    });
                  }}
                />
              ),
            },
            {
              label: "Height (px)",
              control: (
                <SpinButton
                  min={0}
                  value={parseInt(
                    String(elementMap[selectedId].styles.height || 0),
                    10
                  )}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          styles: {
                            height: `${value}px`,
                          },
                        });
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

export default ImageProperties;
