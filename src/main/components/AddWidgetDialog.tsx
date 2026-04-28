import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
} from "@fluentui/react-components";
import { CodeRegular, FolderRegular, LinkRegular } from "@fluentui/react-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  addWidget,
  createWidgetWindow,
  fileOrFolderPicker,
  removeWidget,
} from "../utils/widgets";
import { useDataStore } from "../stores/useDataStore";
import { useAddDialogStore } from "../stores/useAddDialogStore";
import { closeWidgetWindow } from "../../common";

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

const getType = (type: string) => {
  if (type === "url") return "url";
  if (type === "file") return "json";
  if (type === "folder") return "html";
  return "json";
};

interface AddWidgetDialogProps {
  title?: string;
}

const AddWidgetDialog: React.FC<AddWidgetDialogProps> = ({ title }) => {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const updateAllWidgets = useDataStore((state) => state.updateAllWidgets);
  const { dialogState, setDialogState, resetDialogState } = useAddDialogStore();

  useEffect(() => {
    if (dialogState.type === "folder") {
      setLabel(
        (dialogState.existingManifest?.label || dialogState.path)
          .split(/\/|\\/)
          .at(-1) || "",
      );
    } else if (dialogState.type === "file" && dialogState.manifest) {
      setLabel(dialogState.manifest.label || dialogState.manifest.key || "");
    } else {
      setLabel(dialogState.existingManifest?.label || "");
    }
    if (dialogState.existingManifest && dialogState.type === "url") {
      setUrl(dialogState.existingManifest.url || "");
    }
  }, [dialogState]);

  const onDialogClose = useCallback(() => {
    resetDialogState();
    setLabel("");
    setUrl("");
    setError("");
  }, [JSON.stringify(dialogState)]);

  const updateFile = useCallback(async () => {
    if (dialogState.type === "file") {
      const { path, manifest } = await fileOrFolderPicker({
        title: "Select JSON file",
        extensions: ["json"],
      });
      if (path && manifest)
        setDialogState({
          open: true,
          type: "file",
          path,
          manifest,
        });
    }
    if (dialogState.type === "folder") {
      const { path } = await fileOrFolderPicker({
        directory: true,
        title: "Select HTML folder",
      });
      if (path) setDialogState({ open: true, type: "folder", path });
    }
  }, [dialogState.type, setDialogState]);

  const onSubmit = useCallback(async () => {
    if (dialogState.type === "url" && !URL_REGEX.test(url)) {
      setError("Invalid URL");
      return;
    }
    try {
      const type = getType(dialogState.type);
      const newManifest = await addWidget(type, {
        label,
        manifest: dialogState.manifest,
        path: dialogState.path,
        url,
        existingManifestPath: dialogState.existingManifest?.path,
      });
      if (dialogState.existingManifest?.path && newManifest) {
        if (newManifest.visible) {
          await closeWidgetWindow(`widget-${dialogState.existingManifest.key}`);
        }
        if (dialogState.existingManifest.key !== newManifest.key) {
          await removeWidget(
            dialogState.existingManifest.path,
            dialogState.existingManifest,
          );
        }
        if (newManifest.visible) {
          await createWidgetWindow(newManifest.path);
        }
      }
      if (newManifest) {
        updateAllWidgets();
        onDialogClose();
      }
    } catch (error) {
      console.error(error);
    }
  }, [onDialogClose, dialogState, label, url]);

  const canSubmit = useMemo(() => {
    if (dialogState.type === "url") {
      return !label.trim() || !url.trim();
    }
    return !label.trim();
  }, [dialogState.type, label, url]);

  return (
    <Dialog
      open={dialogState.open}
      onOpenChange={(_, { open }) => {
        if (!open) {
          onDialogClose();
        }
      }}>
      <DialogSurface style={{ maxWidth: "400px" }}>
        <DialogBody>
          <DialogTitle>{title || "Add widget"}</DialogTitle>
          <DialogContent style={{ padding: "20px 0" }}>
            <Field required label="Label">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </Field>
            {dialogState.type === "url" && (
              <Field
                label="URL"
                required
                style={{ marginTop: 10 }}
                validationMessage={error}
                validationState={error ? "error" : undefined}>
                <Input
                  placeholder="https://www.example.com"
                  contentBefore={<LinkRegular />}
                  type="url"
                  value={url}
                  onChange={(e) => {
                    if (error) {
                      setError("");
                    }
                    setUrl(e.target.value);
                  }}
                />
              </Field>
            )}
            {(dialogState.type === "file" || dialogState.type === "folder") && (
              <Field
                label={dialogState.type === "file" ? "JSON file" : "Folder"}
                style={{ marginTop: 10 }}>
                <Button
                  icon={
                    dialogState.type === "file" ? (
                      <CodeRegular />
                    ) : (
                      <FolderRegular />
                    )
                  }
                  onClick={updateFile}
                  style={{ width: "max-content" }}>
                  {dialogState.path.split(/\/|\\/).at(-1) || ""}
                </Button>
              </Field>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onDialogClose}>Cancel</Button>
            <Button
              onClick={onSubmit}
              appearance="primary"
              disabled={canSubmit}>
              Submit
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AddWidgetDialog;
