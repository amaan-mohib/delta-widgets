import {
  closestCenter,
  CollisionDetection,
  DndContext,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  UniqueIdentifier,
} from "@dnd-kit/core";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import { makeStyles, Spinner, tokens } from "@fluentui/react-components";
import { useManifestStore } from "./stores/useManifestStore";
import { useCallback, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import CreatorToolbar from "./components/Toolbar";
import { useDataTrackStore } from "./stores/useDataTrackStore";
import Properties from "./components/Properties";
import { getManifestFromPath } from "../main/utils/widgets";
import { componentTypeToDataMap } from "./components/Sidebar/ComponentList";

const useStyles = makeStyles({
  toolbar: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    padding: "0 3px",
  },
});
interface AppProps {}

const App: React.FC<AppProps> = () => {
  const styles = useStyles();
  const manifestStore = useManifestStore((state) => state.manifest);
  const elementMap = useManifestStore((state) => state.elementMap);
  const {
    initialStateLoading,
    incrementInitialStateLoadCounter,
    initialStateLoadCounter,
  } = useDataTrackStore();
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (window.__INITIAL_STATE__) {
        useDataTrackStore.setState({ initialStateLoading: false });
      } else {
        incrementInitialStateLoadCounter();
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [initialStateLoadCounter]);

  useEffect(() => {
    if (initialStateLoading) return;
    const initialManifest = window.__INITIAL_STATE__?.manifest;
    if (initialManifest && manifestStore === null) {
      const manifestPath = initialManifest.path;
      getManifestFromPath(manifestPath).then((manifest) => {
        useManifestStore.setState({
          manifest: { ...manifest, path: manifestPath },
        });
      });
    } else {
      const { key, label } = manifestStore || {};
      if (!key || !label) {
        const newLabel = `Untitled-${nanoid(4)}`;
        const newKey = newLabel.toLowerCase();
        useManifestStore
          .getState()
          .updateManifest({ key: newKey, label: newLabel });
      }
    }
  }, [initialStateLoading]);

  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (!args.active.data.current?.sortable) {
        return pointerWithin({ ...args });
      }
      if (args.active.id && args.active.id.toString().startsWith("container")) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            container.id.toString().startsWith("container")
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");

      if (overId != null) {
        if (overId === "TRASH_ID") {
          // If the intersecting droppable is the trash, return early
          // Remove this if you're not using trashable functionality in your app
          return intersections;
        }

        if (overId.toString().startsWith("container")) {
          const containerItems = (elementMap[overId].children || []).map(
            (item) => item.id
          );

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  containerItems.includes(container.id.toString())
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = args.active.id;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [elementMap]
  );

  return initialStateLoading ? (
    <main
      className="container"
      style={{ alignItems: "center", justifyContent: "center" }}>
      <Spinner size="huge" />
    </main>
  ) : (
    <DndContext
      collisionDetection={collisionDetectionStrategy}
      onDragStart={(e) => {
        useDataTrackStore.setState({
          activeId: String(e.active.id),
          isDragging: true,
          selectedId: null,
        });
      }}
      onDragEnd={(e) => {
        if (e.active.id === "container") {
          useDataTrackStore.setState({ activeId: null, isDragging: false });
          return;
        }

        if (e.over?.id) {
          if (e.active.data.current?.sortable && e.active.id !== e.over.id) {
            useManifestStore
              .getState()
              .moveElement(e.active.id.toString(), e.over.id.toString());
          } else if (!e.over?.id.toString().startsWith("container")) {
            useDataTrackStore.setState({ activeId: null, isDragging: false });
            return;
          } else if (e.active.data.current) {
            const { type } = e.active.data.current as { type: string };
            const element = componentTypeToDataMap[type]
              ? componentTypeToDataMap[type]()
              : null;
            if (element) {
              useManifestStore
                .getState()
                .addElements(element, String(e.over.id));
            }
          }
        }
        useDataTrackStore.setState({ activeId: null, isDragging: false });
      }}>
      <main className="container">
        <div className={styles.toolbar}>
          <CreatorToolbar />
        </div>
        <div className="layout">
          <Sidebar />
          <Canvas />
          <Properties />
        </div>
      </main>
    </DndContext>
  );
};

export default App;
