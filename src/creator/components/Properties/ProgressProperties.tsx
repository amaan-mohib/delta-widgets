import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import {
  IUpdateElementProperties,
  useManifestStore,
} from "../../stores/useManifestStore";
import Panel from "./Panel";
import { Select, SpinButton } from "@fluentui/react-components";
import { spinButtonOnChange } from "../../utils";
import TemplateEditor from "../TemplateEditor";

interface ProgressPropertiesProps {}

const ProgressProperties: React.FC<ProgressPropertiesProps> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  const updateProperties = (value: IUpdateElementProperties) => {
    if (!selectedId) return;
    useManifestStore.getState().updateElementProperties(selectedId, value);
  };

  if (!selectedId || !elementMap[selectedId]) return null;

  const progressData = elementMap[selectedId].data;

  return (
    <Panel
      title="Progress"
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Thickness",
              control: (
                <Select
                  defaultValue={progressData?.thickness || "medium"}
                  onChange={(_, { value }) => {
                    updateProperties({
                      data: { thickness: value },
                    });
                  }}>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Select>
              ),
            },
            {
              label: "Value",
              control: (
                <TemplateEditor
                  value={progressData?.value || "0"}
                  onChange={(value) => {
                    updateProperties({
                      data: { value: value || "0" },
                    });
                  }}
                  placeholder="Enter value"
                />
              ),
            },
            {
              label: "Maximum",
              control: (
                <TemplateEditor
                  value={progressData?.maxValue || "100"}
                  onChange={(value) => {
                    updateProperties({
                      data: { maxValue: value || "100" },
                    });
                  }}
                  placeholder="Enter maximum"
                />
              ),
            },
            {
              label: "Padding (px)",
              control: (
                <SpinButton
                  min={0}
                  value={parseInt(
                    String(elementMap[selectedId].styles?.padding ?? 5),
                    10
                  )}
                  onChange={(event, data) => {
                    spinButtonOnChange(
                      event,
                      data,
                      (value) => {
                        updateProperties({
                          styles: { padding: value },
                        });
                      },
                      5
                    );
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

export default ProgressProperties;
