import { useCallback, useLayoutEffect, useState } from "react";
import { useDataTrackStore } from "../stores/useDataTrackStore";

export const useElementRect = <T extends HTMLDivElement>(
  id: string
): [(node: T | null) => void, T | null] => {
  const [element, setElement] = useState<T | null>(null);
  const isDraggingGlobal = useDataTrackStore((state) => state.isDragging);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  useLayoutEffect(() => {
    if (!isDraggingGlobal || !element) return;

    useDataTrackStore
      .getState()
      .updateRectMap(id, element.getBoundingClientRect());
  }, [element, isDraggingGlobal]);

  return [ref, element];
};
