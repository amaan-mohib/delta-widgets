import {
  Button,
  Input,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  Tooltip,
} from "@fluentui/react-components";
import { getManifestStore, useManifestStore } from "../stores/useManifestStore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRedoRegular,
  ArrowUndoRegular,
  BracesVariableRegular,
  CheckmarkRegular,
  DeleteRegular,
  DismissRegular,
  EditRegular,
  SaveRegular,
} from "@fluentui/react-icons";
import { message } from "@tauri-apps/plugin-dialog";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import {
  closeWidgetWindow,
  createWidgetWindow,
  updateManifest,
} from "../../main/utils/widgets";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import CustomFieldsView from "./CustomFieldsView";

interface ToolbarProps {}

const CreatorToolbar: React.FC<ToolbarProps> = () => {
  const manifest = getManifestStore();
  const projectName = useManifestStore((obj) => obj.manifest?.label);
  const [editName, setEditName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isSaving = useDataTrackStore((state) => state.isSaving);
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);
  const undoStack = useManifestStore((state) => state.undoStack);
  const redoStack = useManifestStore((state) => state.redoStack);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);

  useEffect(() => {
    if (!manifest) return;
    let unsub: UnlistenFn;
    (async () => {
      unsub = await listen<string>("widget-close", ({ payload }) => {
        const path = manifest.path;
        if (path && payload.startsWith(path)) {
          setIsPreviewing(false);
        }
      });
    })();
    return () => {
      unsub && unsub();
    };
  }, [manifest]);

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
              disabled={isSaving || isPreviewing}
              size="small"
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
        <Tooltip content="Undo" relationship="label">
          <ToolbarButton
            disabled={undoStack.length === 0}
            icon={<ArrowUndoRegular />}
            onClick={() => {
              useManifestStore.getState().undo();
            }}
          />
        </Tooltip>
        <Tooltip content="Redo" relationship="label">
          <ToolbarButton
            disabled={redoStack.length === 0}
            icon={<ArrowRedoRegular />}
            onClick={() => {
              useManifestStore.getState().redo();
            }}
          />
        </Tooltip>
        {selectedId && selectedId !== "container" && (
          <Tooltip content="Delete" relationship="label">
            <ToolbarButton
              icon={<DeleteRegular />}
              onClick={() => {
                const selectedElement = selectedId
                  ? elementMap[selectedId]
                  : null;
                if (selectedElement) {
                  useManifestStore.getState().removeElement(selectedElement.id);
                  useDataTrackStore.setState({ selectedId: null });
                }
              }}
            />
          </Tooltip>
        )}
      </ToolbarGroup>
      <ToolbarGroup style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {Object.keys(manifest?.customFields || {}).length > 0 && (
          <Tooltip content="Custom fields" relationship="label">
            <ToolbarButton
              icon={<BracesVariableRegular />}
              onClick={() => {
                setIsCustomFieldsOpen(true);
              }}
            />
          </Tooltip>
        )}
        <Button
          size="small"
          onClick={async () => {
            if (isPreviewing) {
              await closeWidgetWindow(
                `widget-preview-${projectName?.toLowerCase().replace(/ /g, "")}`
              );
            } else {
              await createWidgetWindow(manifest?.path || "", true);
              setIsPreviewing(true);
            }
          }}>
          {isPreviewing ? "Close preview" : "Preview"}
        </Button>
        <Button size="small" appearance="primary">
          Publish
        </Button>
      </ToolbarGroup>
      <CustomFieldsView
        open={isCustomFieldsOpen}
        setOpen={setIsCustomFieldsOpen}
      />
    </Toolbar>
  );
};

export default CreatorToolbar;
