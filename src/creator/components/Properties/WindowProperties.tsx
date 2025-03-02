import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Divider,
  Field,
  makeStyles,
  SpinButton,
  Text,
  typographyStyles,
} from "@fluentui/react-components";
import React from "react";
import { useManifestStore } from "../../stores/useManifestStore";

interface WindowPropertiesProps {}

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

const WindowProperties: React.FC<WindowPropertiesProps> = () => {
  const styles = useStyles();
  const dimensions = useManifestStore(
    (state) => state.manifest?.dimensions
  ) || { width: 400, height: 300 };

  return (
    <div>
      <div className={styles.padding}>
        <Text className={styles.title}>Window</Text>
      </div>
      <Divider appearance="subtle" />
      <Accordion collapsible defaultOpenItems={["size"]}>
        <AccordionItem value="size">
          <AccordionHeader expandIconPosition="end">Size</AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Width (px)">
              <SpinButton
                value={dimensions.width}
                onChange={(event, { value }) => {
                  useManifestStore
                    .getState()
                    .updateWidgetDimensions(
                      Number(
                        value || (event.target as HTMLInputElement).value || 400
                      ),
                      dimensions.height
                    );
                }}
              />
            </Field>
            <Field orientation="horizontal" label="Height (px)">
              <SpinButton
                value={dimensions.height}
                onChange={(event, { value }) => {
                  useManifestStore
                    .getState()
                    .updateWidgetDimensions(
                      dimensions.width,
                      Number(
                        value || (event.target as HTMLInputElement).value || 400
                      )
                    );
                }}
              />
            </Field>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default WindowProperties;
