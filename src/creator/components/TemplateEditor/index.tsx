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
  Link,
  SearchBox,
  Textarea,
  Tooltip,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  ChevronRightRegular,
  MathFormulaRegular,
} from "@fluentui/react-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./index.css";
import getTemplateCategories, {
  ITemplate,
  ITemplateCategory,
} from "./categories";
import { getManifestStore } from "../../stores/useManifestStore";
import CustomField from "./CustomField";

export const TemplateCard: React.FC<{
  template: ITemplate;
  onInsert?: (template: ITemplate) => void;
  onRemove?: (template: ITemplate) => void;
}> = ({ template, onInsert, onRemove }) => {
  return (
    <Card
      size="small"
      key={template.id}
      appearance="subtle"
      onClick={() => {
        if (onInsert) {
          onInsert(template);
        }
        if (onRemove) {
          onRemove(template);
        }
      }}>
      <CardHeader
        header={template.label}
        action={
          <Button appearance="transparent" size="small">
            {onInsert ? "Insert" : "Remove"}
          </Button>
        }
      />
      <code>{template.value}</code>
      {template.description && (
        <p>
          {template.description}
          {template.helpLink && (
            <div>
              <Link href={template.helpLink} target="_blank">
                {template.helpLinkText || "Learn more"}
              </Link>
            </div>
          )}
        </p>
      )}
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
  const [selectedCategory, setSelectedCategory] =
    useState<ITemplateCategory | null>(null);
  const [search, setSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const [selection, setSelection] = useState(0);
  const manifest = getManifestStore();

  const templateCategories = useMemo(
    () => getTemplateCategories(manifest?.customFields || {}),
    [manifest]
  );

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
  }, [search, templateCategories]);

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

  const templates = useMemo(() => {
    if (search) {
      return filteredTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          onInsert={(template) => {
            insertTemplate(template.value);
          }}
          template={template}
        />
      ));
    }
    if (selectedCategory) {
      const seletedTemplates =
        templateCategories.find((t) => t.id === selectedCategory.id)
          ?.templates || [];
      return seletedTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          onInsert={(template) => {
            insertTemplate(template.value);
          }}
          template={template}
        />
      ));
    }
    return templateCategories.map((category) => (
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
            <Button appearance="transparent" icon={<ChevronRightRegular />} />
          }
        />
      </Card>
    ));
  }, [search, selectedCategory, templateCategories, filteredTemplates]);

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
            disabled={disabled}
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
                      {selectedCategory?.id === "custom" && <CustomField />}
                      {templates}
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
