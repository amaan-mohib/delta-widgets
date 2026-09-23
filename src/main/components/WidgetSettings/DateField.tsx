import {
  Body1Strong,
  Button,
  Caption1,
  Field,
  Input,
  Link,
  Select,
} from "@fluentui/react-components";
import React, { useEffect, useMemo, useState } from "react";
import { getMatches } from "../../../widget/utils/utils";
import { getManifestAsString } from "../../../common";
import { emitTo } from "@tauri-apps/api/event";
import { writeTextFile } from "@tauri-apps/plugin-fs";

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
  dateStr: defaultDateStr,
  manifestKey,
  manifestPath,
}) => {
  const timeZoneArray = useMemo(() => Intl.supportedValuesOf("timeZone"), []);
  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [formatValue, setFormatValue] = useState("");
  const [tzValue, setTzValue] = useState("");

  useEffect(() => {
    const dateVar = dateStr.replace(new RegExp(`${type}:|${type}`), "");
    const [format, timezone] = getMatches(dateVar);

    setFormatValue(format || "");
    setTzValue(timezone || "auto");
  }, [dateStr]);

  const onSubmit = async () => {
    try {
      if (!formatValue.trim()) {
        return;
      }
      const value = `{{${type}:${formatValue.trim()}${tzValue && tzValue !== "auto" ? `:[${tzValue}]` : ""}}}`;

      const manifestStr = await getManifestAsString(manifestPath);
      const escapedSearch = dateStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`{{${escapedSearch}}}`, "g");

      let occurrence = 0;
      const updated = manifestStr.replace(regex, (match) => {
        occurrence++;
        return occurrence === index + 1 ? value : match;
      });
      const widgetLabel = `widget-${manifestKey}`;
      await writeTextFile(manifestPath, updated);
      await emitTo(widgetLabel, "update-manifest", 1);
      setDateStr(value.replace(/{{|}}/g, ""));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Body1Strong style={{ textTransform: "capitalize" }}>
        {type} {index + 1}
      </Body1Strong>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 5,
        }}>
        <Field
          label={
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              <span>Format</span>
              <Link
                href="https://date-fns.org/docs/format"
                target="_blank"
                style={{ marginLeft: 5 }}>
                <Caption1>Help</Caption1>
              </Link>
            </span>
          }
          size="small">
          <Input
            value={formatValue}
            onChange={(_, { value }) => {
              setFormatValue(value);
            }}
            placeholder={
              type === "date"
                ? "yyyy-MM-dd"
                : type === "time"
                  ? "hh:mm aa"
                  : "eeee, MMMM d yyyy, h:mm aa"
            }
          />
        </Field>
        <Field label="Timezone" size="small">
          <Select
            value={tzValue}
            onChange={(_, { value }) => {
              setTzValue(value);
            }}>
            <option value={"auto"}>Automatic</option>
            {timeZoneArray.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </Field>
        <div style={{ marginTop: "auto" }}>
          <Button size="small" onClick={onSubmit}>
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateField;
