import React, { useState } from "react";
import { getManifestAsString } from "../../../common";
import { emitTo } from "@tauri-apps/api/event";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import DateFieldControl from "../../../common/components/DateField";

interface DateFieldProps {
  type: string;
  index: number;
  dateStr: string;
  manifestPath: string;
  manifestKey: string;
}

const DateField: React.FC<DateFieldProps> = ({
  type,
  index,
  dateStr,
  manifestKey,
  manifestPath,
}) => {
  const [currentDateStr, setCurrentDateStr] = useState(dateStr);

  const onSubmit = async (value: string) => {
    try {
      const manifestStr = await getManifestAsString(manifestPath);
      const escapedSearch = currentDateStr.replace(
        /[-\/\\^$*+?.()|[\]{}]/g,
        "\\$&",
      );
      const regex = new RegExp(`{{${escapedSearch}}}`, "g");

      let occurrence = 0;
      const updated = manifestStr.replace(regex, (match) => {
        occurrence++;
        return occurrence === index + 1 ? value : match;
      });
      const widgetLabel = `widget-${manifestKey}`;
      await writeTextFile(manifestPath, updated);
      await emitTo(widgetLabel, "update-manifest", 1);
      setCurrentDateStr(value.replace(/{{|}}/g, ""));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DateFieldControl
      type={type}
      index={index}
      dateStr={currentDateStr}
      onSubmit={onSubmit}
    />
  );
};

export default DateField;
