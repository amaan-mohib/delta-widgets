import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useEffect, useMemo, useState } from 'react';
import { IWidgetElement } from '../types/manifest';
import { invoke } from '@tauri-apps/api/core';
import debounce from 'lodash.debounce';
import { IMedia } from './types/variables';
import { useVariableStore } from './stores/useVariableStore';

const extractDynamicVariables = (elements: IWidgetElement[], results = new Set<string>()) => {
  elements.forEach((element) => {
    Object.values(element.data || {}).forEach((value) => {
      if (typeof value === 'string') {
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
      extractDynamicVariables(element.children, results);
    }
  });
  return results;
}

function useFetcher(elements: IWidgetElement[]) {
  const dynamicVariables = useMemo(() => extractDynamicVariables(elements), [elements]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!dynamicVariables.has("media")) return;

    const getMedia = debounce(() => {
      invoke<IMedia[]>("get_media")
        .then(data => {
          useVariableStore.setState({ media: data });
          const currentMedia = data.find(media => media.is_current_session);
          if (currentMedia) {
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
    if (!dynamicVariables.has("date") && !dynamicVariables.has("time") && !dynamicVariables.has("datetime")) return;

    const timeout = setTimeout(() => {
      const currentDate = new Date();
      useVariableStore.setState({ currentDate });
      setCurrentDate(currentDate);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    }
  }, [dynamicVariables, currentDate]);

}

export default useFetcher;