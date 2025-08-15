import { SpinButton } from "@fluentui/react-components";
import React from "react";
import { useManifestStore } from "../../stores/useManifestStore";
import { spinButtonOnChange } from "../../utils";
import Panel from "./Panel";

interface WindowPropertiesProps {}

const WindowProperties: React.FC<WindowPropertiesProps> = () => {
  const dimensions = useManifestStore(
    (state) => state.manifest?.dimensions
  ) || { width: 400, height: 300 };

  return (
    <Panel
      title="Window"
      items={[
        {
          label: "Size",
          value: "size",
          fields: [
            {
              label: "Width (px)",
              control: (
                <SpinButton
                  value={dimensions.width}
                  onChange={(event, data) => {
                    spinButtonOnChange(
                      event,
                      data,
                      (value) => {
                        useManifestStore
                          .getState()
                          .updateWidgetDimensions(value, dimensions.height);
                      },
                      400
                    );
                  }}
                />
              ),
            },
            {
              label: "Height (px)",
              control: (
                <SpinButton
                  value={dimensions.height}
                  onChange={(event, data) => {
                    spinButtonOnChange(
                      event,
                      data,
                      (value) => {
                        useManifestStore
                          .getState()
                          .updateWidgetDimensions(dimensions.width, value);
                      },
                      400
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

export default WindowProperties;
