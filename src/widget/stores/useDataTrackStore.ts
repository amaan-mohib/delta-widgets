import { create } from "zustand";
import { IWidget } from "../../types/manifest";

export interface IUseDataTrackStore {
  initialStateLoading: boolean,
  initialStateLoadCounter: number,
  incrementInitialStateLoadCounter: () => void,
  manifest: IWidget | null;
}

export const useDataTrackStore = create<IUseDataTrackStore>((set, get) => ({
  initialStateLoading: true,
  initialStateLoadCounter: 0,
  incrementInitialStateLoadCounter: () => {
    set({ initialStateLoadCounter: get().initialStateLoadCounter + 1 });
  },
  manifest: null
}));