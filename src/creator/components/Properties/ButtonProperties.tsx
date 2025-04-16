import {
  // Checkbox,
  InfoLabel,
  Input,
  Link,
  Select,
  // Toolbar,
  // ToolbarRadioButton,
  // ToolbarRadioGroup,
  // Tooltip,
} from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
// import {
//   TextAlignCenterRegular,
//   TextAlignLeftRegular,
//   TextAlignRightRegular,
// } from "@fluentui/react-icons";
import Panel from "./Panel";
import TemplateEditor from "../TemplateEditor";

interface ButtonPropertiesProps {
  disableDynamic?: boolean;
}

const ButtonProperties: React.FC<ButtonPropertiesProps> = ({
  disableDynamic,
}) => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const buttonData = useMemo(
    () => elementMap[selectedId].data,
    [elementMap[selectedId].data]
  );

  return (
    <Panel
      title="Button"
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Text",
              control: (
                <TemplateEditor
                  disabled={disableDynamic}
                  value={elementMap[selectedId].data?.text}
                  onChange={(value) => {
                    useManifestStore
                      .getState()
                      .updateElementProperties(selectedId, {
                        data: { text: value || "" },
                      });
                  }}
                />
              ),
            },
            {
              label: "Type",
              control: (
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
              ),
            },
            {
              label: "Shape",
              control: (
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
              ),
            },
            {
              label: "Size",
              control: (
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
              ),
            },
            // {
            //   label: "Full width",
            //   control: (
            //     <Checkbox
            //       checked={buttonData?.full && buttonData?.full !== "true"}
            //       onChange={(_, { checked }) => {
            //         useManifestStore
            //           .getState()
            //           .updateElementProperties(selectedId, {
            //             data: {
            //               full: checked || false,
            //             },
            //           });
            //       }}
            //     />
            //   ),
            // },
            // {
            //   label: "Alignment",
            //   control: (
            //     <Toolbar
            //       checkedValues={{
            //         textAlign: [
            //           elementMap[selectedId].styles.textAlign || "left",
            //         ],
            //       }}
            //       onCheckedValueChange={(_, { name, checkedItems }) => {
            //         useManifestStore
            //           .getState()
            //           .updateElementProperties(selectedId, {
            //             styles: { [name]: checkedItems[0] },
            //           });
            //       }}>
            //       <ToolbarRadioGroup>
            //         <Tooltip content="Left" relationship="label" withArrow>
            //           <ToolbarRadioButton
            //             appearance="subtle"
            //             name="textAlign"
            //             value="left"
            //             icon={<TextAlignLeftRegular />}
            //           />
            //         </Tooltip>
            //         <Tooltip content="Center" relationship="label" withArrow>
            //           <ToolbarRadioButton
            //             name="textAlign"
            //             appearance="subtle"
            //             value="center"
            //             icon={<TextAlignCenterRegular />}
            //           />
            //         </Tooltip>
            //         <Tooltip content="Right" relationship="label" withArrow>
            //           <ToolbarRadioButton
            //             name="textAlign"
            //             appearance="subtle"
            //             value="right"
            //             icon={<TextAlignRightRegular />}
            //           />
            //         </Tooltip>
            //       </ToolbarRadioGroup>
            //     </Toolbar>
            //   ),
            // },
          ],
        },
        {
          label: "Icon",
          value: "icon",
          fields: [
            {
              label: "Icon position",
              control: (
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
              ),
            },
            {
              label: "Icon",
              control: (
                <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
                  <Input
                    disabled={disableDynamic}
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
              ),
            },
          ],
        },
      ]}
      selectedId={selectedId}
    />
  );
};

export default ButtonProperties;
