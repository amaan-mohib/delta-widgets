import { listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useRef, useState } from "react";
import { IWidgetElement, TCustomFields } from "../types/manifest";
import debounce from "lodash.debounce";
import { useVariableStore } from "./stores/useVariableStore";
import { getCityFromIp, getWeather } from "./utils/weather";
import { useDataTrackStore } from "./stores/useDataTrackStore";
import { commands } from "../common/commands";

const extractDynamicVariables = (
  elements: IWidgetElement[],
  results = new Set<string>(),
  typesSet = new Set<string>(),
  fontsSet = new Set<string>(),
) => {
  elements.forEach((element) => {
    typesSet.add(element.type);
    if (element.styles?.fontFamily) {
      fontsSet.add(element.styles.fontFamily);
    }
    const values: string[] = [];

    Object.values(element.data || {}).forEach((value) => {
      if (typeof value === "string") {
        values.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "string") {
            values.push(v);
          }
        });
      } else if (typeof value === "object" && value !== null) {
        Object.values(value).forEach((v) => {
          if (typeof v === "string") {
            values.push(v);
          }
        });
      }
    });
    values.forEach((value) => {
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
      extractDynamicVariables(element.children, results, typesSet, fontsSet);
    }
  });
  return { dynamicVariables: results, typesSet, fontsSet };
};

function useFetcher(elements: IWidgetElement[], customFields: TCustomFields) {
  const { typesSet, dynamicVariables, fontsSet } = useMemo(
    () => extractDynamicVariables(elements),
    [elements],
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [systemInfoCounter, setSystemInfoCounter] = useState(0);
  const [weatherCounter, setWeatherCounter] = useState(0);
  const lastMediaFetchedRef = useRef(0);
  const lastAudioFetchedRef = useRef(0);

  useEffect(() => {
    if (!customFields) return;

    const customFieldsData: Record<string, string> = {};
    Object.entries(customFields || {}).forEach(([key, field]) => {
      customFieldsData[key] = field.value;
    });
    useVariableStore.setState({ customFields: customFieldsData });
  }, [customFields]);

  const getMediaRef = useRef(
    debounce(
      () => {
        commands
          .getMedia()
          .then((data) => {
            useVariableStore.setState({ media: data });
            const selectedMedia = useVariableStore.getState().currentMedia;
            const currentMedia = data.find((media) => media.is_current_session);

            const selectedMediaNotInList = !data.find(
              (media) => media.player_id === selectedMedia?.player_id,
            );
            if (currentMedia && (!selectedMedia || selectedMediaNotInList)) {
              useVariableStore.setState({ currentMedia });
            } else if (data.length > 0) {
              useVariableStore.setState({ currentMedia: data[0] });
            } else {
              useVariableStore.setState({ currentMedia: null });
            }
            lastMediaFetchedRef.current = Date.now();
          })
          .catch(console.error);
      },
      300,
      { leading: true },
    ),
  );

  useEffect(() => {
    if (!dynamicVariables.has("media")) return;
    const getMedia = getMediaRef.current;

    commands
      .startMediaListenerCmd()
      .then(() => {
        getMedia();
      })
      .catch(console.error);

    const unsub = listen("media_updated", () => {
      getMedia();
    });

    const interval = setInterval(() => {
      const { currentMedia } = useVariableStore.getState();
      const isPlaying = currentMedia?.playback_info?.status === "playing";
      const isStale = Date.now() - lastMediaFetchedRef.current >= 1000;

      if (isPlaying && isStale) {
        getMedia();
      }
    }, 1000);

    return () => {
      getMedia.cancel();
      unsub.then((f) => f());
      clearInterval(interval);
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
        const data = await commands.getSystemInfo({
          hasNetwork: typesSet.has("network"),
        });
        useVariableStore.setState({ systemInfo: data });
      } catch (error) {
        console.log(error);
      }
    })();

    const timeout = setTimeout(() => {
      setSystemInfoCounter((prev) => prev + 1);
    }, 5_000);

    return () => {
      clearTimeout(timeout);
    };
  }, [dynamicVariables, systemInfoCounter, typesSet]);

  useEffect(() => {
    if (!dynamicVariables.has("weather")) return;

    (async () => {
      try {
        let city = customFields?.weatherCity?.value;
        if (!city) {
          city = await getCityFromIp();
        }
        const data = await getWeather(city);
        useVariableStore.setState({ weatherInfo: data });
      } catch (error) {
        console.log(error);
      }
    })();

    const timeout = setTimeout(
      () => {
        setWeatherCounter((prev) => prev + 1);
      },
      60 * 60 * 1000,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [dynamicVariables, weatherCounter, typesSet]);

  useEffect(() => {
    if (!typesSet.has("audio-visualizer")) return;

    const unsub = listen<number[]>("audio-samples", (event) => {
      useVariableStore.setState({ audioSamples: event.payload });
      lastAudioFetchedRef.current = Date.now();
    });

    const interval = setInterval(() => {
      const lastPayload = useVariableStore.getState().audioSamples ?? [];
      const isStale = Date.now() - lastAudioFetchedRef.current >= 1000;

      if (isStale && lastPayload.length > 0) {
        useVariableStore.setState({ audioSamples: [] });
      }
    }, 1000);

    return () => {
      unsub.then((f) => f());
      clearInterval(interval);
    };
  }, [typesSet]);

  useEffect(() => {
    if (fontsSet.size > 0) {
      const fonts = Array.from(fontsSet);
      useDataTrackStore.setState({ fontsToLoad: fonts });
    }
  }, [fontsSet]);
}

export default useFetcher;
