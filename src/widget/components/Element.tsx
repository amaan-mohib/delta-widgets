import React from "react";
import ImageComponent from "./ImageComponent";
import SliderComponent from "./SliderComponent";
import { IWidgetElement } from "../../types/manifest";
import ButtonComponent from "./ButtonComponent";
import TextComponent from "./TextComponent";
import PlayButton from "./media-components/PlayButton";
import NextButton from "./media-components/NextButton";
import PrevButton from "./media-components/PrevButton";
import MediaSlider from "./media-components/MediaSlider";

interface ElementProps {
  component: IWidgetElement;
}

const getComponentStyles = (
  styles: IWidgetElement["styles"]
): React.CSSProperties => {
  const rowSpan = styles.gridItem?.rowSpan || 1;
  const colSpan = styles.gridItem?.columnSpan || 1;

  return {
    ...styles,
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

const Element: React.FC<ElementProps> = ({ component }) => {
  if (component.type === "container" || component.type === "container-grid") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({
          ...component.styles,
          borderRadius: component.styles.borderRadius || 2,
        })}>
        {component.children &&
          component.children.length > 0 &&
          component.children.map((child) => (
            <Element key={child.id} component={child} />
          ))}
      </div>
    );
  }
  if (component.type === "text") {
    return (
      <div id={component.id} style={getComponentStyles(component.styles)}>
        <TextComponent component={component} />
      </div>
    );
  }
  if (component.type === "image") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({ gridItem: component.styles.gridItem })}>
        <ImageComponent component={component} />
      </div>
    );
  }
  if (component.type === "button") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({
          gridItem: component.styles.gridItem,
          textAlign: component.styles.textAlign,
        })}>
        <ButtonComponent component={component} />
      </div>
    );
  }
  if (component.type === "slider") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({ gridItem: component.styles.gridItem })}>
        <SliderComponent component={component} />
      </div>
    );
  }
  if (component.type === "toggle-play") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({
          gridItem: component.styles.gridItem,
          textAlign: component.styles.textAlign,
        })}>
        <PlayButton component={component} />
      </div>
    );
  }
  if (component.type === "media-next") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({
          gridItem: component.styles.gridItem,
          textAlign: component.styles.textAlign,
        })}>
        <NextButton component={component} />
      </div>
    );
  }
  if (component.type === "media-prev") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({
          gridItem: component.styles.gridItem,
          textAlign: component.styles.textAlign,
        })}>
        <PrevButton component={component} />
      </div>
    );
  }
  if (component.type === "media-slider") {
    return (
      <div
        id={component.id}
        style={getComponentStyles({ gridItem: component.styles.gridItem })}>
        <MediaSlider component={component} />
      </div>
    );
  }
  return (
    <div id={component.id} style={getComponentStyles(component.styles)}>
      Invalid
    </div>
  );
};

export default Element;
