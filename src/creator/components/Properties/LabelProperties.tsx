import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Field,
  Input,
  makeStyles,
  typographyStyles,
} from "@fluentui/react-components";
import React from "react";
import { useManifestStore } from "../../stores/useManifestStore";

interface LabelPropertiesProps {
  selectedId: string;
}

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

const LabelProperties: React.FC<LabelPropertiesProps> = ({ selectedId }) => {
  const styles = useStyles();
  const elementMap = useManifestStore((state) => state.elementMap);

  return (
    <AccordionItem value="info">
      <AccordionHeader expandIconPosition="end" size="large">
        Info
      </AccordionHeader>
      <AccordionPanel className={styles.panel}>
        <Field key={"label"} orientation="horizontal" label={"Label"}>
          <Input
            style={{ width: 170 }}
            value={elementMap[selectedId].label || `#${selectedId}`}
            onChange={(_, { value }) => {
              useManifestStore
                .getState()
                .updateElementProperties(selectedId, { label: value });
            }}
          />
        </Field>
      </AccordionPanel>
    </AccordionItem>
  );
};

export default LabelProperties;
