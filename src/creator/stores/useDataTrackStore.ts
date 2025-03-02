import { create } from "zustand";

export interface IUseDataTrackStore {
  initialStateLoading: boolean,
  initialStateLoadCounter: number,
  incrementInitialStateLoadCounter: () => void,
  activeId: string | null,
  selectedId: string | null
}

export const useDataTrackStore = create<IUseDataTrackStore>((set, get) => ({
  initialStateLoading: true,
  initialStateLoadCounter: 0,
  incrementInitialStateLoadCounter: () => {
    set({ initialStateLoadCounter: get().initialStateLoadCounter + 1 });
  },
  activeId: null,
  selectedId: null
}));