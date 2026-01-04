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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRedoRegular,
  ArrowUndoRegular,
  BracesVariableRegular,
  CheckmarkRegular,
  DismissRegular,
  EditRegular,
  FolderRegular,
  QuestionCircleRegular,
  SaveRegular,
} from "@fluentui/react-icons";
import { message } from "@tauri-apps/plugin-dialog";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import {
  closeWidgetWindow,
  createWidgetWindow,
  openManifestFolder,
  publishWidget,
  sanitizeString,
  updateManifest,
} from "../../main/utils/widgets";
import { listen } from "@tauri-apps/api/event";
import CustomVariablesDialog from "./CustomVariablesDialog";
import { useShallow } from "zustand/shallow";
import CancelZone from "./DnD/CancelZone";
import { useToolbarActions } from "../hooks/useToolbarActions";
import { ThemePicker } from "../theme/Theme";
import { Webview } from "@tauri-apps/api/webview";

interface ToolbarProps {}

const CreatorToolbar: React.FC<ToolbarProps> = () => {
  const manifest = getManifestStore();
  const [editName, setEditName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isSaving = useDataTrackStore((state) => state.isSaving);
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const [elementMap, undoStack, redoStack] = useManifestStore(
    useShallow((state) => [state.elementMap, state.undoStack, state.redoStack])
  );
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);

  const selectedElement = selectedId ? elementMap[selectedId] : null;
  const actions = useToolbarActions(selectedElement);

  const { projectName, isPublished, manifestKey } = useMemo(
    () => ({
      projectName: manifest?.label,
      isPublished: !!manifest?.published,
      manifestKey: manifest?.key || "",
    }),
    [manifest]
  );

  useEffect(() => {
    if (!manifestKey) return;
    Webview.getByLabel(`widget-preview-${manifestKey}`).then(
      (previewWindow) => {
        setIsPreviewing(!!previewWindow);
      }
    );
  }, [manifestKey]);

  useEffect(() => {
    if (!manifest) return;

    const unsub = listen<string>("widget-close", ({ payload }) => {
      const path = manifest.path;
      if (path && payload.startsWith(path)) {
        setIsPreviewing(false);
      }
    });

    return () => {
      unsub.then((f) => f());
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

  const togglePreview = useCallback(async () => {
    if (isPreviewing) {
      await closeWidgetWindow(`widget-preview-${manifest?.key || ""}`);
    } else {
      await createWidgetWindow(manifest?.path || "", true);
      setIsPreviewing(true);
    }
  }, [isPreviewing, manifest]);

  const publish = useCallback(async () => {
    useDataTrackStore.setState({ isSaving: true });
    await publishWidget(manifest?.path || "");
    useDataTrackStore.setState({ isSaving: false });
    window.location.reload();
  }, [manifest]);

  return (
    <Toolbar style={{ gap: "5px", justifyContent: "space-between" }}>
      <ToolbarGroup style={{ display: "flex", alignItems: "center" }}>
        {!editName ? (
          <Tooltip content="Project name" relationship="label">
            <Button
              disabled={isSaving || isPreviewing || isPublished}
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
              const key = sanitizeString(label);
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
        {actions.length > 0 && <ToolbarDivider />}
        {actions.map((item) =>
          item.enabled ? (
            <Tooltip key={item.label} content={item.label} relationship="label">
              <ToolbarButton icon={item.icon} onClick={item.onClick} />
            </Tooltip>
          ) : null
        )}
      </ToolbarGroup>
      <ToolbarGroup style={{ display: "flex", alignItems: "center" }}>
        <CancelZone />
      </ToolbarGroup>
      <ToolbarGroup style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Tooltip content="Custom Variables" relationship="label">
          <ToolbarButton
            icon={<BracesVariableRegular />}
            onClick={() => {
              setIsCustomFieldsOpen(true);
            }}
          />
        </Tooltip>
        <Tooltip content="Open containing folder" relationship="label">
          <ToolbarButton
            icon={<FolderRegular />}
            onClick={async () => {
              openManifestFolder(manifest!);
            }}
          />
        </Tooltip>
        <Tooltip content="Help / Documentation" relationship="label">
          <Button
            as="a"
            href="https://amaan-mohib.github.io/delta-widgets/overview/"
            target="_blank"
            icon={<QuestionCircleRegular />}
            appearance="subtle"
          />
        </Tooltip>
        <ThemePicker />
        <Button size="small" disabled={isSaving} onClick={togglePreview}>
          {isPreviewing ? "Close preview" : "Preview"}
        </Button>
        <Tooltip
          content={
            isPublished && manifest?.publishedAt
              ? `Last published: ${new Date(
                  manifest.publishedAt
                ).toLocaleString()}`
              : "Add the widget to the Installed list"
          }
          relationship="label">
          <Button
            size="small"
            appearance="primary"
            onClick={publish}
            disabled={isSaving}>
            {isPublished ? "Update" : "Publish"}
          </Button>
        </Tooltip>
      </ToolbarGroup>
      <CustomVariablesDialog
        open={isCustomFieldsOpen}
        setOpen={setIsCustomFieldsOpen}
      />
    </Toolbar>
  );
};

export default CreatorToolbar;
