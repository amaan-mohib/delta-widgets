import { Slider } from "@fluentui/react-components";
import { IWidgetElement } from "../../types/manifest";
import { useDynamicTextStore } from "../stores/useVariableStore";
import { useMemo } from "react";
import { parseDynamicText } from "../utils";

interface SliderComponentProps {
  component: IWidgetElement;
}

const SliderComponent: React.FC<SliderComponentProps> = ({ component }) => {
  const textVariables = useDynamicTextStore();
  const { current, min, max } = useMemo(
    () => ({
      current: parseDynamicText(
        String(component.data?.current || "0"),
        textVariables
      ),
      min: parseDynamicText(String(component.data?.min || "0"), textVariables),
      max: parseDynamicText(
        String(component.data?.max || "100"),
        textVariables
      ),
    }),
    [textVariables]
  );

  return (
    <Slider
      id={`${component.id}-child`}
      onChange={(e, { value }) => {
        e.stopPropagation();
        console.log(value);
      }}
      value={parseInt(current) || 0}
      min={parseInt(min) || 0}
      max={parseInt(max) || 100}
      size={component.data?.size || "medium"}
    />
  );
};

export default SliderComponent;
