import { Slider } from "@fluentui/react-components";
import { IWidgetElement } from "../../types/manifest";
import { useDynamicTextStore } from "../stores/useVariableStore";
import { useEffect, useMemo, useState } from "react";
import { parseDynamicText } from "../utils";

interface SliderComponentProps {
  component: IWidgetElement;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

const SliderComponent: React.FC<SliderComponentProps> = ({
  component,
  onChange,
  disabled,
}) => {
  const textVariables = useDynamicTextStore();
  const [value, setValue] = useState<number>(0);
  const [timer, setTimer] = useState(0);

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (timer > 0) {
        setValue(parseInt(current) || 0);
      }
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [timer, current]);

  return (
    <Slider
      style={{ width: "100%" }}
      id={`${component.id}-child`}
      onChange={(e, { value }) => {
        e.stopPropagation();
        if (onChange) {
          onChange(value);
        }
        setTimer(0);
        setValue(value);
      }}
      value={value || parseInt(current) || 0}
      min={parseInt(min) || 0}
      max={parseInt(max) || 100}
      size={component.data?.size || "medium"}
      disabled={disabled}
    />
  );
};

export default SliderComponent;
