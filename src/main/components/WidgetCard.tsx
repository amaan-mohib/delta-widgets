import {
  Badge,
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
import React, { ReactNode, useEffect, useRef, useState } from "react";
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
  ArrowCircleUpRegular,
  ArrowClockwiseRegular,
  ArrowUploadRegular,
  CheckmarkRegular,
  CopyRegular,
  DeleteRegular,
  EditRegular,
  FolderRegular,
  ImageArrowCounterclockwiseRegular,
  MoreHorizontal20Regular,
  OpenRegular,
  PinOffRegular,
  PinRegular,
  RenameRegular,
} from "@fluentui/react-icons";
import { ILiteWidget } from "../../common/types/manifest";
import { sendMixpanelEvent } from "../../common/analytics";
import WidgetPreview from "./WidgetPreview";
import { emitTo } from "@tauri-apps/api/event";
import { closeWidgetWindow, isBuiltIn, templateWidgets } from "../../common";
import { useDataStore } from "../stores/useDataStore";
import { useAddDialogStore } from "../stores/useAddDialogStore";
import { message } from "@tauri-apps/plugin-dialog";
import { commands } from "../../common/commands";

interface WidgetCardProps {
  widget: ILiteWidget;
  saves?: boolean;
  focusWidget?: string | null;
  hasUpdate?: boolean;
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
  saves,
  focusWidget,
  hasUpdate,
}) => {
  const styles = useStyles();
  const loading = useDataStore((state) => state.openingCreator);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const { setDialogState, importHTML } = useAddDialogStore();
  const cardRef = useRef<HTMLDivElement>(null);

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
    if (saves || focusWidget !== widget.key || !cardRef.current) return;
    cardRef.current.scrollIntoView({ behavior: "smooth" });
  }, [focusWidget]);

  const menuItems: {
    key: string;
    icon: MenuItemProps["icon"];
    onClick: MenuItemProps["onClick"];
    children: ReactNode;
    condition?: boolean;
  }[] = [
    {
      key: "publish-gallery",
      icon: <ArrowUploadRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await commands.createGalleryWindow({
          url: `/dashboard/upload?key=${widget.key}`,
        });
      },
      children: "Publish to Gallery",
      condition: !saves && !widget.isGalleryWidget && !isBuiltIn(widget),
    },
    {
      key: "view-gallery",
      icon: hasUpdate ? <ArrowCircleUpRegular /> : <OpenRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await commands.createGalleryWindow({ url: `/widget/${widget.key}` });
      },
      children: hasUpdate ? "Update" : "View Details",
      condition: !saves && widget.isGalleryWidget,
    },
    {
      key: "duplicate",
      icon: <CopyRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await duplicateWidget(widget.path, !!saves);
        await useDataStore.getState().updateAllWidgets();
      },
      children: saves ? "Clone" : "Duplicate",
      condition: true,
    },
    {
      key: "edit-json",
      icon: <EditRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await editWidgetAction();
      },
      children: "Edit",
      condition: widget.isGalleryWidget
        ? false
        : !saves && widget.widgetType === "json",
    },
    {
      key: "rename-json",
      icon: <RenameRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        useDataStore.setState({ renameWidget: widget });
      },
      children: "Rename",
      condition:
        !saves &&
        widget.widgetType === "json" &&
        !isBuiltIn(widget) &&
        !widget.isGalleryWidget,
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
      condition: widget.isGalleryWidget
        ? false
        : !saves && widget.widgetType === "url",
    },
    {
      key: "edit-html",
      icon: <EditRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await importHTML(widget);
      },
      children: "Edit",
      condition: widget.isGalleryWidget
        ? false
        : !saves && widget.widgetType === "html",
    },
    {
      key: "remove",
      icon: <DeleteRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        await removeWidget(widget.path, widget);
        await useDataStore.getState().updateAllWidgets();
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
        const label = `widget-${widget.key}`;
        if (widget.widgetType === "json") {
          await emitTo(label, "update-thumb", {
            key: widget.key,
          });
        }
        if (widget.widgetType === "html") {
          setWidgetLoading(true);
          await commands
            .captureWidgetScreenshot({
              label,
              manifestPath: widget.path,
              refresh: true,
            })
            .catch(console.error);
          await emitTo("main", "creator-close", {});
          setWidgetLoading(false);
        }
      },
      children: "Refresh thumbnail",
      condition:
        !saves &&
        widget.widgetType !== "url" &&
        widget.visible &&
        !(widget.key in templateWidgets),
    },
    {
      key: "pin",
      icon: widget.pinned ? <PinOffRegular /> : <PinRegular />,
      onClick: async (e) => {
        e.stopPropagation();
        try {
          await togglePinned(widget.path, !widget.pinned);
          useDataStore
            .getState()
            .updateInstalledWidget(widget.key, { pinned: !widget.pinned });
        } catch (error) {
          await message("Could not set pinned", {
            title: "Error",
            kind: "error",
          });
        }
      },
      children: widget.pinned ? "Unpin" : "Pin",
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
      condition: !saves && widget.widgetType === "html" && widget.visible,
    },
    {
      key: "always-on-top",
      icon: widget.alwaysOnTop ? <CheckmarkRegular /> : undefined,
      onClick: async (e) => {
        e.stopPropagation();
        try {
          await toggleAlwaysOnTop(widget.path, !widget.alwaysOnTop);
          useDataStore.getState().updateInstalledWidget(widget.key, {
            alwaysOnTop: !widget.alwaysOnTop,
          });
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
    setWidgetLoading(true);
    if (checked) {
      await createWidgetWindow(widget.path, false, true);

      sendMixpanelEvent("widget_enabled", {
        label: widget.label,
        widgetType: widget.widgetType,
      }).catch(console.error);

      if (!widget.alwaysOnTop) {
        notify();
      }
    } else {
      await closeWidgetWindow(`widget-${widget.key}`, true, widget.path);
      dismissToast(widget.key);
    }
    setWidgetLoading(false);
    useDataStore
      .getState()
      .updateInstalledWidget(widget.key, { visible: checked });
  };

  const refreshHTML = async () => {
    await closeWidgetWindow(`widget-${widget.key}`, false, widget.path);
    await createWidgetWindow(widget.path, false, false);
  };

  const editWidgetAction = async () => {
    if (widget.key in templateWidgets) {
      const wasVisible = widget.visible;
      if (wasVisible) {
        await closeWidgetWindow(`widget-${widget.key}`, true, widget.path);
        useDataStore
          .getState()
          .updateInstalledWidget(widget.key, { visible: false });
      }
      const newManifest = await duplicateWidget(widget.path, false, true);
      if (!newManifest) {
        return;
      }
      if (wasVisible) {
        await createWidgetWindow(newManifest.path, false, true);
      }
      await useDataStore.getState().editWidget(newManifest);
    } else {
      await useDataStore.getState().editWidget(widget);
    }
  };

  return (
    <Card
      ref={cardRef}
      role="listitem"
      style={{
        minHeight: "180px",
        height: "100%",
        filter: focusWidget === widget.key ? "brightness(180%)" : undefined,
      }}
      key={widget.key}
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
        description={
          widget.isGalleryWidget ? (
            <Badge
              icon={hasUpdate ? <ArrowCircleUpRegular /> : null}
              appearance="outline"
              style={{ marginLeft: -4, marginTop: 4 }}>
              {hasUpdate ? "Update Available" : "From Gallery"}
            </Badge>
          ) : null
        }
      />
      <CardPreview style={{ height: "100%", minHeight: 100 }}>
        <WidgetPreview widget={widget} isDraft={saves} />
      </CardPreview>
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
                await useDataStore.getState().updateAllWidgets();
              }}
            />
          </>
        ) : (
          <Switch
            disabled={widgetLoading}
            className={styles.switch}
            label={widget.visible ? "Enabled" : "Disabled"}
            style={{ margin: 0 }}
            checked={widget.visible}
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
