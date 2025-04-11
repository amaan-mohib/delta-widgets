import {
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  InfoLabel,
  Input,
  Textarea,
  Tooltip,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import { ChevronRightRegular, MathFormulaRegular } from "@fluentui/react-icons";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./index.css";

const templateCategories = [
  {
    id: "date",
    name: "Date & Time",
    // icon: Calendar,
    templates: [
      {
        id: "date",
        label: "Date",
        value: "{{date}}",
        description: "Current date (MM/DD/YYYY)",
      },
      {
        id: "date-short",
        label: "Short Date",
        value: "{{date:MM/DD}}",
        description: "Short date format (MM/DD)",
      },
      {
        id: "date-long",
        label: "Long Date",
        value: "{{date:MMMM D, YYYY}}",
        description: "Long date format (Month Day, Year)",
      },
      {
        id: "time",
        label: "Time",
        value: "{{date:hh:mm A}}",
        description: "Time in 12-hour format (hh:mm AM/PM)",
      },
      {
        id: "time-24",
        label: "24h Time",
        value: "{{date:HH:mm}}",
        description: "Time in 24-hour format (HH:mm)",
      },
      {
        id: "datetime",
        label: "Date & Time",
        value: "{{date:MM/DD/YYYY hh:mm A}}",
        description: "Date and time combined",
      },
    ],
  },
  {
    id: "user",
    name: "User Data",
    // icon: Users,
    templates: [
      {
        id: "name",
        label: "Full Name",
        value: "{{user.name}}",
        description: "User's full name",
      },
      {
        id: "first-name",
        label: "First Name",
        value: "{{user.firstName}}",
        description: "User's first name",
      },
      {
        id: "email",
        label: "Email",
        value: "{{user.email}}",
        description: "User's email address",
      },
    ],
  },
  {
    id: "system",
    name: "System",
    // icon: Hash,
    templates: [
      {
        id: "id",
        label: "ID",
        value: "{{id}}",
        description: "Unique identifier",
      },
      {
        id: "counter",
        label: "Counter",
        value: "{{counter}}",
        description: "Incremental counter",
      },
      {
        id: "random",
        label: "Random",
        value: "{{random}}",
        description: "Random string",
      },
    ],
  },
  {
    id: "formatting",
    name: "Formatting",
    // icon: Type,
    templates: [
      {
        id: "uppercase",
        label: "Uppercase",
        value: "{{uppercase:text}}",
        description: "Convert text to uppercase",
      },
      {
        id: "lowercase",
        label: "Lowercase",
        value: "{{lowercase:text}}",
        description: "Convert text to lowercase",
      },
      {
        id: "capitalize",
        label: "Capitalize",
        value: "{{capitalize:text}}",
        description: "Capitalize first letter",
      },
    ],
  },
  {
    id: "math",
    name: "Math",
    // icon: Hash,
    templates: [
      {
        id: "sum",
        label: "Sum",
        value: "{{sum:a,b}}",
        description: "Sum of values",
      },
      {
        id: "multiply",
        label: "Multiply",
        value: "{{multiply:a,b}}",
        description: "Multiply values",
      },
      {
        id: "round",
        label: "Round",
        value: "{{round:number}}",
        description: "Round to nearest integer",
      },
    ],
  },
  {
    id: "conditional",
    name: "Conditional",
    // icon: Zap,
    templates: [
      {
        id: "if",
        label: "If Statement",
        value: "{{if:condition,then,else}}",
        description: "Conditional logic",
      },
      {
        id: "switch",
        label: "Switch",
        value: "{{switch:value,case1,result1,...}}",
        description: "Switch statement",
      },
      {
        id: "exists",
        label: "Exists",
        value: "{{exists:value,then,else}}",
        description: "Check if value exists",
      },
    ],
  },
  {
    id: "arrays",
    name: "Arrays",
    // icon: Hash,
    templates: [
      {
        id: "join",
        label: "Join",
        value: "{{join:array,separator}}",
        description: "Join array elements",
      },
      {
        id: "first",
        label: "First",
        value: "{{first:array}}",
        description: "First element of array",
      },
      {
        id: "last",
        label: "Last",
        value: "{{last:array}}",
        description: "Last element of array",
      },
    ],
  },
  {
    id: "custom",
    name: "Custom Fields",
    // icon: Hash,
    templates: [
      {
        id: "custom1",
        label: "Custom Field 1",
        value: "{{custom.field1}}",
        description: "Custom field 1",
      },
      {
        id: "custom2",
        label: "Custom Field 2",
        value: "{{custom.field2}}",
        description: "Custom field 2",
      },
      {
        id: "custom3",
        label: "Custom Field 3",
        value: "{{custom.field3}}",
        description: "Custom field 3",
      },
    ],
  },
];

interface TemplateEditorProps {
  value?: string;
  onChange: (value: string) => void;
  isHtml?: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  value: initialValue,
  onChange,
  isHtml,
}) => {
  const [value, setValue] = useState(initialValue || "");
  const [open, setOpen] = useState(false);
  const restoreFocusTargetAttribute = useRestoreFocusTarget();

  useEffect(() => {
    setValue(initialValue || "");
  }, [open, initialValue]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
        {isHtml ? (
          <ReactQuill
            className="minimal-editor"
            modules={{ toolbar: [] }}
            style={{ width: "140px" }}
            placeholder="Enter text"
            onChange={onChange}
            value={open ? initialValue : value}
          />
        ) : (
          <Input
            style={{ width: "140px" }}
            placeholder="Enter text"
            onChange={(_, { value }) => {
              onChange(value);
            }}
            value={open ? initialValue : value}
          />
        )}
        <Tooltip
          content="Expression"
          relationship="label"
          positioning={"above-end"}
          withArrow>
          <Button
            {...restoreFocusTargetAttribute}
            onClick={() => setOpen(true)}
            size="small"
            appearance="outline"
            icon={<MathFormulaRegular style={{ fontSize: "16px" }} />}
          />
        </Tooltip>
      </div>
      <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <DialogSurface style={{ minWidth: "60vw" }}>
          <DialogBody>
            <DialogTitle>Expression Editor</DialogTitle>
            <DialogContent style={{ padding: "1rem 0" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <InfoLabel info="Template variables will be replaced with actual values when rendered">
                    Content
                  </InfoLabel>
                  <div style={{ marginTop: "1rem", flex: 1, display: "flex" }}>
                    {isHtml ? (
                      <ReactQuill
                        className="full-editor"
                        style={{ flex: 1, height: "90%" }}
                        placeholder="Enter text"
                        onChange={(value) => setValue(value)}
                        value={value}
                      />
                    ) : (
                      <Textarea
                        style={{ width: "100%" }}
                        placeholder="Enter text"
                        onChange={(_, { value }) => {
                          setValue(value);
                        }}
                        value={value}
                      />
                    )}
                  </div>
                </div>
                <div style={{ minWidth: 300 }}>
                  <Card appearance="outline">
                    <CardHeader header="Template categories" />
                    <div style={{ height: 400, overflow: "auto" }}>
                      {templateCategories.map((category) => (
                        <Card
                          size="small"
                          key={category.id}
                          appearance="subtle"
                          onClick={() => {}}>
                          <CardHeader
                            header={category.name}
                            action={
                              <Button
                                appearance="transparent"
                                icon={<ChevronRightRegular />}
                              />
                            }
                          />
                        </Card>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={() => {
                  onChange(value);
                  setOpen(false);
                }}>
                Save
              </Button>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Close</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default TemplateEditor;
