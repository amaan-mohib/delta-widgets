import React from "react";
import {
  Body1,
  Button,
  Caption1,
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
import { openUrl } from "@tauri-apps/plugin-opener";

interface DonationBoxProps {}

const DonationBox: React.FC<DonationBoxProps> = () => {
  const open = useDataStore((state) => state.openDonationBox);

  const setOpen = (open: boolean) => {
    useDataStore.setState({ openDonationBox: open });
  };

  const onClose = async (clicked = false) => {
    if (clicked) {
      await openUrl("https://delta-widgets.vercel.app/#sponsor");
    }
    await commands.writeToStoreCmd({
      pairs: clicked
        ? [{ key: "didClickDonate", value: true }]
        : [{ key: "lastSeenDonationAt", value: new Date().toISOString() }],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Enjoying Delta Widgets?</DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: 10,
                marginTop: 10,
              }}>
              <Text>Help us keep Delta Widgets growing!</Text>
              <Text>
                Building and maintaining a desktop app takes time and resources,
                from development and infrastructure to hosting updates,
                maintaining services, and improving the overall experience.
              </Text>
              <Body1>
                If Delta Widgets has made your desktop experience a little
                better, consider supporting its continued development with a
                small contribution.
              </Body1>
              <Body1>
                Every coffee helps us build new features, fix bugs, and keep
                making Delta Widgets better for everyone!
              </Body1>
              <Caption1 italic>
                Completely optional. Thanks for being part of the Delta Widgets
                community!
              </Caption1>
            </div>
          </DialogContent>
        </DialogBody>
        <DialogActions style={{ paddingTop: "1rem" }}>
          <Button appearance="subtle" onClick={() => onClose()}>
            Maybe later
          </Button>
          <Button appearance="primary" onClick={() => onClose(true)}>
            Buy us a coffee
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default DonationBox;
