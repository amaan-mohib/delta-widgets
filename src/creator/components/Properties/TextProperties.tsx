import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Divider,
  Field,
  Input,
  makeStyles,
  Text,
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  Tooltip,
  typographyStyles,
} from "@fluentui/react-components";
import {
  TextAlignCenterRegular,
  TextAlignJustifyRegular,
  TextAlignLeftRegular,
  TextAlignRightRegular,
} from "@fluentui/react-icons";
import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";

interface TextPropertiesProps {}

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

const TextProperties: React.FC<TextPropertiesProps> = () => {
  const styles = useStyles();
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  if (!selectedId || !elementMap[selectedId]) return null;

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Text</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion collapsible defaultOpenItems={["size"]}>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end">Properties</AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Text">
              <Input
                style={{ width: "170px" }}
                placeholder="Enter text"
                onChange={(_, { value }) => {
                  useManifestStore
                    .getState()
                    .updateElementProperties(selectedId, {
                      data: { text: value || "" },
                    });
                }}
                value={elementMap[selectedId].data?.text || ""}
              />
            </Field>
            <Field orientation="horizontal" label="Alignment">
              <Toolbar
                checkedValues={{
                  textAlign: [
                    elementMap[selectedId].styles.textAlign || "left",
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
                  <Tooltip content="Left" relationship="label" withArrow>
                    <ToolbarRadioButton
                      appearance="subtle"
                      name="textAlign"
                      value="left"
                      icon={<TextAlignLeftRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Center" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="textAlign"
                      appearance="subtle"
                      value="center"
                      icon={<TextAlignCenterRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Right" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="textAlign"
                      appearance="subtle"
                      value="right"
                      icon={<TextAlignRightRegular />}
                    />
                  </Tooltip>
                  <Tooltip content="Justify" relationship="label" withArrow>
                    <ToolbarRadioButton
                      name="textAlign"
                      appearance="subtle"
                      value="justify"
                      icon={<TextAlignJustifyRegular />}
                    />
                  </Tooltip>
                </ToolbarRadioGroup>
              </Toolbar>
            </Field>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TextProperties;
