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
  customFields?: Record<string, string>;
}

export const useVariableStore = create<IVariableStore>(() => ({
  currentDate: new Date(),
  media: [],
  currentMedia: null,
  selectedMediaPlayer: null,
  systemInfo: {},
  weatherInfo: {},
}));

export const useDynamicTextStore = create<
  Record<string, (format?: string) => string>
>(() => ({}));
