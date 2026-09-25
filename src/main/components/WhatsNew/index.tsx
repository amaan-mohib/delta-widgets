import React, { useEffect, useMemo, useState } from "react";
import { CHANGELOG } from "./data";
import {
  Body2,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Image,
  Tab,
  TabList,
  Text,
  Title3,
  tokens,
} from "@fluentui/react-components";
import { useDataStore } from "../../stores/useDataStore";
import { commands } from "../../../common/commands";

interface WhatsNewProps {}

const WhatsNew: React.FC<WhatsNewProps> = () => {
  const [selectedVersion, setSelectedVersion] = useState("");
  const open = useDataStore((state) => state.openWhatsNew);
  const version = useDataStore((state) => state.version);
  const lastSeenVersion = useDataStore((state) => state.lastSeenVersion);

  const changelogItems = useMemo(
    () =>
      CHANGELOG.find((item) => item.version === selectedVersion)?.items || [],
    [selectedVersion],
  );

  const setOpen = (open: boolean) => {
    useDataStore.setState({ openWhatsNew: open });
  };

  useEffect(() => {
    if (version !== lastSeenVersion) {
      setOpen(true);
    }
    setSelectedVersion(CHANGELOG[0].version);
  }, [version, lastSeenVersion]);

  const onClose = async () => {
    if (version !== lastSeenVersion) {
      await commands.writeToStoreCmd({
        pairs: [{ key: "lastSeenVersion", value: version }],
      });
      useDataStore.setState({ lastSeenVersion: version });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogSurface
        aria-label="Whats new"
        style={{ maxWidth: "calc(100vw - 64px)" }}>
        <DialogBody>
          <DialogTitle>What's New</DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "flex",
                width: "100%",
                position: "relative",
                height: "calc(100vh - 195px)",
                overflow: "auto",
              }}>
              <div
                style={{
                  display: "flex",
                  position: "sticky",
                  top: 0,
                  width: 120,
                  overflow: "auto",
                  borderRightWidth: tokens.strokeWidthThin,
                  borderRightStyle: "solid",
                  borderRightColor: tokens.colorNeutralStroke2,
                }}>
                <TabList
                  style={{
                    flex: 1,
                  }}
                  selectedValue={selectedVersion}
                  vertical
                  onTabSelect={(_, { value }) =>
                    setSelectedVersion(value as string)
                  }>
                  {CHANGELOG.map((item) => (
                    <Tab key={item.version} value={item.version}>
                      v{item.version}
                    </Tab>
                  ))}
                </TabList>
              </div>
              <div style={{ flex: 1, padding: "0 1rem" }}>
                <Title3>v{selectedVersion}</Title3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}>
                  {changelogItems.map((item) => (
                    <div
                      key={item.title}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}>
                      {item.image && (
                        <Image
                          src={item.image}
                          width={480}
                          style={{ borderRadius: 8 }}
                        />
                      )}
                      <Body2 style={{ fontWeight: 600 }}>{item.title}</Body2>
                      {typeof item.description === "string" ? (
                        <Text>{item.description}</Text>
                      ) : (
                        item.description
                      )}
                    </div>
                  ))}
                </div>
              </div>
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

export default WhatsNew;
