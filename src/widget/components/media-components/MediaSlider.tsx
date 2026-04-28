import React, { useCallback } from "react";
import { IWidgetElement } from "../../../types/manifest";
import { useVariableStore } from "../../stores/useVariableStore";
import SliderComponent from "../SliderComponent";
import { commands } from "../../../common/commands";

interface MediaSliderProps {
  component: IWidgetElement;
}

const MediaSlider: React.FC<MediaSliderProps> = ({ component }) => {
  const currentMedia = useVariableStore((state) => state.currentMedia);
  const mediaList = useVariableStore((state) => state.media);
  const isSelectedMediaCurrentSession =
    mediaList.find((item) => item.is_current_session)?.player_id ===
    currentMedia?.player_id;

  const onToggle = useCallback(
    async (value: number) => {
      if (!currentMedia) return;

      await commands
        .mediaAction({
          playerId: currentMedia.player_id,
          action: "position",
          position: value,
        })
        .catch(console.error);
    },
    [currentMedia],
  );

  return (
    <SliderComponent
      component={component}
      onChange={onToggle}
      disabled={!currentMedia || !isSelectedMediaCurrentSession}
    />
  );
};

export default MediaSlider;
