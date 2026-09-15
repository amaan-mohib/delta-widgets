import { invoke, InvokeArgs } from "@tauri-apps/api/core";
import { IMedia, ISystemInformation } from "./types/variables";
import { ILiteWidget, IWidget } from "./types/manifest";

export interface IMediaActionCmd {
  playerId: string;
  action: "play" | "pause" | "toggle" | "next" | "prev" | "position";
  position?: number;
}

export interface IGetAllWidget {
  manifest: Omit<ILiteWidget, "path">;
  path: string;
  manifestPath: string;
  thumbPath: string;
  modifiedAt: number;
  isDraft: boolean;
}

export interface ICopyAssets {
  key: string;
  path: string;
}

export interface IChat {
  id: string;
  name: string;
  data: any;
  created_at: number;
  updated_at: number;
}

export interface IMessage {
  id: string;
  chat_id: string;
  content: any;
  created_at: number;
  updated_at: number;
}

export type IGetMediaMetadataParams = { mediaId: number };
export type IGetMediaMetadata = {
  id: number;
  title: string;
  artist: string;
  album: string;
  thumbnail: number[];
};

export type IQueryMediaHistoryParams = {
  input: {
    intent: "history" | "top_media" | "top_artists" | "stats" | "search";
    start_time?: string;
    end_time?: string;
    search_query?: string;
    limit?: number;
  };
};
export type IQueryMediaHistory = any;

export type IUploadHtmlWidgetParams = { manifestPath: string };
export type IUploadHtmlWidget = void;

export type ICaptureWidgetScreenshotParams = {
  label: string;
  manifestPath: string;
  refresh?: boolean;
  customName?: string;
};
export type ICaptureWidgetScreenshot = void;

export type IUploadWidgetParams = {
  uploadJobs: { url: string; name: string; path?: string }[];
  manifestPath: string;
  uploadValues: {
    key: string;
    label: string;
    version: string;
    description?: string;
  };
};
export type IUploadWidget = void;

export type IValidateWidgetAssetParams = { assetPath: string };
export type IValidateWidgetAsset = void;

export type IDownloadWidgetParams = {
  key: string;
  files: { manifest: string; assets?: string | null; thumb?: string | null };
};
export type IDownloadWidget = void;

export const commands = {
  getMedia: () => invoke<IMedia[]>("get_media"),
  startMediaListenerCmd: () => invoke<void>("start_media_listener_cmd"),
  stopMediaListenerCmd: () => invoke<void>("stop_media_listener_cmd"),
  mediaAction: (params: IMediaActionCmd) =>
    invoke<void>("media_action", params as unknown as InvokeArgs),
  getAllWidgets: (params?: { dir?: "saves" | "widgets" }) =>
    invoke<IGetAllWidget[]>("get_all_widgets", params),
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
  createChat: (params: { input: { id: string; name: string; data: any } }) =>
    invoke<void>("create_chat", params),
  getAllChats: () => invoke<IChat[]>("get_all_chats"),
  loadChat: (params: { chatId: string }) =>
    invoke<IMessage[]>("load_chat", params),
  upsertMessage: (params: {
    input: { id: string; chat_id: string; content: any };
  }) => invoke("upsert_message", params),
  updateChatName: (params: { name: string; chatId: string }) =>
    invoke<void>("update_chat_name", params),
  getExistingKeysCmd: (params: { currentFolder: string }) =>
    invoke<Record<string, null>>("get_existing_keys_cmd", params),
  updateChatWidgetKeys: (params: { chatId: string; key: string }) =>
    invoke<void>("update_chat_widget_keys", params),
  getChatById: (params: { id: string }) =>
    invoke<IChat | undefined>("get_chat_by_id", params),
  createAssistantWindow: () => invoke<void>("create_assistant_window"),
  queryMediaHistory: (params: IQueryMediaHistoryParams) =>
    invoke<IQueryMediaHistory>("query_media_history", params),
  getMediaMetadata: (params: IGetMediaMetadataParams) =>
    invoke<IGetMediaMetadata>("get_media_metadata", params),
  deleteChat: (params: { id: string }) => invoke<void>("delete_chat", params),
  createGalleryWindow: (params?: { url?: string }) =>
    invoke<void>("create_gallery_window", params),
  captureWidgetScreenshot: (params?: ICaptureWidgetScreenshotParams) =>
    invoke<ICaptureWidgetScreenshot>("capture_widget_screenshot", params),
  uploadWidget: (params: IUploadWidgetParams) =>
    invoke<IUploadWidget>("upload_widget", params),
  validateWidgetAsset: (params: IValidateWidgetAssetParams) =>
    invoke<IValidateWidgetAsset>("validate_widget_asset", params),
  downloadWidget: (params: IDownloadWidgetParams) =>
    invoke<IDownloadWidget>("download_widget", params),
};
