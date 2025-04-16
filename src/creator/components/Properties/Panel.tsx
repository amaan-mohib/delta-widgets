import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Divider,
  Field,
  makeStyles,
  Text,
  typographyStyles,
} from "@fluentui/react-components";
import React, { ReactNode } from "react";
import GridItemProperties from "./GridItemProperties";

interface IPanelItemFields {
  label: string;
  control: ReactNode;
}

interface IPanelItem {
  label: string;
  value: string;
  fields: IPanelItemFields[];
}

interface PanelProps {
  title: string;
  items: IPanelItem[];
  selectedId?: string;
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

const Panel: React.FC<PanelProps> = ({ title, items, selectedId }) => {
  const styles = useStyles();

  return (
    <>
      <div className={styles.padding}>
        <Text className={styles.title}>{title}</Text>
      </div>
      <Divider appearance="subtle" style={{ flex: "none" }} />
      <Accordion
        style={{ overflow: "auto", flex: 1 }}
        collapsible
        multiple
        defaultOpenItems={items.map((item) => item.value)}>
        {items.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionHeader expandIconPosition="end" size="large">
              {item.label}
            </AccordionHeader>
            <AccordionPanel className={styles.panel}>
              {item.fields.map((field) => (
                <Field
                  key={field.label}
                  orientation="horizontal"
                  label={field.label}>
                  {field.control}
                </Field>
              ))}
            </AccordionPanel>
          </AccordionItem>
        ))}
        {selectedId && <GridItemProperties selectedId={selectedId} />}
      </Accordion>
    </>
  );
};

export default Panel;
