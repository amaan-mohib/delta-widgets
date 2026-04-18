import { create } from "zustand";
import {
  IMedia,
  ISystemInformation,
  WeatherResponse,
} from "../types/variables";

export interface IVariableStore {
  currentDate: Date;
  media: IMedia[];
  currentMedia: IMedia | null;
  selectedMediaPlayer: string | null;
  systemInfo: Partial<ISystemInformation>;
  weatherInfo: Partial<WeatherResponse>;
  audioSamples: number[];
  customFields?: Record<string, string>;
}

export const useVariableStore = create<IVariableStore>(() => ({
  currentDate: new Date(),
  media: [],
  currentMedia: null,
  selectedMediaPlayer: null,
  systemInfo: {},
  weatherInfo: {},
  audioSamples: [],
}));

export const useDynamicTextStore = create<
  Record<string, (format?: string) => string>
>(() => ({}));
