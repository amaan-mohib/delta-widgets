import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  makeStyles,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemProps,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Switch,
  Text,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import React, { ReactNode, useEffect, useState } from "react";
import {
  createCreatorWindow,
  createWidgetWindow,
  duplicateWidget,
  openManifestFolder,
  removeWidget,
  toggleAlwaysOnTop,
  togglePinned,
} from "../utils/widgets";
import {
  ArrowClockwiseRegular,
  CheckmarkRegular,
  CopyRegular,
  DeleteRegular,
  EditRegular,
  FolderRegular,
  ImageArrowCounterclockwiseRegular,
  MoreHorizontal20Regular,
  PinOffRegular,
  PinRegular,
} from "@fluentui/react-icons";
import { ILiteWidget } from "../../types/manifest";
import { sendMixpanelEvent } from "../utils/analytics";
import WidgetPreview from "./WidgetPreview";
import { emitTo } from "@tauri-apps/api/event";
import { closeWidgetWindow, templateWidgets } from "../../common";
import { useDataStore } from "../stores/useDataStore";
import { useAddDialogStore } from "../stores/useAddDialogStore";
import { message } from "@tauri-apps/plugin-dialog";

interface WidgetCardProps {
  widget: ILiteWidget;
  cardStyle: string;
  saves?: boolean;
}

const useStyles = makeStyles({
  cardFooter: {
    marginTop: "auto",
  },
  switch: {
    marginLeft: "0px",
  },
});

