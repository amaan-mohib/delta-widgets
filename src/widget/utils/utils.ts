import { path } from "@tauri-apps/api";
import { exists, writeFile } from "@tauri-apps/plugin-fs";
import { format, intervalToDuration } from "date-fns";
import { toBlob } from "html-to-image";
import { IWidget } from "../../types/manifest";
import { formatInTimeZone } from "date-fns-tz";

const DATE_REGEX = /^(.+?)(?::\[(.+?)\])?$/g;

export const parseDynamicText = (
  text: string,
  textVariables: Record<string, (format?: string) => string>
) => {
  return text.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (_, key, formatStr) => {
    if (textVariables[key]) {
      return textVariables[key](formatStr);
    }
    return "Loading...";
  });
};

const getMatches = (str: string, regex: RegExp) => {
  let matches: string[] = [];
  str.replace(regex, (_, dateStr, timezone) => {
    matches = [dateStr, timezone];
    return "";
  });
  if (matches.length === 0) {
    return [str];
  }
  return matches;
};

export const formatDate = (date: Date, formatStr: string) => {
  const [dateStr, timezone] = getMatches(formatStr, DATE_REGEX);
  if (timezone) {
    return formatInTimeZone(date, timezone, dateStr);
  }
  return format(date, dateStr);
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

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export function humanStorageSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}

export const createThumb = async (manifest: IWidget) => {
  document.querySelectorAll("link").forEach((link) => {
    link.setAttribute("crossorigin", "anonymous");
  });
  const thumbPath = await path.resolve(manifest.path, "..", "thumb.png");
  const thumbExists = await exists(thumbPath);
  if (thumbExists) return;

  const blob = await toBlob(document.getElementById("widget-window")!);
  if (blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await writeFile(thumbPath, buffer);
  }
};
