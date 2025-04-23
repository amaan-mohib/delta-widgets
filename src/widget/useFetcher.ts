import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState } from "react";
import { IWidgetElement } from "../types/manifest";
import { invoke } from "@tauri-apps/api/core";
import debounce from "lodash.debounce";
import { IMedia, ISystemInformation } from "./types/variables";
import { useVariableStore } from "./stores/useVariableStore";

const extractDynamicVariables = (
  elements: IWidgetElement[],
  results = new Set<string>(),
  typesSet = new Set<string>()
) => {
  elements.forEach((element) => {
    typesSet.add(element.type);
    Object.values(element.data || {}).forEach((value) => {
      if (typeof value === "string") {
        const matches = [...value.matchAll(/\{\{([^}]+)\}\}/g)];
        matches.forEach((match) => {
          const variable = match[1].trim().split(":")[0].trim();
          if (variable) {
            results.add(variable);
          }
        });
      }
    });
    if (element.children) {
      extractDynamicVariables(element.children, results, typesSet);
    }
  });
  return { dynamicVariables: results, typesSet };
};

function useFetcher(elements: IWidgetElement[]) {
  const { typesSet, dynamicVariables } = useMemo(
    () => extractDynamicVariables(elements),
    [elements]
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [systemInfoCounter, setSystemInfoCounter] = useState(0);

  useEffect(() => {
    if (!dynamicVariables.has("media")) return;

    const getMedia = debounce(() => {
      invoke<IMedia[]>("get_media")
        .then((data) => {
          useVariableStore.setState({ media: data });
          const selectedMedia = useVariableStore.getState().currentMedia;
          const currentMedia = data.find((media) => media.is_current_session);
          const selectedMediaNotInList = !data.find(
            (media) => media.player_id === selectedMedia?.player_id
          );
          if (currentMedia && (!selectedMedia || selectedMediaNotInList)) {
            useVariableStore.setState({ currentMedia });
          } else if (data.length > 0) {
            useVariableStore.setState({ currentMedia: data[0] });
          } else {
            useVariableStore.setState({ currentMedia: null });
          }
        })
        .catch(console.log);
    }, 300);

    getMedia();

    let unsub: UnlistenFn;
    (async () => {
      unsub = await listen("media_updated", () => {
        getMedia();
      });
    })();
    return () => {
      getMedia.cancel();
      unsub && unsub();
    };
  }, [dynamicVariables]);

  useEffect(() => {
    if (
      !dynamicVariables.has("date") &&
      !dynamicVariables.has("time") &&
      !dynamicVariables.has("datetime")
    )
      return;

    const timeout = setTimeout(() => {
      const currentDate = new Date();
      useVariableStore.setState({ currentDate });
      setCurrentDate(currentDate);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [dynamicVariables, currentDate]);

  useEffect(() => {
    if (!dynamicVariables.has("system") && !typesSet.has("disk-usage")) return;

    (async () => {
      try {
        const data = await invoke<ISystemInformation>("get_system_info");
        useVariableStore.setState({ systemInfo: data });
      } catch (error) {
        console.log(error);
      }
    })();

    const timeout = setTimeout(() => {
      setSystemInfoCounter((prev) => prev + 1);
    }, 60_000);

    return () => {
      clearTimeout(timeout);
    };
  }, [dynamicVariables, systemInfoCounter, typesSet]);
}

export default useFetcher;
