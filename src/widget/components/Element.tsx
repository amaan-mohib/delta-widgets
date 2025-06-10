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
import MediaSelect from "./media-components/MediaSelect";
import DiskComponent from "./DiskComponent";
import ProgressComponent from "./ProgressComponent";

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

interface IWrapperElementProps {
  styles?: (keyof IWidgetElement["styles"] | "default")[];
}
const WrapperElement: React.FC<
  IWrapperElementProps & ElementProps & React.PropsWithChildren
> = ({ component, styles, children }) => {
  let style: React.CSSProperties = {};
  if (styles) {
    styles.forEach((key) => {
      if (key === "default") {
        style = {
          ...style,
          ...component.styles,
        };
      } else {
        style = {
          ...style,
          [key]: component.styles[key],
        };
      }
    });
  } else {
    style = component.styles;
  }

  return (
    <div
      className={component.data?.className}
      id={component.id}
      style={getComponentStyles(style)}>
      {children}
    </div>
  );
};

const Element: React.FC<ElementProps> = ({ component }) => {
  if (component.type === "container" || component.type === "container-grid") {
    return (
      <WrapperElement
        component={{
          ...component,
          styles: {
            ...component.styles,
            borderRadius: component.styles.borderRadius || 2,
          },
        }}>
        {component.children &&
          component.children.length > 0 &&
          component.children.map((child) => (
            <Element key={child.id} component={child} />
          ))}
      </WrapperElement>
    );
  }
  if (component.type === "text") {
    return (
      <WrapperElement component={component}>
        <TextComponent component={component} />
      </WrapperElement>
    );
  }
  if (component.type === "image") {
    return (
      <WrapperElement component={component} styles={["gridItem"]}>
        <ImageComponent component={component} />
      </WrapperElement>
    );
  }
  if (component.type === "button") {
    return (
      <WrapperElement component={component} styles={["gridItem", "textAlign"]}>
        <ButtonComponent component={component} />
      </WrapperElement>
    );
  }
  if (component.type === "slider") {
    return (
      <WrapperElement component={component} styles={["gridItem"]}>
        <SliderComponent component={component} />
      </WrapperElement>
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
      <WrapperElement component={component} styles={["gridItem", "textAlign"]}>
        <NextButton component={component} />
      </WrapperElement>
    );
  }
  if (component.type === "media-prev") {
    return (
      <WrapperElement component={component} styles={["gridItem", "textAlign"]}>
        <PrevButton component={component} />
      </WrapperElement>
    );
  }
  if (component.type === "media-slider") {
    return (
      <WrapperElement component={component} styles={["gridItem"]}>
        <MediaSlider component={component} />
      </WrapperElement>
    );
  }
  if (component.type === "media-select") {
    return (
      <WrapperElement component={component} styles={["gridItem"]}>
        <MediaSelect component={component} />
      </WrapperElement>
    );
  }
  if (component.type === "disk-usage") {
    return (
      <WrapperElement component={component} styles={["default", "gridItem"]}>
        <DiskComponent />
      </WrapperElement>
    );
  }
  if (component.type === "progress") {
    return (
      <WrapperElement
        component={{
          ...component,
          styles: {
            ...component.styles,
            width: "100%",
            minWidth: 150,
            gridItem: component.styles.gridItem,
          },
        }}
        styles={["default", "gridItem"]}>
        <ProgressComponent component={component} />
      </WrapperElement>
    );
  }
  return (
    <div id={component.id} style={getComponentStyles(component.styles)}>
      Invalid
    </div>
  );
};

export default Element;
