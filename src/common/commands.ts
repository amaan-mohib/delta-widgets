import { invoke, InvokeArgs } from "@tauri-apps/api/core";
import { IMedia, ISystemInformation } from "../widget/types/variables";
import { ILiteWidget, IWidget } from "../types/manifest";

export interface IMediaActionCmd {
  playerId: string;
  action: "play" | "pause" | "toggle" | "next" | "prev" | "position";
  position?: number;
}

export interface IGetAllWidget {
  manifest: ILiteWidget;
  path: string;
  modifiedAt: number;
  isDraft: boolean;
}

export interface ICopyAssets {
  key: string;
  path: string;
}

export const commands = {
  getMedia: () => invoke<IMedia[]>("get_media"),
  startMediaListenerCmd: () => invoke<void>("start_media_listener_cmd"),
  stopMediaListenerCmd: () => invoke<void>("stop_media_listener_cmd"),
  mediaAction: (params: IMediaActionCmd) =>
    invoke<void>("media_action", params as unknown as InvokeArgs),
  getAllWidgets: () => invoke<IGetAllWidget[]>("get_all_widgets"),
  copyCustomAssets: (params: ICopyAssets) =>
    invoke<string>("copy_custom_assets", params as unknown as InvokeArgs),
  copyCustomAssetsDir: (params: ICopyAssets) =>
    invoke<void>("copy_custom_assets_dir", params as unknown as InvokeArgs),
  applyBlurTheme: (params: { mode: string; label: string }) =>
    invoke<boolean>("apply_blur_theme", params),
  createUrlThumbnail: (params: { url: string; fileName: string }) =>
    invoke<number>("create_url_thumbnail", params),
  updateManifestValue: (params: {
    field: keyof IWidget;
    value: any;
    path: string;
  }) => invoke<string>("update_manifest_value", params),
  createCreatorWindow: (params: { manifestPath: string }) =>
    invoke<void>("create_creator_window", params),
  createWidgetWindow: (params: { path: string; isPreview?: boolean }) =>
    invoke<void>("create_widget_window", params),
  closeWidgetWindow: (params: { label: string }) =>
    invoke<void>("close_widget_window", params),
  publishWidget: (params: { path: string }) =>
    invoke<string>("publish_widget", params),
  openDevtools: (params: { label: string }) =>
    invoke<void>("open_devtools", params),
  getSystemInfo: (params: { hasNetwork?: boolean }) =>
    invoke<ISystemInformation>("get_system_info", params),
  trackAnalyticsEvent: (params: {
    event: string;
    distinctId: string;
    extraProperties: Record<string, any>;
  }) => invoke<void>("track_analytics_event", params),
  writeToStoreCmd: (params: { pairs: { key: string; value: any }[] }) =>
    invoke<void>("write_to_store_cmd", params),
  migrate: (params: { direction: "up" | "down" }) =>
    invoke<void>("migrate", params),
  startAudioCapture: () => invoke<void>("start_audio_capture"),
  stopAudioCapture: () => invoke<void>("stop_audio_capture"),
  restartAudioCapture: () => invoke<void>("restart_audio_capture"),
  getCurrentDeviceCmd: () => invoke<void>("get_current_device_cmd"),
};
