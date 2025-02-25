import { IWidget } from "../main/utils/widgets"

declare global {
  interface Window {
    __INITIAL_STATE__?: {
      manifest: IWidget;
      wallpaper?: number[];
      existingKeys?: Record<string, null>;
    }
  }
}