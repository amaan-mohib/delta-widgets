import React, { useCallback, useEffect, useState } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import {
  IWidgetElementValue,
  useManifestStore,
} from "../../stores/useManifestStore";
import {
  ClipboardRegular,
  CopyRegular,
  CutRegular,
  DeleteRegular,
} from "@fluentui/react-icons";

interface ContextMenuProps {}

const isElementInMap = (
  node: HTMLElement,
  map: Record<string, IWidgetElementValue>
) => {
  if (node.id in map) {
    return map[node.id];
  }
  if (node.parentElement) {
    return isElementInMap(node.parentElement, map);
  }
  return null;
};

const ContextMenu: React.FC<ContextMenuProps> = () => {
  const contextMenuData = useDataTrackStore((state) => state.contextMenuData);
  const elementMap = useManifestStore((state) => state.elementMap);
  const clipboard = useManifestStore((state) => state.clipboard);
  const [open, setOpen] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<IWidgetElementValue | null>(null);

  useEffect(() => {
    if (contextMenuData) {
      const hasElement = isElementInMap(contextMenuData.node, elementMap);
      if (hasElement) {
        setSelectedElement(hasElement);
        setOpen(true);
      }
    }
  }, [contextMenuData, elementMap]);

  const onOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      useDataTrackStore.setState({ contextMenuData: null });
      setSelectedElement(null);
    }
  }, []);

  if (!contextMenuData || !selectedElement) return null;

  return (
    <Menu
      open={open}
      onOpenChange={(_, { open }) => {
        onOpenChange(open);
      }}>
      <MenuTrigger disableButtonEnhancement>
        <div
          key={contextMenuData.node.id}
          style={{
            position: "fixed",
            top: contextMenuData.y,
            left: contextMenuData.x,
          }}
        />
      </MenuTrigger>
      <MenuPopover style={{ top: contextMenuData.y, left: contextMenuData.x }}>
        <MenuList>
          <MenuItem
            icon={<CutRegular />}
            onClick={() => {
              useManifestStore
                .getState()
                .removeElement(selectedElement.id, true);
              useDataTrackStore.setState({ selectedId: null });
            }}>
            Cut
          </MenuItem>
          <MenuItem icon={<CopyRegular />} disabled={!clipboard}>
            Copy
          </MenuItem>
          <MenuItem icon={<ClipboardRegular />}>Paste</MenuItem>
          <MenuItem
            icon={<DeleteRegular />}
            onClick={() => {
              useManifestStore.getState().removeElement(selectedElement.id);
              useDataTrackStore.setState({ selectedId: null });
            }}>
            Delete
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export default ContextMenu;
