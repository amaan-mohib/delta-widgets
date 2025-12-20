import { InfoLabel, Input, Link, Select } from "@fluentui/react-components";
import ImagePicker from "./ImagePicker";
import NewColorPicker from "./NewColorPicker";
import {
  IUpdateElementProperties,
  IWidgetElementValue,
} from "../../stores/useManifestStore";

interface IProps {
  elementMap: Record<string, IWidgetElementValue>;
  selectedId: string | null;
  updateProperties: (value: IUpdateElementProperties) => void;
}

export const useBackgroundProperties = ({
  elementMap,
  selectedId,
  updateProperties,
}: IProps) => {
  if (!selectedId || !elementMap[selectedId]) return null;

  const props = {
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
      {
        label: "Backdrop filter",
        control: (
          <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
            <Input
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
              style={{ width: "140px" }}
              placeholder={"Enter a filter"}
              onChange={(_, { value }) => {
                updateProperties({
                  styles: {
                    backdropFilter: value,
                  },
                });
              }}
              value={elementMap[selectedId].styles.backdropFilter || ""}
            />
            <InfoLabel
              info={
                <>
                  Visit{" "}
                  <Link
                    href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter"
                    target="_blank">
                    here
                  </Link>{" "}
                  to learn more
                </>
              }
            />
          </div>
        ),
      },
    ],
  };
  return props;
};
