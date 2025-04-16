import React from "react";
import { IWidgetElement } from "../../../types/manifest";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import { Buffer } from "buffer";
import { useVariableStore } from "../../stores/useVariableStore";
import { IMedia } from "../../types/variables";
import { PlayCircle20Regular } from "@fluentui/react-icons";

interface MediaSelectProps {
  component: IWidgetElement;
}

const getImage = (
  buffer: number[],
  size?: { width: string; height: string }
) => {
  return buffer.length > 0 ? (
    <img
      style={size || { width: "35px", height: "35px" }}
      src={`data:image/png;base64,${Buffer.from(buffer).toString("base64")}`}
      alt="media icon"
    />
  ) : (
    <PlayCircle20Regular />
  );
};

const getName = (item: IMedia | null) => {
  return item?.player.name || item?.player_id || "No media";
};

const MediaSelect: React.FC<MediaSelectProps> = ({ component }) => {
  const mediaList = useVariableStore((state) => state.media);
  const currentMedia = useVariableStore((state) => state.currentMedia);
  const imageSize =
    (component.data?.size || "medium") !== "large" ? "50px" : "70px";

  const onChange = (currentMedia: IMedia) => {
    useVariableStore.setState({ currentMedia });
  };

  return mediaList.length <= 1 ? (
    <Button
      icon={getImage(currentMedia?.player?.icon || [], {
        width: imageSize,
        height: imageSize,
      })}
      id={`${component.id}-child`}
      appearance={component.data?.type || "secondary"}
      shape={component.data?.shape || "rounded"}
      size={component.data?.size || "medium"}
      disabled={mediaList.length === 0}>
      {getName(currentMedia)}
    </Button>
  ) : (
    <Menu positioning={{ autoSize: true }} hasIcons>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          icon={getImage(currentMedia?.player?.icon || [], {
            width: imageSize,
            height: imageSize,
          })}
          id={`${component.id}-child`}
          appearance={component.data?.type || "secondary"}
          shape={component.data?.shape || "rounded"}
          size={component.data?.size || "medium"}
          disabled={mediaList.length === 0}>
          {getName(currentMedia)}
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {mediaList.map((item) => (
            <MenuItem
              onClick={() => {
                onChange(item);
              }}
              icon={getImage(item?.player?.icon || [])}
              key={item.player_id}>
              {getName(item)}
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export default MediaSelect;
