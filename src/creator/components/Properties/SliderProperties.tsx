import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Divider,
  Field,
  Input,
  makeStyles,
  Select,
  Text,
  Tooltip,
  typographyStyles,
} from "@fluentui/react-components";
import React, { useMemo } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { MathFormulaRegular } from "@fluentui/react-icons/fonts";
import GridItemProperties from "./GridItemProperties";

interface SliderPropertiesProps {}

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

const SliderProperties: React.FC<SliderPropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  const sliderData = useMemo(
    () => elementMap[selectedId].data,
    [elementMap[selectedId].data]
  );

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Slider</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion collapsible multiple defaultOpenItems={["size"]}>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end" size="large">
            Properties
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Minimum">
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
            </Field>
            <Field orientation="horizontal" label="Maximum">
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
            </Field>
            <Field orientation="horizontal" label="Current">
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
            </Field>
            <Field orientation="horizontal" label="Size">
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

export default SliderProperties;
