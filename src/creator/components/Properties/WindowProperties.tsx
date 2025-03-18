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
import { spinButtonOnChange } from "../../utils";

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
          <AccordionHeader expandIconPosition="end" size="large">
            Size
          </AccordionHeader>
          <AccordionPanel className={styles.panel}>
            <Field orientation="horizontal" label="Width (px)">
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
            </Field>
            <Field orientation="horizontal" label="Height (px)">
              <SpinButton
                value={dimensions.height}
                onChange={(event, data) => {
                  spinButtonOnChange(
                    event,
                    data,
                    (value) => {
                      useManifestStore
                        .getState()
                        .updateWidgetDimensions(value, dimensions.width);
                    },
                    400
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
