import { IWidget } from "../main/utils/widgets"

declare global {
  interface Window {
    __INITIAL_STATE__?: {
      manifest: { path: string };
      wallpaper?: number[];
      existingKeys?: Record<string, null>;
    },
    __INITIAL_WIDGET_STATE__?: {
      manifestPath: string;
    }
  }
}