const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  cardStyle,
  saves,
}) => {
  const styles = useStyles();
  const [visible, setVisible] = useState(widget.visible ?? false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(widget.alwaysOnTop ?? false);
  const [pinned, setPinned] = useState(widget.pinned ?? false);
  const loading = useDataStore((state) => state.openingCreator);

  const { updateAllWidgets, editWidget } = useDataStore();
  const { setDialogState, importHTML } = useAddDialogStore();

  const { dispatchToast, dismissToast } = useToastController("toaster");
  const notify = () =>
    dispatchToast(
      <Toast>
        <ToastTitle>Enabled {widget.label}</ToastTitle>
        <ToastBody>
          Widget enabled. You'll find it at the bottom of all windows.
        </ToastBody>
      </Toast>,
      { toastId: widget.key, intent: "info" },
    );

  useEffect(() => {
    setVisible(widget.visible ?? false);
    setPinned(widget.pinned ?? false);
  }, [widget]);

  const menuItems: {
    key: string;
    icon: MenuItemProps["icon"];
    onClick: MenuItemProps["onClick"];
    children: ReactNode;
    condition?: boolean;
  }[] = [
    {
      key: "duplicate",
      icon: <CopyRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await duplicateWidget(widget.path, !!saves);
        updateAllWidgets();
      },
      children: saves ? "Clone" : "Duplicate",
      condition: true,
    },
    {
      key: "edit-json",
      icon: <EditRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        editWidgetAction();
      },
      children: "Edit",
      condition: !saves && widget.widgetType === "json",
    },
    {
      key: "edit-url",
      icon: <EditRegular />,
      onClick: (e) => {
        e.stopPropagation();
        setDialogState({
          open: true,
          type: "url",
          path: widget.path,
          existingManifest: {
            label: widget.label,
            url: widget.url,
            key: widget.key,
            widgetType: "url",
            path: widget.path,
          },
          manifest: null,
        });
      },
      children: "Edit",
      condition: !saves && widget.widgetType === "url",
    },
    {
      key: "edit-html",
      icon: <EditRegular />,
      onClick: (e) => {
        e.stopPropagation();
        importHTML(widget);
      },
      children: "Edit",
      condition: !saves && widget.widgetType === "html",
    },
    {
      key: "remove",
      icon: <DeleteRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await removeWidget(widget.path, widget);
        updateAllWidgets();
      },
      children: "Remove",
      condition: !(widget.key in templateWidgets),
    },
    {
      key: "show-manifest",
      icon: <FolderRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        openManifestFolder(widget.path);
      },
      children: "Show manifest",
      condition: true,
    },
    {
      key: "refresh-thumbnail",
      icon: <ImageArrowCounterclockwiseRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await emitTo(`widget-${widget.key}`, "update-thumb", {
          key: widget.key,
        });
      },
      children: "Refresh thumbnail",
      condition:
        !saves &&
        widget.widgetType === "json" &&
        visible &&
        !(widget.key in templateWidgets),
    },
    {
      key: "pin",
      icon: pinned ? <PinOffRegular /> : <PinRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        try {
          await togglePinned(widget.path, !pinned);
          setPinned((prev) => !prev);
        } catch (error) {
          await message("Could not set pinned", {
            title: "Error",
            kind: "error",
          });
        }
      },
      children: pinned ? "Unpin" : "Pin",
      condition: !saves && widget.widgetType !== "html",
    },
    {
      key: "refresh-html",
      icon: <ArrowClockwiseRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await refreshHTML();
      },
      children: "Refresh",
      condition: !saves && widget.widgetType === "html" && visible,
    },
    {
      key: "always-on-top",
      icon: alwaysOnTop ? <CheckmarkRegular /> : undefined,
      onClick: async (e) => {
        e.stopPropagation();
        try {
          await toggleAlwaysOnTop(widget.path, !alwaysOnTop);
          setAlwaysOnTop((prev) => !prev);
        } catch (error) {
          await message("Could not set always on top", {
            title: "Error",
            kind: "error",
          });
        }
      },
      children: "Always on Top",
      condition: !saves,
    },
  ];

  const toggleWidget = async (checked: boolean) => {
    if (checked) {
      await createWidgetWindow(widget.path, false, true);

      sendMixpanelEvent("widget_enabled", {
        label: widget.label,
        widgetType: widget.widgetType,
      }).catch(console.error);

      if (!alwaysOnTop) {
        notify();
      }
    } else {
      await closeWidgetWindow(`widget-${widget.key}`, true, widget.path);
      dismissToast(widget.key);
    }
    setVisible(checked);
  };

  const refreshHTML = async () => {
    await closeWidgetWindow(`widget-${widget.key}`, false, widget.path);
    await createWidgetWindow(widget.path, false, false);
  };

  const editWidgetAction = async () => {
    if (widget.key in templateWidgets) {
      const wasVisible = visible;
      if (wasVisible) {
        await closeWidgetWindow(`widget-${widget.key}`, true, widget.path);
        setVisible(false);
      }
      const newManifest = await duplicateWidget(widget.path, false, true);
      if (!newManifest) {
        return;
      }
      if (wasVisible) {
        await createWidgetWindow(newManifest.path, false, true);
      }
      await editWidget(newManifest);
    }
    await editWidget(widget);
  };

  return (
    <Card
      role="listitem"
      key={widget.key}
      className={cardStyle}
      disabled={loading}
      onClick={
        saves
          ? async () => {
              try {
                useDataStore.setState({ openingCreator: true });
                await createCreatorWindow(widget.path);
              } finally {
                useDataStore.setState({ openingCreator: false });
              }
            }
          : undefined
      }>
      <CardHeader
        action={
          <Menu positioning={"below-end"} hasIcons>
            <MenuTrigger disableButtonEnhancement>
              <MenuButton
                onClick={(e) => e.stopPropagation()}
                size="small"
                appearance="subtle"
                icon={<MoreHorizontal20Regular />}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {menuItems
                  .filter((item) => item.condition)
                  .map((item) => (
                    <MenuItem
                      key={item.key}
                      icon={item.icon}
                      onClick={item.onClick}>
                      {item.children}
                    </MenuItem>
                  ))}
              </MenuList>
            </MenuPopover>
          </Menu>
        }
        header={
          <Text weight="semibold" style={{ wordBreak: "break-all" }}>
            {widget.label}
          </Text>
        }
      />
      <CardPreview style={{ height: "100%", minHeight: 100 }}>
        <WidgetPreview widget={widget} isDraft={saves} />
      </CardPreview>
      {widget.description && <p>{widget.description}</p>}
      <CardFooter className={styles.cardFooter}>
        {saves ? (
          <>
            <Button disabled={loading} icon={<EditRegular />} />
            <Button
              disabled={loading}
              icon={<DeleteRegular />}
              onClick={async (e) => {
                e.stopPropagation();
                await removeWidget(widget.path);
                updateAllWidgets();
              }}
            />
          </>
        ) : (
          <Switch
            className={styles.switch}
            label={visible ? "Enabled" : "Disabled"}
            style={{ margin: 0 }}
            checked={visible}
            indicator={{ className: styles.switch }}
            onChange={(_, { checked }) => {
              toggleWidget(checked);
            }}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default WidgetCard;
