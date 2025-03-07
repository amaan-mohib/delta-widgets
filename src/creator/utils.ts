import { SpinButtonChangeEvent, SpinButtonOnChangeData } from "@fluentui/react-components";

export const spinButtonOnChange = (
  event: SpinButtonChangeEvent,
  data: SpinButtonOnChangeData,
  onChange: (value: number) => void,
  defaultValue?: number
) => {
  onChange(Number(
    data.value || (event.target as HTMLInputElement).value || defaultValue || 0
  ))
}