import {
  Button,
  Caption1,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Text,
  tokens,
} from "@fluentui/react-components";
import {
  AppsAddInRegular,
  AppsRegular,
  CodeRegular,
  Dismiss24Regular,
  DocumentArrowDownRegular,
  GridRegular,
  LinkRegular,
} from "@fluentui/react-icons";
import { useDataStore } from "../../stores/useDataStore";
import { useAddDialogStore } from "../../stores/useAddDialogStore";
import { commands } from "../../../common/commands";
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

interface AddMenuProps {}

const createItems = [
  {
    title: "Custom",
    description: "Custom widget using drag-n-drop builder",
    icon: <AppsRegular fontSize="32px" />,
    value: "custom",
  },
  {
    title: "HTML",
    description: "Import a folder containing web assets",
    icon: <CodeRegular fontSize="32px" />,
    value: "html",
  },
  {
    title: "URL",
    description: "Embed any website or web app from a URL",
    icon: <LinkRegular fontSize="32px" />,
    value: "url",
  },
  {
    title: "Gallery",
    description: "Browse ready-to-use widgets",
    icon: <GridRegular fontSize="32px" />,
    value: "gallery",
  },
  {
    title: "Import",
    description: "Import a widget using a manifest file",
    icon: <DocumentArrowDownRegular fontSize="32px" />,
    value: "import",
  },
];

const AddMenu: React.FC<AddMenuProps> = () => {
  const {
    importHTML,
    importJSON,
    setDialogState,
    openCreateMenu,
    setOpenCreateMenu,
  } = useAddDialogStore();
  const createWidget = useDataStore((state) => state.createWidget);

  useEffect(() => {
    const unsub = listen("create", () => {
      setOpenCreateMenu(true);
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  const handleClick = async (value: string) => {
    switch (value) {
      case "custom":
        createWidget();
        break;
      case "html":
        importHTML();
        break;
      case "url":
        setDialogState({ open: true, type: "url", path: "" });
        break;
      case "import":
        importJSON();
        break;
      case "gallery":
        await commands.createGalleryWindow();
        break;
      default:
        break;
    }
    setOpenCreateMenu(false);
  };

  return (
    <Dialog
      open={openCreateMenu}
      onOpenChange={(_, { open }) => setOpenCreateMenu(open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<AppsAddInRegular />}>
          Create New
        </Button>
      </DialogTrigger>
      <DialogSurface aria-describedby={undefined}>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger action="close">
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<Dismiss24Regular />}
                />
              </DialogTrigger>
            }>
            Create New Widget
          </DialogTitle>
          <DialogContent>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, 150px)",
                gap: "16px",
                marginTop: "16px",
              }}>
              {createItems.map((item) => (
                <Card
                  appearance="filled-alternative"
                  style={{
                    justifyContent: "center",
                    minHeight: "150px",
                    height: "100%",
                  }}
                  onClick={() => {
                    handleClick(item.value);
                  }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: "3px",
                    }}>
                    {item.icon}
                    <Text weight="semibold" style={{ marginTop: 5 }}>
                      {item.title}
                    </Text>
                    <Caption1
                      align="center"
                      style={{
                        color: tokens.colorNeutralForeground2,
                      }}>
                      {item.description}
                    </Caption1>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AddMenu;
