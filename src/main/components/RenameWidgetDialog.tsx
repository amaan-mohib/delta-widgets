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
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDataStore } from "../stores/useDataStore";
import { getManifestPath } from "../../common";
import { commands } from "../../common/commands";

interface RenameWidgetDialogProps {
  title?: string;
}

const RenameWidgetDialog: React.FC<RenameWidgetDialogProps> = ({ title }) => {
  const [label, setLabel] = useState("");
  const renameWidget = useDataStore((state) => state.renameWidget);

  useEffect(() => {
    if (!renameWidget) return;

    setLabel(renameWidget.label);
  }, [renameWidget]);

  const onDialogClose = useCallback(() => {
    useDataStore.setState({ renameWidget: null });
    setLabel("");
  }, []);

  const onSubmit = useCallback(async () => {
    if (!renameWidget) return;
    try {
      const manifestPath = await getManifestPath(renameWidget.path);
      await commands.updateManifestValue({
        field: "label",
        value: label,
        path: JSON.stringify(manifestPath),
      });
      useDataStore.getState().updateAllWidgets();
      onDialogClose();
    } catch (error) {
      console.error(error);
    }
  }, [label]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const canSubmit = useMemo(() => {
    return !label.trim();
  }, [label]);

  return (
    <Dialog
      open={!!renameWidget}
      onOpenChange={(_, { open }) => {
        if (!open) {
          onDialogClose();
        }
      }}>
      <DialogSurface style={{ maxWidth: "400px" }}>
        <DialogBody>
          <DialogTitle>{title || "Rename widget"}</DialogTitle>
          <DialogContent style={{ padding: "20px 0" }}>
            <Field required label="Label">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </Field>
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

export default RenameWidgetDialog;
