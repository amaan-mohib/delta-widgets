import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Link,
  Tooltip,
} from "@fluentui/react-components";
import { ArrowRight16Regular } from "@fluentui/react-icons";
import React from "react";
import { useManifestStore } from "../../../stores/useManifestStore";
import { IWidget } from "../../../../types/manifest";

const templates = [
  {
    name: "Date Time",
    description: (
      <span>
        A widget that current date and time. Please{" "}
        <Link href="https://date-fns.org/docs/format" target="_blank">
          refer
        </Link>{" "}
        for formatting options.
      </span>
    ),
    image: "/templates/datetime/thumb.png",
    manifest: "/templates/datetime/manifest.json",
  },
  {
    name: "Media",
    description:
      "A widget that displays media being played on the system, such as music or videos.",
    image: "/templates/media/thumb.png",
    manifest: "/templates/media/manifest.json",
  },
  {
    name: "Weather",
    description:
      "A widget that displays current weather information for your current location.",
    image: "/templates/weather/thumb.png",
    manifest: "/templates/weather/manifest.json",
  },
  {
    name: "Disks",
    description:
      "A widget that displays information about the system's disks, including usage and available space.",
    image: "/templates/disks/thumb.png",
    manifest: "/templates/disks/manifest.json",
  },
  {
    name: "RAM",
    description:
      "A widget that displays information about the system's RAM usage, including total and available memory.",
    image: "/templates/ram/thumb.png",
    manifest: "/templates/ram/manifest.json",
  },
  {
    name: "CPU",
    description:
      "A widget that displays information about the system's CPU usage and performance.",
    image: "/templates/cpu/thumb.png",
    manifest: "/templates/cpu/manifest.json",
  },
  {
    name: "Battery",
    description:
      "A widget containing information related to the system's battery.",
    image: "/templates/battery/thumb.png",
    manifest: "/templates/battery/manifest.json",
  },
];

interface WidgetTemplatesProps {}

const WidgetTemplates: React.FC<WidgetTemplatesProps> = () => {
  const handleTemplateUse = async (manifestUrl: string) => {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error("Failed to load template manifest");
    }
    const manifest = (await response.json()) as IWidget;
    useManifestStore.getState().updateManifest({
      elements: manifest.elements,
      dimensions: manifest.dimensions,
    });
  };

  return (
    <div
      style={{
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
      {templates.map((item) => (
        <Card key={item.name} appearance="outline">
          <CardPreview>
            <img src={item.image} alt={item.name} />
          </CardPreview>
          <CardHeader header={item.name}></CardHeader>
          <p>{item.description}</p>
          <CardFooter>
            <Tooltip
              relationship="description"
              content="This action will replace your changes.">
              <Button
                onClick={() => handleTemplateUse(item.manifest)}
                size="small"
                appearance="outline"
                icon={<ArrowRight16Regular />}
                iconPosition="after">
                Use template
              </Button>
            </Tooltip>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default WidgetTemplates;
