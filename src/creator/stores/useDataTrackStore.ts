import { create } from "zustand";

export interface IUseDataTrackStore {
  initialStateLoading: boolean;
  initialStateLoadCounter: number;
  incrementInitialStateLoadCounter: () => void;
  activeId: string | null;
  selectedId: string | null;
  hoveredId: string | null;
  isSaving: boolean;
  isDragging: boolean;
  scale: number;
  position: any;
  zoomDisabled: boolean;
  rectMap: Record<string, DOMRect>;
  updateRectMap: (id: string, rect: DOMRect) => void;
  layerOpenMap: Record<string, boolean>;
  toggleLayerOpen: (id: string) => void;
  layerActiveId: string | null;
  layerIsDragging: boolean;
}

export const useDataTrackStore = create<IUseDataTrackStore>((set, get) => ({
  initialStateLoading: true,
  initialStateLoadCounter: 0,
  incrementInitialStateLoadCounter: () => {
    set({ initialStateLoadCounter: get().initialStateLoadCounter + 1 });
  },
  activeId: null,
  selectedId: null,
  hoveredId: null,
  isSaving: false,
  isDragging: false,
  scale: 1,
  position: null,
  zoomDisabled: false,
  rectMap: {},
  updateRectMap(id, rect) {
    set((state) => ({
      rectMap: {
        ...state.rectMap,
        [id]: rect,
      },
    }));
  },
  layerOpenMap: {},
  toggleLayerOpen(id) {
    set((state) => ({
      layerOpenMap: {
        ...state.layerOpenMap,
        [id]: !!!state.layerOpenMap[id],
      },
    }));
  },
  layerActiveId: null,
  layerIsDragging: false,
}));
