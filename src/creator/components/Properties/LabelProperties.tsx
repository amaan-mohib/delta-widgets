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
    padding: "10px 0",
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
        <Field key={"id"} orientation="horizontal" label={"ID"} size="small">
          <Input value={selectedId} disabled readOnly />
        </Field>
        <Field
          key={"label"}
          orientation="horizontal"
          label={"Label"}
          size="small">
          <Input
            value={elementMap[selectedId].label || `#${selectedId}`}
            onChange={(_, { value }) => {
              useManifestStore
                .getState()
                .updateElementProperties(selectedId, { label: value });
            }}
          />
        </Field>
        <Field
          key={"className"}
          orientation="horizontal"
          label={"CSS Class"}
          size="small">
          <Input
            placeholder="Enter classname"
            value={elementMap[selectedId].data?.className || ""}
            onChange={(_, { value }) => {
              useManifestStore.getState().updateElementProperties(selectedId, {
                data: { className: value },
              });
            }}
          />
        </Field>
      </AccordionPanel>
    </AccordionItem>
  );
};

export default LabelProperties;
