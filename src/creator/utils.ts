import {
  SpinButtonChangeEvent,
  SpinButtonOnChangeData,
} from "@fluentui/react-components";

export const spinButtonOnChange = (
  event: SpinButtonChangeEvent,
  data: SpinButtonOnChangeData,
  onChange: (value: number) => void,
  defaultValue?: number
) => {
  onChange(
    Number(
      data.value ||
        (event.target as HTMLInputElement).value ||
        defaultValue ||
        0
    )
  );
};

const formatVariable = (key: string) => (format?: string): string => {
  const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
  return key === "media" && format === "thumbnail"
    ? "https://placehold.co/400x400?text=Thumbnail"
    : key === "weather" && format === "icon"
    ? "https://placehold.co/400x400?text=Weather"
    : `${capitalizedKey}${format ? ` (${format})` : ""}`;
};

const textVariables: Record<string, (format?: string) => string> = [
  "date",
  "time",
  "datetime",
  "media",
  "system",
  "weather",
  "misc",
  "custom",
].reduce(
  (acc, key) => ({
    ...acc,
    [key]: formatVariable(key),
  }),
  {}
);

export const parseDynamicText = (text: string) => {
  return text.replace(
    /\{\{(\w+)(?::([^}]+))?\}\}/g,
    (match, key, formatStr) => {
      if (textVariables[key]) {
        return textVariables[key](formatStr);
      }
      return match;
    }
  );
};
