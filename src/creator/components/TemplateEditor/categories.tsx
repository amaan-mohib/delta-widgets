import {
  Braces20Regular,
  CalendarDate20Regular,
  Desktop20Regular,
  Play20Regular,
  WeatherSunny20Regular,
} from "@fluentui/react-icons";
import { TCustomFields } from "../../../types/manifest";

export interface ITemplate {
  id: string;
  label: string;
  value: string;
  description: string;
}
export interface ITemplateCategory {
  id: string;
  name: string;
  icon: JSX.Element;
  templates: ITemplate[];
}

export function getCustomFieldsTemplate(
  customFields: TCustomFields
): ITemplate[] {
  return Object.values(customFields).map((field) => ({
    id: field.key,
    label: field.label,
    value: `{{custom:${field.key}}}`,
    description: field.description || "",
  }));
}

const getTemplateCategories = (
  customFields: TCustomFields
): ITemplateCategory[] => [
  {
    id: "date",
    name: "Date & Time",
    icon: <CalendarDate20Regular />,
    templates: [
      {
        id: "date",
        label: "Date",
        value: "{{date}}",
        description: "Current date (YYYY/MM/DD)",
      },
      {
        id: "date-short",
        label: "Short Date",
        value: "{{date:MM/DD}}",
        description: "Short date format (MM/DD)",
      },
      {
        id: "date-long",
        label: "Long Date",
        value: "{{date:MMMM D, YYYY}}",
        description: "Long date format (Month Day, Year)",
      },
      {
        id: "time",
        label: "Time",
        value: "{{time}}",
        description: "Time in 12-hour format (default) (hh:mm AM/PM)",
      },
      {
        id: "time-12",
        label: "12h Time",
        value: "{{time:hh:mm aa}}",
        description: "Time in 12-hour format (hh:mm AM/PM)",
      },
      {
        id: "time-24",
        label: "24h Time",
        value: "{{time:HH:mm}}",
        description: "Time in 24-hour format (HH:mm)",
      },
      {
        id: "datetime",
        label: "Date & Time (default)",
        value: "{{datetime}}",
        description: "Date and time combined",
      },
      {
        id: "datetime2",
        label: "Date & Time",
        value: "{{datetime:MMMM d yyyy, h:mm aa}}",
        description: "Date and time combined",
      },
    ],
  },
  {
    id: "media",
    name: "Media",
    icon: <Play20Regular />,
    templates: [
      {
        id: "name",
        label: "Media Title",
        value: "{{media:title}}",
        description: "Title of the playing media",
      },
      {
        id: "artist",
        label: "Artist",
        value: "{{media:artist}}",
        description: "Artist of the playing media",
      },
      {
        id: "thumbnail",
        label: "Thumbnail",
        value: "{{media:thumbnail}}",
        description: "Thumbnail of the playing media",
      },
      {
        id: "status",
        label: "Media Status",
        value: "{{media:status}}",
        description: "Status of the current media",
      },
      {
        id: "player",
        label: "Media Player",
        value: "{{media:player}}",
        description: "Application currently playing the media",
      },
      {
        id: "player_icon",
        label: "Media Player Icon",
        value: "{{media:player_icon}}",
        description: "Icon of the Application playing the media",
      },
      {
        id: "position",
        label: "Position",
        value: "{{media:position}}",
        description: "Current timeline position of the playing media",
      },
      {
        id: "duration",
        label: "Duration",
        value: "{{media:duration}}",
        description: "Current timeline duration of the playing media",
      },
      {
        id: "position_text",
        label: "Position (Formatted)",
        value: "{{media:position_text}}",
        description: "Formatted current timeline position of the playing media",
      },
      {
        id: "duration_text",
        label: "Duration (Formatted)",
        value: "{{media:duration_text}}",
        description: "Formatted current timeline duration of the playing media",
      },
    ],
  },
  {
    id: "system",
    name: "System",
    icon: <Desktop20Regular />,
    templates: [
      {
        id: "os",
        label: "Operating System",
        value: "{{system:os}}",
        description: "Operating system name",
      },
      {
        id: "os_version",
        label: "OS Version",
        value: "{{system:os_version}}",
        description: "Operating system version",
      },
      {
        id: "kernel",
        label: "Kernel",
        value: "{{system:kernel}}",
        description: "Kernel version",
      },
      {
        id: "hostname",
        label: "Hostname",
        value: "{{system:hostname}}",
        description: "System hostname",
      },
      {
        id: "cpu_model",
        label: "CPU Model",
        value: "{{system:cpu_model}}",
        description: "CPU Model name",
      },
      {
        id: "cpu_lcores",
        label: "CPU Logical processors",
        value: "{{system:cpu_lcores}}",
        description: "CPU Logical processors count",
      },
      {
        id: "cpu_usage",
        label: "CPU Usage",
        value: "{{system:cpu_usage}}",
        description: "CPU Usage percentage",
      },
      {
        id: "cpu_speed",
        label: "CPU Speed",
        value: "{{system:cpu_speed}}",
        description: "CPU Average Speed (in GHz)",
      },
      {
        id: "memory_total",
        label: "Memory Total",
        value: "{{system:memory_total}}",
        description: "Total Memory (in human readable format)",
      },
      {
        id: "memory_used",
        label: "Memory Used",
        value: "{{system:memory_used}}",
        description: "Used Memory (in human readable format)",
      },
      {
        id: "memory_available",
        label: "Memory Available",
        value: "{{system:memory_available}}",
        description: "Available Memory (in human readable format)",
      },
      {
        id: "memory_total_bytes",
        label: "Memory Total (Bytes)",
        value: "{{system:memory_total_bytes}}",
        description: "Total Memory (in bytes)",
      },
      {
        id: "memory_used_bytes",
        label: "Memory Used (Bytes)",
        value: "{{system:memory_used_bytes}}",
        description: "Used Memory (in bytes)",
      },
      {
        id: "memory_available_bytes",
        label: "Memory Available (Bytes)",
        value: "{{system:memory_available_bytes}}",
        description: "Available Memory (in bytes)",
      },
      {
        id: "battery_model",
        label: "Battery Model",
        value: "{{system:battery_model}}",
        description: "Model of battery",
      },
      {
        id: "battery_vendor",
        label: "Battery Vendor",
        value: "{{system:battery_vendor}}",
        description: "Battery manufacturer/vendor",
      },
      {
        id: "battery_health",
        label: "Battery Health (%)",
        value: "{{system:battery_health}}",
        description: "Battery health percentage",
      },
      {
        id: "battery_charge",
        label: "Battery Charge (%)",
        value: "{{system:battery_charge}}",
        description: "Current battery charge percentage",
      },
      {
        id: "battery_cycles",
        label: "Battery Cycles",
        value: "{{system:battery_cycles}}",
        description: "Number of battery charge cycles",
      },
      {
        id: "battery_technology",
        label: "Battery Technology",
        value: "{{system:battery_technology}}",
        description: "Battery technology type",
      },
    ],
  },
  {
    id: "weather",
    name: "Weather",
    icon: <WeatherSunny20Regular />,
    templates: [
      {
        id: "city",
        label: "City",
        value: "{{weather:city}}",
        description: "Current city location",
      },
      {
        id: "region",
        label: "Region",
        value: "{{weather:region}}",
        description: "Current region/state",
      },
      {
        id: "country",
        label: "Country",
        value: "{{weather:country}}",
        description: "Current country",
      },
      {
        id: "temperature_celsius",
        label: "Temperature (°C)",
        value: "{{weather:temperature_celsius}}",
        description: "Current temperature in Celsius",
      },
      {
        id: "temperature_fahrenheit",
        label: "Temperature (°F)",
        value: "{{weather:temperature_fahrenheit}}",
        description: "Current temperature in Fahrenheit",
      },
      {
        id: "humidity",
        label: "Humidity",
        value: "{{weather:humidity}}",
        description: "Current humidity percentage",
      },
      {
        id: "description",
        label: "Weather Description",
        value: "{{weather:description}}",
        description: "Current weather conditions description",
      },
      {
        id: "icon",
        label: "Weather Icon",
        value: "{{weather:icon}}",
        description: "Icon representing current weather conditions",
      },
      {
        id: "precip_mm",
        label: "Precipitation (mm)",
        value: "{{weather:precip_mm}}",
        description: "Precipitation amount in millimeters",
      },
      {
        id: "precip_in",
        label: "Precipitation (in)",
        value: "{{weather:precip_in}}",
        description: "Precipitation amount in inches",
      },
      {
        id: "pressure_mb",
        label: "Pressure (mb)",
        value: "{{weather:pressure_mb}}",
        description: "Atmospheric pressure in millibars",
      },
      {
        id: "pressure_in",
        label: "Pressure (in)",
        value: "{{weather:pressure_in}}",
        description: "Atmospheric pressure in inches",
      },
      {
        id: "uv_index",
        label: "UV Index",
        value: "{{weather:uv_index}}",
        description: "Ultraviolet index",
      },
    ],
  },
  {
    id: "custom",
    name: "Custom Fields",
    icon: <Braces20Regular />,
    templates: getCustomFieldsTemplate(customFields),
  },
];

export default getTemplateCategories;
