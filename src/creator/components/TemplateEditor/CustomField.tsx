import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Card,
  Field,
  Input,
  InputOnChangeData,
  Textarea,
  TextareaOnChangeData,
} from "@fluentui/react-components";
import React, { useState } from "react";
import { useManifestStore } from "../../stores/useManifestStore";

interface CustomFieldProps {}

const defaultValues = {
  name: "",
  value: "",
  description: "",
};

const CustomField: React.FC<CustomFieldProps> = () => {
  const [values, setValues] = useState(defaultValues);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    { value }: InputOnChangeData | TextareaOnChangeData
  ) => {
    setValues((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const onSubmit = () => {
    const { name, description, value } = values;
    if (!name.trim() || !value.trim()) {
      return;
    }
    const key = name.trim().toLowerCase().replace(/\s+/g, "-");
    useManifestStore.getState().updateCustomValues({
      [key]: { key, label: name.trim(), value: value.trim(), description },
    });
    setValues(defaultValues);
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
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}>
              <Field label="Name" size="small" required>
                <Input
                  value={values.name}
                  onChange={onChange}
                  name="name"
                  placeholder="Enter name"
                />
              </Field>
              <Field label="Value" size="small" required>
                <Input
                  value={values.value}
                  onChange={onChange}
                  name="value"
                  placeholder="Enter a value"
                />
              </Field>
              <Field label="Description" size="small">
                <Textarea
                  value={values.description}
                  onChange={onChange}
                  name="description"
                  placeholder="Enter description"
                />
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
