import { IWidgetElement } from "../../../types/manifest";
import ButtonComponent from "../ButtonComponent";
import { useDataTrackStore } from "../../stores/useDataTrackStore";

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
    useDataTrackStore.setState((prev) => ({
      audioSampleCapturing: !prev.audioSampleCapturing,
    }));
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
