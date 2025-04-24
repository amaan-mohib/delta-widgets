import { Slider } from "@fluentui/react-components";
import { IWidgetElement } from "../../../types/manifest";

interface SliderComponentProps {
  component: IWidgetElement;
}

const SliderComponent: React.FC<SliderComponentProps> = ({ component }) => {
  return (
    <Slider
      id={`${component.id}-child`}
      style={{ width: "100%" }}
      onChange={(e) => e.stopPropagation()}
      value={parseFloat(String(component.data?.current)) || 0}
      min={parseFloat(String(component.data?.min)) || 0}
      max={parseFloat(String(component.data?.max)) || 100}
      size={component.data?.size || "medium"}
    />
  );
};

export default SliderComponent;
