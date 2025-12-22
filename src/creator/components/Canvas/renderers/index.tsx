import React, { useEffect, useState } from "react";
import { IWidgetElement } from "../../../../types/manifest";
import Dropable from "../../DnD/Dropable";
import ImageComponent from "./ImageComponent";
import ButtonComponent from "./ButtonComponent";
import { parseDynamicText } from "../../../utils";
import MediaSelectComponent from "./MediaSelectComponent";
import DiskComponent from "./DiskComponent";
import SliderComponent from "./SliderComponent";
import ProgressComponent from "./ProgressComponent";
import FontPicker from "react-fontpicker-ts";
import { tokens } from "@fluentui/react-components";
import DropZone from "../../DnD/DropZone";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appCacheDir } from "@tauri-apps/api/path";
import { path } from "@tauri-apps/api";

interface ComponentRenderProps {
  component: IWidgetElement;
}

const getComponentStyles = (
  styles: IWidgetElement["styles"]
): React.CSSProperties => {
  const rowSpan = styles.gridItem?.rowSpan || 1;
  const colSpan = styles.gridItem?.columnSpan || 1;
  const hasImage = !!styles.backgroundImage;

  return {
    ...styles,
    ...(hasImage
      ? {
          backgroundImage: parseDynamicText(styles.backgroundImage || ""),
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: styles.backgroundSize || "auto",
        }
      : {}),
    ...(styles.gridSize
      ? {
          gridTemplateColumns:
            styles.gridSize.columns === "auto" ||
            styles.gridSize.columns === undefined
              ? "auto"
              : `repeat(${styles.gridSize.columns}, 1fr)`,
          gridTemplateRows:
            styles.gridSize.rows === "auto" ||
            styles.gridSize.rows === undefined
              ? "auto"
              : `repeat(${styles.gridSize.rows}, 1fr)`,
        }
      : {}),
    ...(styles.gridItem
      ? {
          gridRow: `span ${rowSpan} / span ${rowSpan}`,
          gridColumn: `span ${colSpan} / span ${colSpan}`,
        }
      : {}),
  };
};

const ComponentRender: React.FC<ComponentRenderProps> = ({ component }) => {
  const { id, type, styles, children = [], data } = component;
  const [bgImage, setBgImage] = useState("");

  useEffect(() => {
    if (!data?.imageData) return;
    (async () => {
      if (data.imageData.kind === "url") {
        setBgImage(data.imageData.path);
        return;
      }
      const dir = await path.resolve(
        await appCacheDir(),
        "assets",
        data.imageData?.key || ""
      );
      setBgImage(convertFileSrc(dir));
    })();
  }, [JSON.stringify(data?.imageData || {})]);

  if (type === "container" || type === "container-grid") {
    const flexDirection =
      (styles.flexDirection || "row") === "row" ? "row" : "column";

    return (
      <Dropable
        id={id}
        styles={getComponentStyles({
          ...styles,
          backgroundImage: data?.imageData
            ? `url('${bgImage}')`
            : styles.backgroundImage,
        })}
        disableDrop={children.length !== 0}>
        {children.length !== 0 && (
          <DropZone id={id} index={0} direction={flexDirection} />
        )}
        {children.map((child, index) => (
          <React.Fragment key={child.id}>
            <ComponentRender key={child.id} component={child} />
            <DropZone
              id={child.id}
              parentId={id}
              index={index + 1}
              direction={flexDirection}
              end
            />
          </React.Fragment>
        ))}
        {children.length !== 0 && (
          <DropZone
            id={id}
            index={children.length}
            direction={flexDirection}
            end
          />
        )}
      </Dropable>
    );
  }
  if (component.type === "text") {
    const fontFamily = component.styles.fontFamily;
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles(component.styles)}
        disableDrop>
        {fontFamily && fontFamily !== tokens.fontFamilyBase && (
          <FontPicker loadFonts={fontFamily} loaderOnly />
        )}
        <div
          id={`${component.id}-child`}
          dangerouslySetInnerHTML={{
            __html: parseDynamicText(component.data?.text || "Text"),
          }}></div>
      </Dropable>
    );
  }
  if (component.type === "image") {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles({ gridItem: component.styles.gridItem })}
        disableDrop>
        <ImageComponent component={component} />
      </Dropable>
    );
  }
  if (component.type === "button") {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles({
          gridItem: component.styles.gridItem,
          textAlign: component.styles.textAlign,
        })}
        disableDrop>
        <ButtonComponent component={component} />
      </Dropable>
    );
  }
  if (component.type === "slider" || component.type === "media-slider") {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles({ gridItem: component.styles.gridItem })}
        disableDrop>
        <SliderComponent component={component} />
      </Dropable>
    );
  }
  if (component.type === "media-select") {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles({ gridItem: component.styles.gridItem })}
        disableDrop>
        <MediaSelectComponent component={component} />
      </Dropable>
    );
  }
  if (
    component.type === "toggle-play" ||
    component.type === "media-next" ||
    component.type === "media-prev"
  ) {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles({
          gridItem: component.styles.gridItem,
          textAlign: component.styles.textAlign,
        })}
        disableDrop>
        <ButtonComponent
          component={{
            ...component,
            data: {
              ...(component.data || {}),
              icon:
                component.type === "toggle-play"
                  ? "PlayRegular"
                  : component.type === "media-next"
                  ? "NextRegular"
                  : "PreviousRegular",
            },
          }}
        />
      </Dropable>
    );
  }
  if (component.type === "disk-usage") {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles({
          ...component.styles,
          gridItem: component.styles.gridItem,
        })}
        disableDrop>
        <DiskComponent />
      </Dropable>
    );
  }
  if (component.type === "progress") {
    return (
      <Dropable
        id={component.id}
        styles={getComponentStyles({
          width: "100%",
          ...component.styles,
          minWidth: 150,
          gridItem: component.styles.gridItem,
        })}
        disableDrop>
        <ProgressComponent component={component} />
      </Dropable>
    );
  }
  return (
    <Dropable
      id={component.id}
      styles={getComponentStyles(component.styles)}
      disableDrop>
      Invalid
    </Dropable>
  );
};

export default ComponentRender;
