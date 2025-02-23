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
import React, { useCallback, useEffect, useState } from "react";
import { addWidget, fileOrFolderPicker, IWidget } from "../utils/widgets";

export interface IDialogState {
  open: boolean;
  type: "file" | "folder" | "url" | "none";
  path: string;
  manifest?: IWidget;
}

interface AddWidgetDialogProps {
  title?: string;
  dialogState: IDialogState;
  onClose: () => void;
  resetDialogState: React.Dispatch<React.SetStateAction<IDialogState>>;
}

const AddWidgetDialog: React.FC<AddWidgetDialogProps> = ({
  title,
  dialogState,
  onClose,
  resetDialogState,
}) => {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (dialogState.type === "folder") {
      setLabel(dialogState.path.split(/\/|\\/).at(-1) || "");
    } else if (dialogState.type === "file" && dialogState.manifest) {
      setLabel(dialogState.manifest.label || dialogState.manifest.key || "");
    } else {
      setLabel("");
    }
  }, [dialogState.path, dialogState.type]);

  const onDialogClose = useCallback(() => {
    onClose();
    resetDialogState((prev) => ({ ...prev, open: false }));
    setLabel("");
    setUrl("");
    setError("");
  }, [JSON.stringify(dialogState)]);

  return (
    <Dialog
      open={dialogState.open}
      onOpenChange={(_, open) => {
        if (!open) resetDialogState((prev) => ({ ...prev, open }));
      }}>
      <DialogSurface style={{ maxWidth: "400px" }}>
        <DialogBody>
          <DialogTitle>{title || "Add widget"}</DialogTitle>
          <DialogContent style={{ padding: "20px 0" }}>
            <Field
              required={dialogState.type !== "folder"}
              label={`Label${
                dialogState.type === "folder" ? " (Optional)" : ""
              }`}>
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
                  onClick={async () => {
                    if (dialogState.type === "file") {
                      const { path, manifest } = await fileOrFolderPicker(
                        false,
                        "Select JSON file",
                        ["json"]
                      );
                      if (path && manifest)
                        resetDialogState({
                          open: true,
                          type: "file",
                          path,
                          manifest,
                        });
                      console.log(path);
                    }
                    if (dialogState.type === "folder") {
                      const { path } = await fileOrFolderPicker(
                        true,
                        "Select HTML folder"
                      );
                      if (path)
                        resetDialogState({ open: true, type: "folder", path });
                      console.log(path);
                    }
                  }}
                  style={{ width: "max-content" }}>
                  {dialogState.path.split(/\/|\\/).at(-1) || ""}
                </Button>
              </Field>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                onDialogClose();
              }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (
                  dialogState.type === "url" &&
                  !/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(
                    url
                  )
                ) {
                  setError("Invalid URL");
                  return;
                }
                addWidget(
                  dialogState.type === "url"
                    ? "url"
                    : dialogState.type === "file"
                    ? "json"
                    : dialogState.type === "folder"
                    ? "html"
                    : "json",
                  {
                    label,
                    manifest: dialogState.manifest,
                    path: dialogState.path,
                    url,
                  }
                )
                  .then(() => {
                    onDialogClose();
                  })
                  .catch(console.error);
              }}
              appearance="primary"
              disabled={(() => {
                if (dialogState.type === "url") {
                  return !label.trim() || !url.trim();
                }
                return !label.trim();
              })()}>
              Submit
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AddWidgetDialog;
