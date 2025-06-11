import {
  Button,
  Card,
  CardHeader,
  Divider,
  Input,
  Text,
} from "@fluentui/react-components";
import { DocumentRegular } from "@fluentui/react-icons";
import React, { useCallback, useState } from "react";
import { fileOrFolderPicker } from "../../../main/utils/widgets";
import {
  getManifestStore,
  useManifestStore,
} from "../../stores/useManifestStore";
import { nanoid } from "nanoid";
import { message } from "@tauri-apps/plugin-dialog";

interface CustomCSSFormProps {}

const CustomCSSForm: React.FC<CustomCSSFormProps> = () => {
  const manifest = getManifestStore();
  const [cssUrl, setCssUrl] = useState("");

  const addCss = useCallback(
    (path: string, type: "file" | "url") => {
      if (type === "url") {
        try {
          new URL(path);
        } catch (e) {
          message("Invalid URL format. Please enter a valid URL.", {
            kind: "error",
            title: "Invalid URL",
          });
          return;
        }
      }
      const data = {
        key: `${nanoid()}.css`,
        kind: type,
        path,
        type: "css",
      };
      useManifestStore.getState().updateManifest({
        customAssets: manifest?.customAssets
          ? [...manifest.customAssets, data]
          : [data],
      });
      setCssUrl("");
    },
    [manifest]
  );

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
              addCss(cssUrl, "url");
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
              addCss(path, "file");
            }
          }}>
          Select CSS file
        </Button>
      </Card>
      {(manifest.customAssets?.length ?? 0) > 0 && (
        <Card appearance="outline">
          <Text>Added:</Text>
          {(manifest.customAssets || []).map((item) => (
            <Card
              key={item.key}
              appearance="subtle"
              size="small"
              onClick={() => {
                useManifestStore.getState().updateManifest({
                  customAssets: [
                    ...(manifest.customAssets || []).filter(
                      (i) => i.key !== item.key
                    ),
                  ],
                });
              }}>
              <CardHeader
                header={item.path}
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
