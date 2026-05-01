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
import { useVariableStore } from "../../stores/useVariableStore";
import { IMedia } from "../../types/variables";
import { PlayCircle20Regular } from "@fluentui/react-icons";
import { convertFileSrc } from "@tauri-apps/api/core";

interface MediaSelectProps {
  component: IWidgetElement;
}

const getImage = (
  player: IMedia["player"],
  size?: { width: string; height: string },
) => {
  return player && player.icon.length > 0 ? (
    <img
      style={{
        ...(size || {
          width: player.is_uwp ? 45 : 38,
          height: player.is_uwp ? 45 : 38,
        }),
        objectFit: "contain",
        objectPosition: "center",
        ...(player.is_uwp ? {} : { padding: size ? 16 : 10 }),
      }}
      src={convertFileSrc(player.icon)}
      alt="media icon"
    />
  ) : (
    <PlayCircle20Regular />
  );
};

const getName = (item: IMedia | null) => {
  return item?.player?.name || item?.player_id || "No media";
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
      icon={getImage(currentMedia?.player, {
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
          className="media-btn-player-icon"
          icon={getImage(currentMedia?.player, {
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
              className="media-item-player-icon"
              onClick={() => {
                onChange(item);
              }}
              icon={getImage(item?.player)}
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
