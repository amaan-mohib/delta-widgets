import { IWidgetElement } from "../../../types/manifest";
import ButtonComponent from "../ButtonComponent";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { invoke } from "@tauri-apps/api/core";

interface AudioToggleComponentProps {
  component: IWidgetElement;
}

const AudioToggleComponent: React.FC<AudioToggleComponentProps> = ({
  component,
}) => {
  const isAudioCapturing = useDataTrackStore(
    (state) => state.audioSampleCapturing,
  );

  const onToggle = () => {
    if (isAudioCapturing) {
      invoke("stop_audio_capture")
        .then(() => {
          useDataTrackStore.setState({ audioSampleCapturing: false });
        })
        .catch((e) => console.error(e));
    } else {
      invoke("start_audio_capture")
        .then(() => {
          useDataTrackStore.setState({ audioSampleCapturing: true });
        })
        .catch((e) => console.error(e));
    }
  };
  return (
    <ButtonComponent
      title={isAudioCapturing ? "Stop Audio Capture" : "Start Audio Capture"}
      component={{
        ...component,
        data: {
          ...(component.data || {}),
          icon: isAudioCapturing
            ? "SoundWaveCircleSubtractRegular"
            : "SoundWaveCircleAddRegular",
        },
      }}
      onClick={onToggle}
    />
  );
};

export default AudioToggleComponent;
