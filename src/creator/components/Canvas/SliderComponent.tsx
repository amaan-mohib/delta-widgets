import { Slider } from "@fluentui/react-components";
import { IWidgetElement } from "../../../types/manifest";

interface SliderComponentProps {
  component: IWidgetElement;
}

const SliderComponent: React.FC<SliderComponentProps> = ({ component }) => {
  return (
    <Slider
      id={`${component.id}-child`}
      onChange={(e) => e.stopPropagation()}
      value={parseInt(String(component.data?.current)) || 0}
      min={parseInt(String(component.data?.min)) || 0}
      max={parseInt(String(component.data?.max)) || 100}
      size={component.data?.size || "medium"}
    />
  );
};

export default SliderComponent;
