import React, { useEffect, useMemo, useRef } from "react";
import {
  drawFilledWaveform,
  drawFlatLine,
  drawSoundBar,
  drawWaveform,
  hannWindow,
} from "../../../common/utils";
import { IWidgetElement } from "../../../types/manifest";
import { useVariableStore } from "../../stores/useVariableStore";
import { invoke } from "@tauri-apps/api/core";
import { useDataTrackStore } from "../../stores/useDataTrackStore";

const ATTACK = 0.6; // how fast it rises (lower = faster)
const DECAY = 0.9; // how slow it falls (higher = slower)

interface VisualizerComponentProps {
  component: IWidgetElement;
}

const VisualizerComponent: React.FC<VisualizerComponentProps> = ({
  component,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>([]);
  const animationRef = useRef<number>();
  const smoothRef = useRef<number[]>([]);

  const visualizerData = useMemo(() => component.data || {}, [component.data]);
  const data = useVariableStore((state) => state.audioSamples);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  function smoothBands(data: number[]) {
    if (smoothRef.current.length !== data.length) {
      smoothRef.current = [...data];
    }

    const smooth = smoothRef.current;

    for (let i = 0; i < data.length; i++) {
      if (data[i] > smooth[i]) {
        // rising → fast attack
        smooth[i] = smooth[i] * ATTACK + data[i] * (1 - ATTACK);
      } else {
        // falling → slow decay
        smooth[i] = smooth[i] * DECAY + data[i] * (1 - DECAY);
      }
    }

    return smooth;
  }

  useEffect(() => {
    invoke("start_audio_capture")
      .then(() => {
        useDataTrackStore.setState({ audioSampleCapturing: true });
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    const draw = () => {
      const data = dataRef.current;
      if (!data.length || data.every((v) => v === 0)) {
        drawFlatLine(canvas, visualizerData);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const smoothed = smoothBands(data);
      const window = hannWindow(data.length);
      const windowed = smoothed.map((v, i) => v * window[i]);

      if (visualizerData.type === "waveform") {
        drawWaveform(canvas, windowed, visualizerData);
      } else if (visualizerData.type === "waveform-filled") {
        drawFilledWaveform(canvas, windowed, visualizerData);
      } else {
        drawSoundBar(canvas, windowed, visualizerData);
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [visualizerData]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={300}
      style={{ ...(component.styles || {}), width: "100%", height: "100%" }}
    />
  );
};

export default VisualizerComponent;
