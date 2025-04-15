import React, { useCallback } from "react";
import { IWidgetElement } from "../../../types/manifest";
import { useVariableStore } from "../../stores/useVariableStore";
import { invoke } from "@tauri-apps/api/core";
import SliderComponent from "../SliderComponent";

interface MediaSliderProps {
  component: IWidgetElement;
}

const MediaSlider: React.FC<MediaSliderProps> = ({ component }) => {
  const currentMedia = useVariableStore((state) => state.currentMedia);

  const onToggle = useCallback(
    async (value: number) => {
      if (!currentMedia) return;
      console.log("Slider value:", value);

      await invoke("media_action", {
        playerId: currentMedia?.player_id,
        action: "position",
        position: value,
      }).catch(console.log);
    },
    [currentMedia]
  );

  return (
    <SliderComponent
      component={component}
      onChange={onToggle}
      disabled={!currentMedia}
    />
  );
};

export default MediaSlider;
