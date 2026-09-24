import { create } from "zustand";
import { IWidget } from "../../common/types/manifest";

export interface IUseDataTrackStore {
  initialStateLoading: boolean;
  manifest: IWidget | null;
  fontsToLoad: string[];
  audioSampleCapturing: boolean;
  isPreview: boolean;
}

export const useDataTrackStore = create<IUseDataTrackStore>(() => ({
  initialStateLoading: true,
  manifest: null,
  fontsToLoad: [],
  audioSampleCapturing: false,
  isPreview: false,
}));
