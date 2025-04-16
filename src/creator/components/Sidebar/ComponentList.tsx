import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Card,
  makeStyles,
} from "@fluentui/react-components";
import {
  Filmstrip24Regular,
  // ButtonRegular,
  Image24Regular,
  LayoutCellFour24Regular,
  NextRegular,
  PlayCircle24Regular,
  PreviousRegular,
  Square24Regular,
  TextField24Regular,
  VideoPlayPauseRegular,
} from "@fluentui/react-icons";
import React, { ReactNode, useMemo } from "react";
import Draggable from "../Draggable";
import { DragOverlay } from "@dnd-kit/core";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { IWidgetElement } from "../../../types/manifest";
import { nanoid } from "nanoid";
import SliderIcon from "../icons/SliderIcon";

interface ComponentListProps {}

export const components: {
  name: string;
  type: string;
  key: string;
  icon: ReactNode;
  category?: "media" | "date";
  data: () => IWidgetElement;
}[] = [
  {
    name: "Container",
    type: "container",
    key: "flex-container",
    icon: <Square24Regular />,
    data: () => ({
      id: `container-${nanoid(4)}`,
      type: "container",
      styles: {
        display: "flex",
        flex: 1,
        background: "transparent",
        padding: 5,
        width: "100%",
        height: "100%",
      },
      children: [],
    }),
  },
  {
    name: "Grid",
    type: "container-grid",
    key: "grid-container",
    icon: <LayoutCellFour24Regular />,
    data: () => ({
      id: `container-grid-${nanoid(4)}`,
      type: "container-grid",
      styles: {
        display: "grid",
        flex: 1,
        gridSize: {
          rows: "auto",
          columns: 2,
        },
        background: "transparent",
        padding: 5,
        width: "100%",
        height: "100%",
      },
      children: [],
    }),
  },
  {
    name: "Text",
    key: "text",
    type: "text",
    icon: <TextField24Regular />,
    data: () => ({
      id: `text-${nanoid(4)}`,
      type: "text",
      styles: {
        fontSize: "16px",
        lineHeight: "16px",
      },
      data: { text: "Text" },
    }),
  },
  {
    name: "Image",
    key: "image",
    type: "image",
    icon: <Image24Regular />,
    data: () => ({
      id: `image-${nanoid(4)}`,
      type: "image",
      styles: {
        width: "100px",
        height: "100px",
      },
      data: { src: "", alt: "image" },
    }),
  },
  // {
  //   name: "Button",
  //   key: "button",
  //   type: "button",
  //   icon: <ButtonRegular style={{ fontSize: "24px" }} />,
  //   data: () => ({
  //     id: `button-${nanoid(4)}`,
  //     type: "button",
  //     styles: {},
  //     data: { text: "Button" },
  //   }),
  // },
  // {
  //   name: "Slider",
  //   key: "slider",
  //   type: "slider",
  //   icon: <SliderIcon />,
  //   data: () => ({
  //     id: `slider-${nanoid(4)}`,
  //     type: "slider",
  //     styles: {},
  //     data: { min: "0", max: "100", current: "10" },
  //   }),
  // },
  {
    name: "Previous",
    key: "media-prev",
    type: "media-prev",
    category: "media",
    icon: <PreviousRegular style={{ fontSize: "24px" }} />,
    data: () => ({
      id: `button-${nanoid(4)}`,
      type: "media-prev",
      styles: {},
      data: {},
    }),
  },
  {
    name: "Play/Pause",
    key: "toggle-play",
    type: "toggle-play",
    category: "media",
    icon: <VideoPlayPauseRegular style={{ fontSize: "24px" }} />,
    data: () => ({
      id: `button-${nanoid(4)}`,
      type: "toggle-play",
      styles: {},
      data: {},
    }),
  },
  {
    name: "Next",
    key: "media-next",
    type: "media-next",
    category: "media",
    icon: <NextRegular style={{ fontSize: "24px" }} />,
    data: () => ({
      id: `button-${nanoid(4)}`,
      type: "media-next",
      styles: {},
      data: {},
    }),
  },
  {
    name: "Timeline",
    key: "timeline",
    type: "media-slider",
    category: "media",
    icon: <SliderIcon />,
    data: () => ({
      id: `slider-${nanoid(4)}`,
      type: "media-slider",
      styles: {},
      data: {
        min: "0",
        max: "{{media:duration}}",
        current: "{{media:position}}",
      },
    }),
  },
  {
    name: "Player",
    key: "player-switch",
    type: "media-select",
    category: "media",
    icon: <PlayCircle24Regular />,
    data: () => ({
      id: `select-${nanoid(4)}`,
      type: "media-select",
      styles: {},
      data: {
        min: "0",
        max: "{{media:duration}}",
        current: "{{media:position}}",
      },
    }),
  },
  {
    name: "Thumbnail",
    key: "media-image",
    type: "media-image",
    category: "media",
    icon: <Filmstrip24Regular />,
    data: () => ({
      id: `image-${nanoid(4)}`,
      type: "image",
      styles: {
        width: "100px",
        height: "100px",
      },
      data: { src: "{{media:thumbnail}}", alt: "media thumbnail" },
    }),
  },
];

export const componentTypeToDataMap: Record<string, () => IWidgetElement> = {};
Object.values(components).forEach((item) => {
  componentTypeToDataMap[item.type] = item.data;
});

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    // padding: "10px",
  },
  chiclet: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "80px",
    height: "80px",
    userSelect: "none",
  },
});

const ComponentItem: React.FC<{
  itemId?: string;
  item?: (typeof components)[0] | null;
}> = ({ itemId, item }) => {
  const styles = useStyles();
  item =
    item || components.find((component) => component.key === itemId) || null;

  if (!item) return null;
  return (
    <Card className={styles.chiclet} key={item.key}>
      {item.icon}
      {item.name}
    </Card>
  );
};

const categoryGroup = {
  common: "Common",
  media: "Media",
  date: "Date",
};

const ComponentList: React.FC<ComponentListProps> = () => {
  const styles = useStyles();
  const draggingId = useDataTrackStore((state) => state.activeId);
  const groupedComponents = useMemo(() => {
    const grouped = components.reduce((acc, item) => {
      const category = item.category || "common";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof components>);
    return grouped;
  }, []);

  return (
    <div>
      <Accordion
        collapsible
        multiple
        defaultOpenItems={Object.keys(categoryGroup)}>
        {Object.entries(categoryGroup).map(([key, group]) =>
          groupedComponents[key] ? (
            <AccordionItem key={key} value={key}>
              <AccordionHeader>{group}</AccordionHeader>
              <AccordionPanel>
                <div className={styles.container}>
                  {groupedComponents[key].map((item) => (
                    <Draggable
                      dragOverlay
                      id={item.key}
                      key={item.key}
                      data={{ type: item.type }}>
                      <ComponentItem item={item} />
                    </Draggable>
                  ))}
                </div>
              </AccordionPanel>
            </AccordionItem>
          ) : (
            []
          )
        )}
      </Accordion>
      <DragOverlay dropAnimation={null}>
        {draggingId ? <ComponentItem itemId={draggingId} /> : null}
      </DragOverlay>
    </div>
  );
};

export default ComponentList;
