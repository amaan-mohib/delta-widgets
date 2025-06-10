import {
  Button,
  Card,
  CardHeader,
  Divider,
  Input,
  Text,
} from "@fluentui/react-components";
import { DocumentRegular } from "@fluentui/react-icons";
import React, { useState } from "react";
import { fileOrFolderPicker } from "../../../main/utils/widgets";
import {
  getManifestStore,
  useManifestStore,
} from "../../stores/useManifestStore";

interface CustomCSSFormProps {}

const CustomCSSForm: React.FC<CustomCSSFormProps> = () => {
  const manifest = getManifestStore();
  const [cssUrl, setCssUrl] = useState("");

  if (!manifest) return null;

  return (
    <div>
      <Card appearance="filled-alternative" style={{ marginBottom: "1rem" }}>
        <Text>Add custom CSS:</Text>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Input
            style={{ width: "100%" }}
            value={cssUrl}
            onChange={(_, { value }) => setCssUrl(value)}
            placeholder="Enter CSS URL"
          />
          <Button
            appearance="primary"
            disabled={!cssUrl}
            onClick={() => {
              useManifestStore
                .getState()
                .updateManifest({ css: [...(manifest.css || []), cssUrl] });
              setCssUrl("");
            }}>
            Add
          </Button>
        </div>
        <Divider>OR</Divider>
        <Button
          icon={<DocumentRegular />}
          onClick={async () => {
            const { path } = await fileOrFolderPicker(
              false,
              "Select CSS file",
              ["css"],
              false
            );
            if (path) {
              setCssUrl(path);
            }
          }}>
          Select CSS file
        </Button>
      </Card>
      {(manifest.css?.length ?? 0) > 0 && (
        <Card appearance="outline">
          <Text>Added:</Text>
          {(manifest.css || []).map((item, index) => (
            <Card
              key={`${item}-${index}`}
              appearance="subtle"
              size="small"
              onClick={() => {
                useManifestStore.getState().updateManifest({
                  css: [...(manifest.css || []).filter((_, i) => i !== index)],
                });
              }}>
              <CardHeader
                header={item}
                action={
                  <Button appearance="transparent" size="small">
                    Remove
                  </Button>
                }
              />
            </Card>
          ))}
        </Card>
      )}
    </div>
  );
};

export default CustomCSSForm;
