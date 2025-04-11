import { create } from "zustand";
import { IMedia } from "../types/variables";

export interface IVariableStore {
  currentDate: Date;
  media: IMedia[];
  currentMedia: IMedia | null;
  selectedMediaPlayer: string | null;
}

export const useVariableStore = create<IVariableStore>(() => ({
  currentDate: new Date(),
  media: [],
  currentMedia: null,
  selectedMediaPlayer: null,
}));