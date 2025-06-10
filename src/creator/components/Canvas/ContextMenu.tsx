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
import { useToolbarActions } from "./hooks/useToolbarActions";

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
  const [open, setOpen] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<IWidgetElementValue | null>(null);
  const actions = useToolbarActions(selectedElement);

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

  if (!contextMenuData || !selectedElement || actions.length === 0) return null;

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
          {actions.map((item) => (
            <MenuItem
              key={item.label}
              disabled={!item.enabled}
              icon={item.icon}
              onClick={item.onClick}>
              {item.label}
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export default ContextMenu;
