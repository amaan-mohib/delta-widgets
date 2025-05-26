import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
} from "@fluentui/react-components";
import React, { useMemo } from "react";
import { getManifestStore, useManifestStore } from "../stores/useManifestStore";
import CustomField from "./TemplateEditor/CustomField";
import { getCustomFieldsTemplate } from "./TemplateEditor/categories";
import { TemplateCard } from "./TemplateEditor";

interface CustomFieldsViewProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CustomFieldsView: React.FC<CustomFieldsViewProps> = ({
  open,
  setOpen,
}) => {
  const manifest = getManifestStore();

  const templates = useMemo(
    () => getCustomFieldsTemplate(manifest?.customFields || {}),
    [manifest]
  );

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Custom Fields</DialogTitle>
          <DialogContent
            style={{ padding: "1rem 0", height: "75vh", overflow: "auto" }}>
            <CustomField />
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                onRemove={(template) => {
                  useManifestStore.getState().removeCustomValues(template.id);
                }}
                template={template}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default CustomFieldsView;
