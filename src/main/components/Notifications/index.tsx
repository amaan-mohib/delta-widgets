import React from "react";
import {
  Body1Strong,
  Button,
  Caption1,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Text,
} from "@fluentui/react-components";
import { useDataStore } from "../../stores/useDataStore";
import { commands } from "../../../common/commands";

interface NotificationsProps {}

const Notifications: React.FC<NotificationsProps> = () => {
  const open = useDataStore((state) => state.openNotifications);
  const notifications = useDataStore((state) => state.notifications);

  const setOpen = (open: boolean) => {
    useDataStore.setState({ openNotifications: open });
  };

  const onClose = async () => {
    const date = new Date(notifications[0].created_at).toISOString();
    await commands.writeToStoreCmd({
      pairs: [{ key: "lastSeenNotificationAt", value: date }],
    });
    useDataStore.setState({ lastSeenNotificationAt: date });
    setOpen(false);
  };

  const onItemClick = async (link: string) => {
    try {
      const parsedUrl = new URL(link);
      const allowedHosts = new Set([
        "gallery.deltawidgets.com",
        "delta-widgets-marketplace.vercel.app",
      ]);
      if (
        parsedUrl.protocol === "https:" &&
        allowedHosts.has(parsedUrl.hostname)
      ) {
        await commands.createGalleryWindow({
          url: `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`,
        });
      } else {
        window.open(link);
      }
    } catch {
      window.open(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Notifications</DialogTitle>
          <DialogContent
            style={{ maxHeight: "calc(100vh - 195px)", overflow: "auto" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: 10,
              }}>
              {notifications.map((item) => (
                <Card
                  size="small"
                  key={item.id}
                  appearance="outline"
                  onClick={
                    item.link ? () => onItemClick(item.link!) : undefined
                  }>
                  <CardHeader
                    header={<Body1Strong>{item.title}</Body1Strong>}
                    description={
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}>
                        <Text>{item.message}</Text>
                        <Caption1 italic>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Caption1>
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          </DialogContent>
        </DialogBody>
        <DialogActions style={{ paddingTop: "1rem" }}>
          <Button appearance="primary" onClick={onClose}>
            Done
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default Notifications;
