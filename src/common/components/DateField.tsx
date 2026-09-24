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
import { getMatches } from "../../widget/utils/utils";

export interface DateFieldProps {
  type: string;
  index?: number;
  dateStr: string;
  onSubmit: (value: string) => void | Promise<void>;
}

const DateField: React.FC<DateFieldProps> = ({
  type,
  index,
  dateStr,
  onSubmit,
}) => {
  const timeZoneArray = useMemo(() => Intl.supportedValuesOf("timeZone"), []);
  const [formatValue, setFormatValue] = useState("");
  const [tzValue, setTzValue] = useState("");

  useEffect(() => {
    const dateVar = dateStr.replace(new RegExp(`${type}:|${type}`), "");
    const [format, timezone] = getMatches(dateVar);

    setFormatValue(format || "");
    setTzValue(timezone || "auto");
  }, [dateStr, type]);

  const handleSubmit = async () => {
    const format = formatValue.trim();

    const value = `{{${type}${format ? `:${format}` : ""}${tzValue && tzValue !== "auto" ? `:[${tzValue}]` : ""}}}`;
    await onSubmit(value);
  };

  return (
    <div>
      <Body1Strong style={{ textTransform: "capitalize" }}>
        {type} {index === undefined ? "" : index + 1}
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
            onChange={(_, { value }) => setFormatValue(value)}
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
            onChange={(_, { value }) => setTzValue(value)}>
            <option value="auto">Automatic</option>
            {timeZoneArray.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
            <option value="UTC">Coordinated Universal Time (UTC)</option>
          </Select>
        </Field>
        <div style={{ marginTop: "auto" }}>
          <Button size="small" onClick={handleSubmit}>
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateField;
