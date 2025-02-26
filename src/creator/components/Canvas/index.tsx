import {
  makeStyles,
  Text,
  tokens,
  Toolbar,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import {
  ArrowCounterclockwiseRegular,
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
import Dropable from "../Dropable";
import { Buffer } from "buffer";
import { useDataTrackStore } from "../../stores/useDataTrackStore";

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
  },
  widgetWindow: {
    border: `1px solid ${tokens.colorNeutralForeground4}`,
    borderRadius: "2px",
    position: "relative",
  },
  windowInfo: {
    position: "absolute",
    top: "0px",
    left: "0px",
    transform: "translateY(-100%)",
    width: "100%",
    padding: "3px 0",
    opacity: 0.75,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
  },
});

interface CanvasProps {}

const Controls = ({
  scale,
  centerRef,
}: {
  scale: number;
  centerRef: React.RefObject<HTMLDivElement>;
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
  const [widgetDimension, setWidgetDimension] = useState({
    width: 400,
    height: 300,
  });
  const [zoomDisabled, setZoomDisabled] = useState(false);
  const [scale, setScale] = useState(1);
  const centerRef = useRef<HTMLDivElement>(null);
  const [wallpaper, setWallpaper] = useState("");
  const initialStateLoading = useDataTrackStore(
    (state) => state.initialStateLoading
  );

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

  return (
    <div
      className={styles.canvas}
      style={
        wallpaper
          ? { backgroundImage: `url(${wallpaper})`, backgroundSize: "cover" }
          : {}
      }>
      <TransformWrapper
        minScale={0.2}
        initialScale={1}
        disabled={zoomDisabled}
        centerOnInit
        onTransformed={(_, { scale }) => {
          setScale(scale);
        }}>
        <Controls scale={scale} centerRef={centerRef} />
        <TransformComponent wrapperClass={styles.zoomWrapper}>
          <Dropable id="window">
            <ResizableBox
              minConstraints={[100, 100]}
              maxConstraints={[800, 600]}
              transformScale={scale}
              onResizeStart={() => {
                setZoomDisabled(true);
              }}
              onResizeStop={() => {
                setZoomDisabled(false);
                centerRef.current && centerRef.current.click();
              }}
              onResize={(_, { size }) => {
                setWidgetDimension(size);
              }}
              resizeHandles={["se"]}
              width={widgetDimension.width}
              height={widgetDimension.height}
              className={styles.widgetWindow}
              draggableOpts={{ grid: [1, 1] }}>
              <div className={styles.windowInfo}>
                {widgetDimension.width > 100 && <Text size={100}>Window</Text>}
                <Text size={100}>{`${Math.round(
                  widgetDimension.width
                )}px X ${Math.round(widgetDimension.height)}px`}</Text>
              </div>
            </ResizableBox>
          </Dropable>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default Canvas;
