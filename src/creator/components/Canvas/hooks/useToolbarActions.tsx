import {
  ClipboardRegular,
  CopyRegular,
  CutRegular,
  DeleteRegular,
  PaddingDownRegular,
  PaddingLeftRegular,
  PaddingRightRegular,
  PaddingTopRegular,
} from "@fluentui/react-icons";
import {
  IWidgetElementValue,
  useManifestStore,
} from "../../../stores/useManifestStore";
import { useDataTrackStore } from "../../../stores/useDataTrackStore";
import { cloneObject } from "../../../utils";
import { nanoid } from "nanoid";

interface IAction {
  label: string;
  icon: JSX.Element;
  enabled: boolean;
  onClick: () => void;
}

export const useToolbarActions = (
  selectedElement: IWidgetElementValue | null
) => {
  const elementMap = useManifestStore((state) => state.elementMap);
  const clipboard = useManifestStore((state) => state.clipboard);

  if (!selectedElement) return [];

  const isNotContainer = selectedElement.id !== "container";
  const parentFlexDirection = selectedElement.parentId
    ? elementMap[selectedElement.parentId].styles.flexDirection || "row"
    : "row";
  const isHorizontal = parentFlexDirection === "row";

  const pasteAction: IAction = {
    label: "Paste",
    icon: <ClipboardRegular />,
    enabled: !!clipboard,
    onClick: () => {
      if (clipboard) {
        const parentId = selectedElement.parentId || selectedElement.id;
        const newId = `${clipboard.id.split("-")[0]}-${nanoid(4)}`;
        useManifestStore.getState().addElements(
          {
            ...clipboard,
            id: newId,
            label: clipboard.label ? `${clipboard.label} (Copy)` : undefined,
          },
          parentId,
          selectedElement.parentId
            ? selectedElement.index
            : selectedElement.children?.length
        );
        useDataTrackStore.setState({ selectedId: newId });
        useManifestStore.setState({ clipboard: null });
      }
    },
  };

  if (!isNotContainer || !selectedElement.parentId)
    return !!clipboard ? [pasteAction] : [];

  const moveActions: IAction[] = [
    {
      label: isHorizontal ? "Move left" : "Move up",
      icon: isHorizontal ? <PaddingLeftRegular /> : <PaddingTopRegular />,
      enabled: selectedElement.index !== 0,
      onClick: () => {
        useManifestStore
          .getState()
          .moveElement(
            selectedElement.id,
            selectedElement.parentId!,
            selectedElement.index - 1
          );
      },
    },
    {
      label: isHorizontal ? "Move right" : "Move down",
      icon: isHorizontal ? <PaddingRightRegular /> : <PaddingDownRegular />,
      enabled:
        selectedElement.index <
        (elementMap[selectedElement.parentId].children?.length ?? 0),
      onClick: () => {
        useManifestStore
          .getState()
          .moveElement(
            selectedElement.id,
            selectedElement.parentId!,
            selectedElement.index + 1
          );
      },
    },
  ];

  const actions: IAction[] = [
    {
      label: "Cut",
      icon: <CutRegular />,
      enabled: isNotContainer,
      onClick: () => {
        useManifestStore.getState().removeElement(selectedElement.id, true);
        useDataTrackStore.setState({ selectedId: null });
      },
    },
    {
      label: "Copy",
      icon: <CopyRegular />,
      enabled: isNotContainer,
      onClick: () => {
        const element = cloneObject(selectedElement);
        useManifestStore.setState({
          clipboard: {
            id: element.id,
            styles: element.styles,
            type: element.type,
            children: element.children,
            data: element.data,
            label: element.label,
          },
        });
      },
    },
    pasteAction,
    {
      label: "Delete",
      icon: <DeleteRegular />,
      enabled: isNotContainer,
      onClick: () => {
        useManifestStore.getState().removeElement(selectedElement.id);
        useDataTrackStore.setState({ selectedId: null });
      },
    },
    ...moveActions,
  ];
  return actions;
};
