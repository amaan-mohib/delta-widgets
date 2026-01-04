import React, { useCallback } from "react";
import { IWidgetElement } from "../../../types/manifest";
import ButtonComponent from "../ButtonComponent";
import { useVariableStore } from "../../stores/useVariableStore";
import { invoke } from "@tauri-apps/api/core";

interface PlayButtonProps {
  component: IWidgetElement;
}

const PlayButton: React.FC<PlayButtonProps> = ({ component }) => {
  const selectedMedia = useVariableStore((state) => state.currentMedia);
  const mediaList = useVariableStore((state) => state.media);
  const currentMedia = mediaList.find((item) => item.is_current_session);

  const isPlaying = currentMedia?.playback_info.status === "playing";
  const isSelectedMediaCurrentSession =
    mediaList.find((item) => item.is_current_session)?.player_id ===
    selectedMedia?.player_id;
  const toggleEnabled =
    !!currentMedia?.playback_info.controls?.toggle_enabled &&
    isSelectedMediaCurrentSession;

  const onToggle = useCallback(async () => {
    if (!currentMedia) return;

    await invoke("media_action", {
      playerId: currentMedia?.player_id,
      action: "toggle",
    }).catch(console.error);
  }, [currentMedia]);

  return (
    <ButtonComponent
      component={{
        ...component,
        data: {
          ...(component.data || {}),
          icon: isPlaying ? "PauseRegular" : "PlayRegular",
        },
      }}
      onClick={onToggle}
      disabled={!toggleEnabled || !currentMedia}
    />
  );
};

export default PlayButton;
