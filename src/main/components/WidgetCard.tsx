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
import React from "react";
import {
  closeWidgetWindow,
  createCreatorWindow,
  createWidgetWindow,
  duplicateWidget,
  openManifestFolder,
  removeWidget,
  toggleAlwaysOnTop,
} from "../utils/widgets";
import {
  CheckmarkRegular,
  CopyRegular,
  DeleteRegular,
  EditRegular,
  FolderRegular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { IWidget } from "../../types/manifest";
import { sendMixpanelEvent } from "../utils/analytics";
import WidgetPreview, { templateWidgets } from "./WidgetPreview";

interface WidgetCardProps {
  widget: IWidget;
  cardStyle: string;
  saves?: boolean;
  updateAllWidgets: () => void;
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
  updateAllWidgets,
}) => {
  const styles = useStyles();
  const [visible, setVisible] = React.useState(widget.visible ?? false);
  const [alwaysOnTop, setAlwaysOnTop] = React.useState(
    widget.alwaysOnTop ?? false
  );
  const { dispatchToast, dismissToast } = useToastController("toaster");
  const notify = () =>
    dispatchToast(
      <Toast>
        <ToastTitle>Enabled {widget.label}</ToastTitle>
        <ToastBody>
          Widget enabled. You'll find it at the bottom of all windows.
        </ToastBody>
      </Toast>,
      { toastId: widget.key, intent: "info" }
    );

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
                    await duplicateWidget(widget, saves).catch(console.log);
                    updateAllWidgets();
                  }}>
                  {saves ? "Clone" : "Duplicate"}
                </MenuItem>
                {widget.key in templateWidgets ? null : (
                  <MenuItem
                    icon={<DeleteRegular />}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await removeWidget(widget.path);
                      updateAllWidgets();
                    }}>
                    Remove
                  </MenuItem>
                )}
                <MenuItem
                  icon={<FolderRegular />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    openManifestFolder(widget);
                  }}>
                  Show manifest
                </MenuItem>
                {!saves && (
                  <MenuItem
                    icon={alwaysOnTop ? <CheckmarkRegular /> : undefined}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await toggleAlwaysOnTop(widget.path, !alwaysOnTop);
                      setAlwaysOnTop((prev) => !prev);
                    }}>
                    Always on Top
                  </MenuItem>
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
            onChange={async (_, { checked }) => {
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
                await closeWidgetWindow(
                  `widget-${widget.key}`,
                  true,
                  widget.path
                );
                dismissToast(widget.key);
              }
              setVisible(checked);
            }}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default WidgetCard;
