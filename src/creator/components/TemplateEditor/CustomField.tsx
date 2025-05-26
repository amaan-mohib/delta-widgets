import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Card,
  Field,
  Input,
  Textarea,
} from "@fluentui/react-components";
import React from "react";
import { useManifestStore } from "../../stores/useManifestStore";

interface CustomFieldProps {}

const CustomField: React.FC<CustomFieldProps> = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = () => {
    const formData = new FormData(formRef.current!);
    const elements = formRef.current?.elements;
    [...formData.keys()].forEach((key) => {
      const input = elements?.namedItem(key);
      if (input && "value" in input) {
        input.value = "";
      }
    });
    const name = formData.get("name") as string;
    const key = name.trim().toLowerCase().replace(/\s+/g, "-");
    const value = formData.get("value") as string;
    const description = formData.get("description") as string;
    useManifestStore.getState().updateCustomValues({
      [key]: { key, label: name.trim(), value: value.trim(), description },
    });
  };

  return (
    <Card
      appearance="filled-alternative"
      size="small"
      style={{ padding: 0, marginBottom: "1rem" }}>
      <Accordion collapsible defaultOpenItems={["custom-field"]}>
        <AccordionItem value={"custom-field"}>
          <AccordionHeader expandIconPosition="end">
            Add custom field
          </AccordionHeader>
          <AccordionPanel>
            <form
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                paddingBottom: "1rem",
              }}
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}>
              <Field
                label="Name"
                size="small"
                required
                defaultValue={"New Field"}>
                <Input name="name" placeholder="Enter name" />
              </Field>
              <Field label="Value" size="small" required>
                <Input name="value" placeholder="Enter a value" />
              </Field>
              <Field label="Description" size="small">
                <Textarea name="description" placeholder="Enter description" />
              </Field>
              <Button
                appearance="primary"
                type="submit"
                size="small"
                style={{ width: "fit-content" }}>
                Add
              </Button>
            </form>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default CustomField;
