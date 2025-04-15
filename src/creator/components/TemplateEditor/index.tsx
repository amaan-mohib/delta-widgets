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
  SearchBox,
  Textarea,
  Tooltip,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  Braces20Regular,
  CalendarDate20Regular,
  ChevronRightRegular,
  MathFormulaRegular,
  Play20Regular,
} from "@fluentui/react-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./index.css";

const templateCategories = [
  {
    id: "date",
    name: "Date & Time",
    icon: <CalendarDate20Regular />,
    templates: [
      {
        id: "date",
        label: "Date",
        value: "{{date}}",
        description: "Current date (YYYY/MM/DD)",
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
        value: "{{time}}",
        description: "Time in 12-hour format (default) (hh:mm AM/PM)",
      },
      {
        id: "time-12",
        label: "12h Time",
        value: "{{time:hh:mm aa}}",
        description: "Time in 12-hour format (hh:mm AM/PM)",
      },
      {
        id: "time-24",
        label: "24h Time",
        value: "{{time:HH:mm}}",
        description: "Time in 24-hour format (HH:mm)",
      },
      {
        id: "datetime",
        label: "Date & Time (default)",
        value: "{{datetime}}",
        description: "Date and time combined",
      },
      {
        id: "datetime2",
        label: "Date & Time",
        value: "{{datetime:MMMM d yyyy, h:mm aa}}",
        description: "Date and time combined",
      },
    ],
  },
  {
    id: "media",
    name: "Media",
    icon: <Play20Regular />,
    templates: [
      {
        id: "name",
        label: "Media Title",
        value: "{{media:title}}",
        description: "Title of the playing media",
      },
      {
        id: "artist",
        label: "Artist",
        value: "{{media:artist}}",
        description: "Artist of the playing media",
      },
      {
        id: "thumbnail",
        label: "Thumbnail",
        value: "{{media:thumbnail}}",
        description: "Thumbnail of the playing media",
      },
      {
        id: "status",
        label: "Media Status",
        value: "{{media:status}}",
        description: "Status of the current media",
      },
      {
        id: "player",
        label: "Media Player",
        value: "{{media:player}}",
        description: "Application currently playing the media",
      },
      {
        id: "player_icon",
        label: "Media Player Icon",
        value: "{{media:player_icon}}",
        description: "Icon of the Application playing the media",
      },
      {
        id: "position",
        label: "Position",
        value: "{{media:position}}",
        description: "Current timeline position of the playing media",
      },
      {
        id: "duration",
        label: "Duration",
        value: "{{media:duration}}",
        description: "Current timeline duration of the playing media",
      },
      {
        id: "position_text",
        label: "Position (Formatted)",
        value: "{{media:position_text}}",
        description: "Formatted current timeline position of the playing media",
      },
      {
        id: "duration_text",
        label: "Duration (Formatted)",
        value: "{{media:duration_text}}",
        description: "Formatted current timeline duration of the playing media",
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
    id: "custom",
    name: "Custom Fields",
    icon: <Braces20Regular />,
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

type TTemplate = (typeof templateCategories)[0]["templates"][0];

const TemplateCard: React.FC<{
  template: TTemplate;
  onInsert: (template: TTemplate) => void;
}> = ({ template, onInsert }) => {
  return (
    <Card
      size="small"
      key={template.id}
      appearance="subtle"
      onClick={() => {
        onInsert(template);
      }}>
      <CardHeader
        header={template.label}
        action={
          <Button appearance="transparent" size="small">
            Insert
          </Button>
        }
      />
      <code>{template.value}</code>
      <p>{template.description}</p>
    </Card>
  );
};

interface TemplateEditorProps {
  value?: string;
  onChange: (value: string) => void;
  isHtml?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  value: initialValue,
  onChange,
  isHtml,
  placeholder,
  disabled,
}) => {
  const [value, setValue] = useState(initialValue || "");
  const [open, setOpen] = useState(false);
  const restoreFocusTargetAttribute = useRestoreFocusTarget();
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof templateCategories)[0] | null
  >(null);
  const [search, setSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const [selection, setSelection] = useState(0);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  const filteredTemplates = useMemo(() => {
    if (!search) return [];

    return templateCategories.flatMap((category) =>
      category.templates.filter(
        (template) =>
          template.label.toLowerCase().includes(search.toLowerCase()) ||
          template.value.toLowerCase().includes(search.toLowerCase()) ||
          template.description.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search]);

  const insertTemplate = (template: string) => {
    if (quillRef.current && isHtml) {
      const length = quillRef.current.editor?.scroll.length() || 0;
      quillRef.current.editor?.insertText(selection || length - 1, template);
    }
    if (textareaRef.current && !isHtml) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent =
        value.substring(0, start) + template + value.substring(end);

      setValue(newContent);

      // Set cursor position after the inserted template
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPosition = start + template.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "end", gap: 5 }}>
        {isHtml ? (
          <ReactQuill
            className="minimal-editor"
            modules={{ toolbar: [] }}
            style={{ width: "140px" }}
            placeholder={placeholder || "Enter text"}
            onChange={onChange}
            value={initialValue}
            readOnly={disabled}
          />
        ) : (
          <Input
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            style={{ width: "140px" }}
            placeholder={placeholder || "Enter text"}
            onChange={(_, { value }) => {
              onChange(value);
            }}
            value={initialValue}
            disabled={disabled}
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
            <InfoLabel
              style={{ display: "flex", gap: 10 }}
              label={<DialogTitle>Expression Editor</DialogTitle>}
              info="Template variables will be replaced with actual values when rendered">
              Content
            </InfoLabel>
            <DialogContent style={{ padding: "1rem 0" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "flex" }}>
                    {isHtml ? (
                      <ReactQuill
                        ref={quillRef}
                        onChangeSelection={(selection) => {
                          if (selection?.index) {
                            setSelection(selection?.index || 0);
                          }
                        }}
                        className="full-editor"
                        style={{ flex: 1, height: "92%" }}
                        placeholder={placeholder || "Enter text"}
                        onChange={setValue}
                        value={value}
                        readOnly={disabled}
                      />
                    ) : (
                      <Textarea
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck="false"
                        ref={textareaRef}
                        style={{ width: "100%" }}
                        placeholder={placeholder || "Enter text"}
                        onChange={(_, { value }) => {
                          setValue(value);
                        }}
                        value={value}
                        disabled={disabled}
                      />
                    )}
                  </div>
                </div>
                <div style={{ width: 300 }}>
                  <SearchBox
                    value={search}
                    onChange={(_, { value }) => setSearch(value)}
                    placeholder="Search templates"
                    style={{ width: "100%" }}
                  />
                  <Card appearance="outline" style={{ marginTop: "1rem" }}>
                    <CardHeader
                      style={{ height: 24 }}
                      image={
                        selectedCategory && !search ? (
                          <Button
                            size="small"
                            onClick={() => setSelectedCategory(null)}
                            icon={<ArrowLeftRegular />}
                            appearance="transparent"
                          />
                        ) : null
                      }
                      header={
                        search
                          ? "Search results"
                          : selectedCategory
                          ? selectedCategory.name
                          : "Template categories"
                      }
                    />
                    <div style={{ height: 400, overflow: "auto" }}>
                      {search
                        ? filteredTemplates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              onInsert={(template) => {
                                insertTemplate(template.value);
                              }}
                              template={template}
                            />
                          ))
                        : selectedCategory
                        ? selectedCategory.templates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              onInsert={(template) => {
                                insertTemplate(template.value);
                              }}
                              template={template}
                            />
                          ))
                        : templateCategories.map((category) => (
                            <Card
                              size="small"
                              key={category.id}
                              appearance="subtle"
                              onClick={() => {
                                setSelectedCategory(category);
                              }}>
                              <CardHeader
                                image={category.icon}
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
