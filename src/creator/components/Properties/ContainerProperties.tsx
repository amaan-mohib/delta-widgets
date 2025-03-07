import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Divider,
  Field,
  makeStyles,
  Text,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  Tooltip,
  typographyStyles,
} from "@fluentui/react-components";
import {
  LayoutColumnTwoRegular,
  LayoutRowTwoRegular,
} from "@fluentui/react-icons";
import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { ColorPickerPopup } from "./ColorPickerPopup";

interface ContainerPropertiesProps {}

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

const ContainerProperties: React.FC<ContainerPropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Container</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion collapsible defaultOpenItems={["size"]}>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end">Flex</AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Direction">
              <Toolbar
                checkedValues={{
                  flexDirection: [
                    elementMap[selectedId].styles.flexDirection || "row",
                  ],
                }}
                onCheckedValueChange={(_, { name, checkedItems }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      styles: { [name]: checkedItems[0] },
                    });
                }}>
                <ToolbarRadioGroup>
                  <Tooltip content="Horizontal" relationship="label" withArrow>
                    <ToolbarRadioButton
                      appearance="subtle"
                      name="flexDirection"
                      value="row"
                      icon={<LayoutColumnTwoRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Vertical" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="flexDirection"
                      appearance="subtle"
                      value="column"
                      icon={<LayoutRowTwoRegular />}
                    />
                  </Tooltip>
                </ToolbarRadioGroup>
              </Toolbar>
            </Field>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <Accordion collapsible defaultOpenItems={["size"]}>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end">Background</AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Color">
              <ColorPickerPopup
                color={
                  elementMap[selectedId].styles.backgroundColor || "transparent"
                }
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
            </Field>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ContainerProperties;
