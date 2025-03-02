import {
  Button,
  Input,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  Tooltip,
} from "@fluentui/react-components";
import { useManifestStore } from "../stores/useManifestStore";
import { useCallback, useRef, useState } from "react";
import {
  CheckmarkRegular,
  DismissRegular,
  EditRegular,
  SaveRegular,
} from "@fluentui/react-icons";
import { message } from "@tauri-apps/plugin-dialog";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import { updateManifest } from "../../main/utils/widgets";

interface ToolbarProps {}

const CreatorToolbar: React.FC<ToolbarProps> = () => {
  const manifest = useManifestStore((state) => state.manifest);
  const projectName = useManifestStore((obj) => obj.manifest?.label);
  const [editName, setEditName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isSaving = useDataTrackStore((state) => state.isSaving);

  const onSubmit = useCallback(async (key: string, label: string) => {
    if (key in (window.__INITIAL_STATE__?.existingKeys || {})) {
      await message("A widget with same label already exist", {
        title: "Error",
        kind: "error",
      });
      return;
    }

    useManifestStore.getState().updateManifest({ key, label });
    setEditName(false);
  }, []);

  return (
    <Toolbar style={{ gap: "5px", justifyContent: "space-between" }}>
      <ToolbarGroup style={{ display: "flex", alignItems: "center" }}>
        {!editName ? (
          <Tooltip content="Project name" relationship="label">
            <Button
              appearance="secondary"
              icon={<EditRegular />}
              onClick={() => {
                setEditName(true);
                setTimeout(() => {
                  nameInputRef.current?.focus();
                }, 100);
              }}>
              {projectName}
            </Button>
          </Tooltip>
        ) : (
          <form
            style={{ gap: "5px", display: "flex", alignItems: "center" }}
            onSubmit={(e) => {
              e.preventDefault();
              const label = nameInputRef.current?.value || "";
              const key = label.replace(/ /g, "").toLowerCase();
              onSubmit(key, label);
            }}>
            <Input size="small" ref={nameInputRef} defaultValue={projectName} />
            <ToolbarButton icon={<CheckmarkRegular />} type="submit" />
            <ToolbarButton
              icon={<DismissRegular />}
              onClick={() => setEditName(false)}
            />
          </form>
        )}
        <ToolbarDivider />
        <Tooltip content="Save" relationship="label">
          <ToolbarButton
            disabled={isSaving}
            icon={<SaveRegular />}
            onClick={() => {
              useDataTrackStore.setState({ isSaving: true });
              if (manifest)
                updateManifest(manifest)
                  .catch(console.error)
                  .finally(() => {
                    useDataTrackStore.setState({ isSaving: false });
                  });
            }}
          />
        </Tooltip>
      </ToolbarGroup>
      <ToolbarGroup></ToolbarGroup>
    </Toolbar>
  );
};

export default CreatorToolbar;
