import React, { useCallback } from "react";
import { IWidgetElement } from "../../../types/manifest";
import ButtonComponent from "../ButtonComponent";
import { useVariableStore } from "../../stores/useVariableStore";
import { invoke } from "@tauri-apps/api/core";

interface PlayButtonProps {
  component: IWidgetElement;
}

const PlayButton: React.FC<PlayButtonProps> = ({ component }) => {
  const currentMedia = useVariableStore((state) => state.currentMedia);
  const isPlaying = currentMedia?.playback_info.status === "playing";
  const toggleEnabled = !!currentMedia?.playback_info.controls?.toggle_enabled;

  const onToggle = useCallback(async () => {
    if (!currentMedia) return;
    await invoke("media_action", {
      playerId: currentMedia?.player_id,
      action: "toggle",
    }).catch(console.log);
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
