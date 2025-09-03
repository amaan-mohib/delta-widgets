import { path } from "@tauri-apps/api";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { nanoid } from "nanoid";

const getStore = async () => {
  try {
    const storePath = await path.resolve(await path.appDataDir(), "store.json");
    const store = await readTextFile(storePath);
    return JSON.parse(store);
  } catch (error) {
    return {};
  }
};

export const getOrCreateClientId = async () => {
  const store = await getStore();
  if (store.clientId) {
    return store.clientId as string;
  } else {
    const clientId = nanoid();
    await invoke("write_to_store_cmd", {
      key: "clientId",
      value: clientId,
    });
    return clientId;
  }
};

export const sendMixpanelEvent = async (
  event: string,
  properties: Record<string, any>
) => {
  if (import.meta.env.MODE === "development") {
    console.log("Mixpanel event (dev mode):", { event, properties });
    return;
  }
  try {
    const clientId = await getOrCreateClientId();
    await invoke("track_analytics_event", {
      event,
      distinctId: clientId,
      extraProperties: properties,
    });
  } catch (error) {
    console.error("Error sending Mixpanel event:", error);
  }
};

export const trackInstall = async () => {
  try {
    const store = await getStore();
    if (store.installTracked) return;

    await sendMixpanelEvent("install", {});
    await invoke("write_to_store_cmd", {
      key: "installTracked",
      value: true,
    });
  } catch (error) {
    console.error("Error tracking install:", error);
  }
};

export const trackUpdated = async () => {
  try {
    const [store, currentVersion] = await Promise.all([
      getStore(),
      getVersion(),
    ]);

    const lastUpdatedVersion = store.lastUpdatedVersion as string | undefined;

    if (!lastUpdatedVersion || lastUpdatedVersion !== currentVersion) {
      if (lastUpdatedVersion) {
        await sendMixpanelEvent("updated", {
          from: lastUpdatedVersion,
          to: currentVersion,
        });
      }

      await invoke("write_to_store_cmd", {
        key: "lastUpdatedVersion",
        value: currentVersion,
      });
    }
  } catch (error) {
    console.error("Error tracking update:", error);
  }
};
