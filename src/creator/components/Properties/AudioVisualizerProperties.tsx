import { Select, SpinButton } from "@fluentui/react-components";
import React from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import {
  IUpdateElementProperties,
  useManifestStore,
} from "../../stores/useManifestStore";
import Panel from "./Panel";
import { useBackgroundProperties } from "./BackgroundProperties";
import { spinButtonOnChange } from "../../utils";
import { ColorPickerPopup } from "./ColorPickerPopup";

interface AudioVisualizerPropertiesProps {
  disableDynamic?: boolean;
}

const AudioVisualizerProperties: React.FC<
  AudioVisualizerPropertiesProps
> = () => {
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const elementMap = useManifestStore((state) => state.elementMap);

  const updateProperties = (value: IUpdateElementProperties) => {
    if (!selectedId) return;
    useManifestStore.getState().updateElementProperties(selectedId, value);
  };

  const backgroundProperties = useBackgroundProperties({
    elementMap,
    selectedId,
    updateProperties,
  });

  if (!selectedId || !elementMap[selectedId]) return null;

  const audioVisualizerData = elementMap[selectedId].data;

  return (
    <Panel
      title="Audio Visualizer"
      items={[
        {
          label: "Properties",
          value: "properties",
          fields: [
            {
              label: "Type",
              control: (
                <Select
                  value={audioVisualizerData?.type || "bar"}
                  onChange={(_, { value }) => {
                    updateProperties({
                      data: { type: value || "bar" },
                    });
                  }}>
                  <option value="bar">Bar</option>
                  <option value="waveform">Waveform</option>
                  <option value="waveform-filled">Filled Waveform</option>
                </Select>
              ),
            },
            {
              label: "Amplitude Multiplier",
              control: (
                <SpinButton
                  size="small"
                  value={parseFloat(
                    String(audioVisualizerData?.amplitudeMultiplier || 1),
                  )}
                  step={0.1}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      updateProperties({
                        data: {
                          amplitudeMultiplier: value,
                        },
                      });
                    });
                  }}
                />
              ),
            },
            {
              label: "Stroke Width (px)",
              control: (
                <SpinButton
                  size="small"
                  value={parseInt(
                    String(audioVisualizerData?.strokeWidth || 1),
                    10,
                  )}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      updateProperties({
                        data: {
                          strokeWidth: `${value}px`,
                        },
                      });
                    });
                  }}
                />
              ),
            },
            {
              label: "Stroke Color",
              control: (
                <ColorPickerPopup
                  color={audioVisualizerData?.color || "#fff"}
                  setColor={(color) => {
                    updateProperties({
                      data: {
                        color,
                      },
                    });
                  }}
                />
              ),
            },
            {
              label: "Stroke Gap",
              control: (
                <SpinButton
                  size="small"
                  value={parseInt(String(audioVisualizerData?.gap || 2), 10)}
                  onChange={(event, data) => {
                    spinButtonOnChange(event, data, (value) => {
                      updateProperties({
                        data: {
                          gap: value,
                        },
                      });
                    });
                  }}
                />
              ),
            },
            audioVisualizerData?.type === "waveform-filled"
              ? {
                  label: "Fill Color",
                  control: (
                    <ColorPickerPopup
                      color={audioVisualizerData?.fillColor || "#fff"}
                      setColor={(color) => {
                        updateProperties({
                          data: {
                            fillColor: color,
                          },
                        });
                      }}
                    />
                  ),
                }
              : { label: "", control: null },
          ],
        },
        backgroundProperties!,
      ]}
      selectedId={selectedId}
    />
  );
};

export default AudioVisualizerProperties;
