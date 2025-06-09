import React, { useEffect, useState } from "react";
import { useManifestStore } from "../../../stores/useManifestStore";
import { useShallow } from "zustand/shallow";
import DnDWrapper from "./DnDWrapper";
import Item from "./Item";
import { useDataTrackStore } from "../../../stores/useDataTrackStore";
import { IWidgetElement } from "../../../../types/manifest";

interface LayersTreeProps {}

const getAllContainerIds = (elements: IWidgetElement[], res: string[] = []) => {
  elements.forEach((item) => {
    if (item.children && item.children?.length > 0) {
      res.push(item.id);
      res.push(...getAllContainerIds(item.children || []));
    }
  });
  return res;
};

const LayersTree: React.FC<LayersTreeProps> = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { elements = [] } = useManifestStore(
    useShallow((state) => {
      return { elements: state.manifest?.elements };
    })
  );

  useEffect(() => {
    if (isInitialized) return;
    const ids = getAllContainerIds(elements);
    const layerOpenMap: Record<string, boolean> = {};
    ids.forEach((id) => {
      layerOpenMap[id] = true;
    });
    useDataTrackStore.setState({ layerOpenMap });
    setIsInitialized(true);
  }, [elements, isInitialized]);

  return (
    <DnDWrapper>
      <div style={{ padding: 5 }}>
        {elements.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </div>
    </DnDWrapper>
  );
};

export default LayersTree;
