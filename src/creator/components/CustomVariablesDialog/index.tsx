import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Tab,
  TabList,
} from "@fluentui/react-components";
import React, { useMemo, useState } from "react";
import {
  getManifestStore,
  useManifestStore,
} from "../../stores/useManifestStore";
import CustomField from "../TemplateEditor/CustomField";
import { getCustomFieldsTemplate } from "../TemplateEditor/categories";
import { TemplateCard } from "../TemplateEditor";
import CustomCSSForm from "./CustomCSSForm";

interface CustomFieldsViewProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

type TTabs = "fields" | "css";

const CustomFieldsView: React.FC<CustomFieldsViewProps> = ({
  open,
  setOpen,
}) => {
  const manifest = getManifestStore();
  const [selectedTab, setSelectedTab] = useState<TTabs>("fields");

  const templates = useMemo(
    () => getCustomFieldsTemplate(manifest?.customFields || {}),
    [manifest]
  );

  const content = useMemo(() => {
    if (selectedTab === "fields") {
      return (
        <>
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
        </>
      );
    }
    return <CustomCSSForm />;
  }, [selectedTab, templates]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Custom Variables</DialogTitle>
          <DialogContent>
            <TabList
              selectedValue={selectedTab}
              onTabSelect={(_, data) => {
                setSelectedTab(data.value as TTabs);
              }}>
              <Tab value="fields">Fields</Tab>
              <Tab value="css">CSS</Tab>
            </TabList>
            <div
              style={{ padding: "1rem 0", height: "75vh", overflow: "auto" }}>
              {content}
            </div>
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
