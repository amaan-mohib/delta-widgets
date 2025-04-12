import { intervalToDuration } from "date-fns";

export const parseDynamicText = (
  text: string,
  textVariables: Record<string, (format?: string) => string>
) => {
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

export const formatDuration = (duration: number) => {
  const { hours, minutes, seconds } = intervalToDuration({
    start: 0,
    end: duration,
  });
  const zeroPad = (num: any) => String(num).padStart(2, "0");

  const formatted = [hours || 0, minutes || 0, seconds || 0]
    .map((value, index) =>
      index === 0 && hours ? hours : index !== 0 ? value : null
    )
    .filter((item) => item !== null)
    .map(zeroPad)
    .join(":");
  return formatted;
};
