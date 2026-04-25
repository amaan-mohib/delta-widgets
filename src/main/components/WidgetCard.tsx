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
import React, { useEffect } from "react";
import {
  closeWidgetWindow,
  createCreatorWindow,
  createWidgetWindow,
  duplicateWidget,
  openManifestFolder,
  removeWidget,
  toggleAlwaysOnTop,
  togglePinned,
} from "../utils/widgets";
import {
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
import { templateWidgets } from "../../common";
import { useDataStore } from "../stores/useDataStore";
import { useAddDialogStore } from "../stores/useAddDialogStore";

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
  const [visible, setVisible] = React.useState(widget.visible ?? false);
  const [alwaysOnTop, setAlwaysOnTop] = React.useState(
    widget.alwaysOnTop ?? false,
  );
  const [pinned, setPinned] = React.useState(widget.pinned ?? false);

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

  const editWidgetAction = async () => {
    if (widget.key in templateWidgets) {
      if (widget.visible || visible) {
        await closeWidgetWindow(`widget-${widget.key}`, true, widget.path);
        setVisible(false);
      }
      const newManifest = await duplicateWidget(widget.path, false, true);
      if (newManifest) {
        if (widget.visible || visible) {
          await createWidgetWindow(newManifest.path, false, true);
        }
        await editWidget(newManifest);
      }
      return;
    }
    await editWidget(widget);
  };

  const showRefreshThumbnail =
    widget.widgetType === "json" && visible && !(widget.key in templateWidgets);

  return (
    <Card
      role="listitem"
      key={widget.key}
      className={cardStyle}
      onClick={
        saves
          ? () => {
              createCreatorWindow(widget.path);
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
                <MenuItem
                  icon={<CopyRegular />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await duplicateWidget(widget.path, !!saves);
                    updateAllWidgets();
                  }}>
                  {saves ? "Clone" : "Duplicate"}
                </MenuItem>
                {!saves && widget.widgetType === "json" && (
                  <MenuItem
                    icon={<EditRegular />}
                    onClick={async (e) => {
                      e.stopPropagation();
                      editWidgetAction();
                    }}>
                    Edit
                  </MenuItem>
                )}
                {!saves && widget.widgetType === "url" && (
                  <MenuItem
                    icon={<EditRegular />}
                    onClick={(e) => {
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
                    }}>
                    Edit
                  </MenuItem>
                )}
                {!saves && widget.widgetType === "html" && (
                  <MenuItem
                    icon={<EditRegular />}
                    onClick={(e) => {
                      e.stopPropagation();
                      importHTML(widget);
                    }}>
                    Edit
                  </MenuItem>
                )}
                {widget.key in templateWidgets ? null : (
                  <MenuItem
                    icon={<DeleteRegular />}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await removeWidget(widget.path, widget);
                      updateAllWidgets();
                    }}>
                    Remove
                  </MenuItem>
                )}
                <MenuItem
                  icon={<FolderRegular />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    openManifestFolder(widget.path);
                  }}>
                  Show manifest
                </MenuItem>
                {!saves && (
                  <>
                    {showRefreshThumbnail && (
                      <MenuItem
                        icon={<ImageArrowCounterclockwiseRegular />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await emitTo(`widget-${widget.key}`, "update-thumb", {
                            key: widget.key,
                          });
                        }}>
                        Refresh thumbnail
                      </MenuItem>
                    )}
                    {widget.widgetType !== "html" && (
                      <MenuItem
                        icon={pinned ? <PinOffRegular /> : <PinRegular />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await togglePinned(widget.path, !pinned);
                          setPinned((prev) => !prev);
                        }}>
                        {pinned ? "Unpin" : "Pin"}
                      </MenuItem>
                    )}
                    <MenuItem
                      icon={alwaysOnTop ? <CheckmarkRegular /> : undefined}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await toggleAlwaysOnTop(widget.path, !alwaysOnTop);
                        setAlwaysOnTop((prev) => !prev);
                      }}>
                      Always on Top
                    </MenuItem>
                  </>
                )}
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
            <Button icon={<EditRegular />} />
            <Button
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
