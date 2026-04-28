import { getVersion } from "@tauri-apps/api/app";
import { nanoid } from "nanoid";
import { getStore } from "../../common";
import { commands } from "../../common/commands";

export const getOrCreateClientId = async () => {
  const store = await getStore();
  if (store.clientId) {
    return store.clientId as string;
  } else {
    const clientId = nanoid();
    await commands.writeToStoreCmd({
      key: "clientId",
      value: clientId,
    });
    return clientId;
  }
};

export const sendMixpanelEvent = async (
  event: string,
  properties: Record<string, any>,
) => {
  if (import.meta.env.MODE === "development") {
    console.log("Mixpanel event (dev mode):", { event, properties });
    return;
  }
  try {
    const clientId = await getOrCreateClientId();
    await commands.trackAnalyticsEvent({
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
    await commands.writeToStoreCmd({
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

      await commands.writeToStoreCmd({
        key: "lastUpdatedVersion",
        value: currentVersion,
      });
    }
  } catch (error) {
    console.error("Error tracking update:", error);
  }
};
