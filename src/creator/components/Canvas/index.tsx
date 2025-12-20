import {
  FluentProvider,
  makeStyles,
  Text,
  tokens,
  Toolbar,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import {
  ArrowCounterclockwiseRegular,
  ImageOffRegular,
  ImageRegular,
  ZoomInRegular,
  ZoomOutRegular,
} from "@fluentui/react-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";
import { ResizableBox } from "react-resizable";
import { Buffer } from "buffer";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import ComponentRender from "./renderers";
import { useShallow } from "zustand/shallow";
import ContextMenu from "./ContextMenu";
import { useTheme } from "../../theme/useTheme";

const useStyles = makeStyles({
  canvas: {
    flex: 1,
    height: "100%",
    background: tokens.colorNeutralBackground1,
    display: "flex",
    position: "relative",
  },
  zoomWrapper: {
    width: "100%",
    height: "100%",
  },
  controls: {
    zIndex: 1,
    position: "absolute",
    right: 0,
    top: 0,
    background: tokens.colorNeutralBackground2,
  },
  widgetWindow: {
    border: `1px solid ${tokens.colorNeutralForeground1}`,
    borderRadius: "2px",
    position: "relative",
    display: "flex",
    boxShadow: `0px 0px 5px 2px ${tokens.colorNeutralBackground1}`,
  },
  windowInfo: {
    position: "absolute",
    top: "0px",
    left: "0px",
    transform: "translateY(-100%)",
    width: "100%",
    padding: "3px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    color: `${tokens.colorNeutralForeground1}`,
    textShadow: `1px 1px ${tokens.colorNeutralBackground1}`,
  },
});

interface CanvasProps {}

const Controls = ({
  scale,
  centerRef,
  showWallpaper,
  setShowWallpaper,
}: {
  scale: number;
  centerRef: React.RefObject<HTMLDivElement>;
  showWallpaper: boolean;
  setShowWallpaper: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const styles = useStyles();
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();

  return (
    <div className={styles.controls}>
      <Toolbar>
        <Text size={200} style={{ padding: 5 }}>{`${(scale || 1).toPrecision(
          2
        )}x`}</Text>
        <Tooltip content="Zoom In" relationship="label">
          <ToolbarButton icon={<ZoomInRegular />} onClick={() => zoomIn()} />
        </Tooltip>
        <Tooltip content="Zoom Out" relationship="label">
          <ToolbarButton icon={<ZoomOutRegular />} onClick={() => zoomOut()} />
        </Tooltip>
        {scale !== 1 && (
          <Tooltip content="Reset zoom" relationship="label">
            <ToolbarButton
              icon={<ArrowCounterclockwiseRegular />}
              onClick={() => resetTransform()}
            />
          </Tooltip>
        )}
        {showWallpaper ? (
          <Tooltip content="Hide wallpaper" relationship="label">
            <ToolbarButton
              icon={<ImageOffRegular />}
              onClick={() => setShowWallpaper(false)}
            />
          </Tooltip>
        ) : (
          <Tooltip content="Show wallpaper" relationship="label">
            <ToolbarButton
              icon={<ImageRegular />}
              onClick={() => setShowWallpaper(true)}
            />
          </Tooltip>
        )}
      </Toolbar>
      <div
        onClick={() => centerView()}
        ref={centerRef}
        style={{ display: "none" }}></div>
    </div>
  );
};
const Canvas: React.FC<CanvasProps> = () => {
  const styles = useStyles();
  const [widgetDimension, elements = []] = useManifestStore(
    useShallow((state) => {
      const { dimensions, elements } = state.manifest || {};
      return [dimensions, elements];
    })
  );
  const zoomDisabled = useDataTrackStore((state) => state.zoomDisabled);
  const scale = useDataTrackStore((state) => state.scale);
  const centerRef = useRef<HTMLDivElement>(null);
  const [wallpaper, setWallpaper] = useState("");
  const initialStateLoading = useDataTrackStore(
    (state) => state.initialStateLoading
  );
  const isDragging = useDataTrackStore((state) => state.isDragging);
  const [showWallpaper, setShowWallpaper] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    if (initialStateLoading) return;
    if (window.__INITIAL_STATE__?.wallpaper) {
      setWallpaper(
        `data:image/png;base64,${Buffer.from(
          window.__INITIAL_STATE__.wallpaper
        ).toString("base64")}`
      );
    }
  }, [initialStateLoading]);

  if (initialStateLoading || !widgetDimension) return null;

  return (
    <div
      className={styles.canvas}
      onClick={(e) => {
        e.stopPropagation();
        useDataTrackStore.setState({ selectedId: null });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        useDataTrackStore.setState({
          contextMenuData: {
            x: e.pageX,
            y: e.pageY,
            node: e.target as HTMLElement,
          },
        });
      }}
      style={
        wallpaper && showWallpaper
          ? {
              backgroundImage: `url(${wallpaper})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }>
      <TransformWrapper
        minScale={0.2}
        initialScale={1}
        disabled={zoomDisabled || isDragging}
        centerOnInit
        onTransformed={(_, { scale, positionX, positionY }) => {
          useDataTrackStore.setState({
            scale,
            position: { positionX, positionY },
          });
        }}>
        <Controls
          scale={scale}
          centerRef={centerRef}
          showWallpaper={showWallpaper}
          setShowWallpaper={setShowWallpaper}
        />
        <TransformComponent wrapperClass={styles.zoomWrapper}>
          <FluentProvider theme={theme}>
            <ResizableBox
              minConstraints={[50, 50]}
              maxConstraints={[800, 600]}
              transformScale={scale}
              onResizeStart={() => {
                useDataTrackStore.setState({ zoomDisabled: true });
              }}
              onResizeStop={() => {
                useDataTrackStore.setState({ zoomDisabled: false });
                centerRef.current && centerRef.current.click();
              }}
              onResize={(_, { size }) => {
                useManifestStore
                  .getState()
                  .updateWidgetDimensions(size.width, size.height);
              }}
              resizeHandles={["se"]}
              width={widgetDimension.width}
              height={widgetDimension.height}
              className={styles.widgetWindow}
              draggableOpts={{ grid: [1, 1] }}>
              <>
                <div className={styles.windowInfo}>
                  {widgetDimension.width > 100 && (
                    <Text size={100}>Window</Text>
                  )}
                  <Text size={100}>{`${Math.round(
                    widgetDimension.width
                  )}px X ${Math.round(widgetDimension.height)}px`}</Text>
                </div>
                {elements.map((element) => (
                  <ComponentRender key={element.id} component={element} />
                ))}
              </>
            </ResizableBox>
          </FluentProvider>
        </TransformComponent>
      </TransformWrapper>
      <ContextMenu />
    </div>
  );
};

export default Canvas;
