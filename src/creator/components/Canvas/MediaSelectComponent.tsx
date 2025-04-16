import { Button } from "@fluentui/react-components";
import React from "react";
import { IWidgetElement } from "../../../types/manifest";
import { ChevronDownRegular } from "@fluentui/react-icons";

interface MediaSelectComponentProps {
  component: IWidgetElement;
}

const MediaSelectComponent: React.FC<MediaSelectComponentProps> = ({
  component,
}) => {
  return (
    <Button
      style={component.data?.full ? { width: "100%" } : {}}
      appearance={component.data?.type || "secondary"}
      shape={component.data?.shape || "rounded"}
      size={component.data?.size || "medium"}
      id={`${component.id}-child`}
      iconPosition="after"
      icon={<ChevronDownRegular />}>
      Media player
    </Button>
  );
};

export default MediaSelectComponent;
