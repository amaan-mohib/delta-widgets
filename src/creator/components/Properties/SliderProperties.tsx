import { Button, Input, Select, Tooltip } from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { MathFormulaRegular } from "@fluentui/react-icons/fonts";
import Panel from "./Panel";

interface SliderPropertiesProps {}

const SliderProperties: React.FC<SliderPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const sliderData = useMemo(
    () => elementMap[selectedId].data,
    [elementMap[selectedId].data]
  );

  return (
    <Panel
      title="Slider"
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Minimum",
              control: (
                <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                  <Input
                    style={{ width: "140px" }}
                    placeholder="Enter minimum"
                    onChange={(_, { value }) => {
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          data: { min: value || "0" },
                        });
                    }}
                    value={sliderData?.min || "0"}
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
              label: "Maximum",
              control: (
                <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                  <Input
                    style={{ width: "140px" }}
                    placeholder="Enter maximum"
                    onChange={(_, { value }) => {
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          data: { max: value || "100" },
                        });
                    }}
                    value={sliderData?.max || "100"}
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
              label: "Current",
              control: (
                <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                  <Input
                    style={{ width: "140px" }}
                    placeholder="Enter current"
                    onChange={(_, { value }) => {
                      useManifestStore
                        .getState()
                        .updateElementProperties(selectedId, {
                          data: { current: value || "0" },
                        });
                    }}
                    value={sliderData?.current || "0"}
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
              label: "Size",
              control: (
                <Select
                  value={sliderData?.size || "medium"}
                  onChange={(_, { value }) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: { size: value || "medium" },
                      });
                  }}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                </Select>
              ),
            },
          ],
        },
      ]}
      selectedId={selectedId}
    />
  );
};

export default SliderProperties;
