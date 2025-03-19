import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Checkbox,
  Divider,
  Field,
  Input,
  makeStyles,
  Select,
  SpinButton,
  Text,
  Tooltip,
  typographyStyles,
} from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { MathFormulaRegular } from "@fluentui/react-icons/fonts";
import GridItemProperties from "./GridItemProperties";
import { spinButtonOnChange } from "../../utils";

interface ImagePropertiesProps {}

const useStyles = makeStyles({
  padding: {
    padding: "10px 12px",
  },
  title: typographyStyles.subtitle2,
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
});

const ImageProperties: React.FC<ImagePropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const imageData = useMemo(
    () => elementMap[selectedId].data,
    [elementMap[selectedId].data]
  );

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Image</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion collapsible multiple defaultOpenItems={["size", "properties"]}>
        <AccordionItem value="properties">
          <AccordionHeader expandIconPosition="end" size="large">
            Properties
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Source">
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
            </Field>
            <Field orientation="horizontal" label="Fit">
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
            </Field>
            <Field orientation="horizontal" label="Shape">
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
            </Field>
            <Field orientation="horizontal" label="Shadow">
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
            </Field>
            <Field orientation="horizontal" label="Bordered">
              <Checkbox
                checked={imageData?.bordered && imageData?.bordered !== "true"}
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
            </Field>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end" size="large">
            Size
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Width (px)">
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
            </Field>
            <Field orientation="horizontal" label="Height (px)">
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
            </Field>
          </AccordionPanel>
        </AccordionItem>
        <GridItemProperties
          selectedId={selectedId}
          gridItemStyles={elementMap[selectedId].styles.gridItem}
        />
      </Accordion>
    </div>
  );
};

export default ImageProperties;
