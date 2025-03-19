import { create } from "zustand";

export interface IUseDataTrackStore {
  initialStateLoading: boolean,
  initialStateLoadCounter: number,
  incrementInitialStateLoadCounter: () => void,
  activeId: string | null,
  selectedId: string | null,
  isSaving: boolean;
  isDragging: boolean;
  scale: number;
  zoomDisabled: boolean;
}

export const useDataTrackStore = create<IUseDataTrackStore>((set, get) => ({
  initialStateLoading: true,
  initialStateLoadCounter: 0,
  incrementInitialStateLoadCounter: () => {
    set({ initialStateLoadCounter: get().initialStateLoadCounter + 1 });
  },
  activeId: null,
  selectedId: null,
  isSaving: false,
  isDragging: false,
  scale: 1,
  zoomDisabled: false,
}));