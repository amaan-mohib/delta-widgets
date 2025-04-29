import { useEffect } from "react";
import {
  useDynamicTextStore,
  useVariableStore,
} from "./stores/useVariableStore";
import { format } from "date-fns";
import { Buffer } from "buffer";
import { formatDuration, humanStorageSize } from "./utils/utils";

const useVariableUpdater = () => {
  const {
    currentDate,
    currentMedia,
    systemInfo,
    weatherInfo,
  } = useVariableStore();

  useEffect(() => {
    useDynamicTextStore.setState({
      date: (formatStr?: string) => {
        try {
          return format(currentDate, formatStr || "yyyy-MM-dd");
        } catch (error) {
          return "Invalid date or format";
        }
      },
      time: (formatStr?: string) => {
        try {
          return format(currentDate, formatStr || "hh:mm aa");
        } catch (error) {
          return "Invalid date or format";
        }
      },
      datetime: (formatStr?: string) => {
        try {
          return format(currentDate, formatStr || "eeee, MMMM d yyyy, h:mm aa");
        } catch (error) {
          console.log(error);

          return "Invalid date or format";
        }
      },
    });
  }, [currentDate]);

  useEffect(() => {
    if (!currentMedia) return;

    useDynamicTextStore.setState({
      media: (formatStr?: string) => {
        switch (formatStr) {
          case "artist":
            return currentMedia.artist || "NA";
          case "title":
            return currentMedia.title || "NA";
          case "player":
            return currentMedia.player.name || currentMedia.player_id || "NA";
          case "status":
            return currentMedia.playback_info.status || "NA";
          case "thumbnail":
            const thumbnail =
              currentMedia.thumbnail.length > 0
                ? currentMedia.thumbnail
                : currentMedia.player.icon.length > 0
                ? currentMedia.player.icon
                : [];

            return thumbnail.length > 0
              ? `data:image/png;base64,${Buffer.from(thumbnail).toString(
                  "base64"
                )}`
              : "https://cdn.pixabay.com/photo/2017/03/13/04/25/play-button-2138735_1280.png";
          case "player_icon":
            return currentMedia.player.icon &&
              currentMedia.player.icon.length > 0
              ? `data:image/png;base64,${Buffer.from(
                  currentMedia.player.icon
                ).toString("base64")}`
              : "https://i.pinimg.com/736x/bd/47/48/bd47480253e31367320c6f31eb2844ea.jpg";
          case "position":
            return String(currentMedia.timeline_properties.position) || "0";
          case "duration":
            return String(
              currentMedia.timeline_properties.end_time -
                currentMedia.timeline_properties.start_time || "0"
            );
          case "position_text":
            return formatDuration(
              Number(currentMedia.timeline_properties.position) || 0
            );
          case "duration_text":
            return formatDuration(
              Number(
                currentMedia.timeline_properties.end_time -
                  currentMedia.timeline_properties.start_time || "0"
              )
            );
          case "next_enabled":
            return (
              String(currentMedia.playback_info.controls.next_enabled) ||
              "false"
            );
          case "prev_enabled":
            return (
              String(currentMedia.playback_info.controls.prev_enabled) ||
              "false"
            );
          case "play_enabled":
            return (
              String(currentMedia.playback_info.controls.play_enabled) ||
              "false"
            );
          case "pause_enabled":
            return (
              String(currentMedia.playback_info.controls.pause_enabled) ||
              "false"
            );
          case "stop_enabled":
            return (
              String(currentMedia.playback_info.controls.stop_enabled) ||
              "false"
            );
          case "shuffle_enabled":
            return (
              String(currentMedia.playback_info.controls.shuffle_enabled) ||
              "false"
            );
          case "repeat_enabled":
            return (
              String(currentMedia.playback_info.controls.repeat_enabled) ||
              "false"
            );
          case "toggle_enabled":
            return (
              String(currentMedia.playback_info.controls.toggle_enabled) ||
              "false"
            );
          default:
            return "NA";
        }
      },
    });
  }, [currentMedia]);

  useEffect(() => {
    if (!systemInfo || Object.keys(systemInfo).length === 0) return;

    const battery = systemInfo.batteries?.[0];
    useDynamicTextStore.setState({
      system: (formatStr?: string) => {
        switch (formatStr) {
          case "hostname":
            return systemInfo.hostname || "NA";
          case "os":
            return (
              [systemInfo.os_name || "", systemInfo.os_version || ""]
                .filter(Boolean)
                .join(" ") || "NA"
            );
          case "os_version":
            return systemInfo.os_version || "NA";
          case "kernel":
            return systemInfo.kernel_version || "NA";
          case "cpu_model":
            return systemInfo.cpu?.brand || "NA";
          case "cpu_lcores":
            return String(systemInfo.cpu?.count || 0);
          case "cpu_usage":
            return `${parseFloat(String(systemInfo.cpu?.usage || 0)).toFixed(
              1
            )}%`;
          case "cpu_speed":
            return `${parseFloat(
              String((systemInfo.cpu?.speed || 0) / 1000)
            ).toFixed(2)} Ghz`;
          case "memory_total":
            return humanStorageSize(systemInfo.total_memory || 0);
          case "memory_used":
            return humanStorageSize(systemInfo.used_memory || 0);
          case "memory_available":
            return humanStorageSize(
              (systemInfo.total_memory || 0) - (systemInfo.used_memory || 0)
            );
          case "memory_total_bytes":
            return String(systemInfo.total_memory || 0);
          case "memory_used_bytes":
            return String(systemInfo.used_memory || 0);
          case "memory_available_bytes":
            return String(
              (systemInfo.total_memory || 0) - (systemInfo.used_memory || 0)
            );
          case "swap_total":
            return humanStorageSize(systemInfo.total_swap || 0);
          case "swap_used":
            return humanStorageSize(systemInfo.used_swap || 0);
          case "swap_available":
            return humanStorageSize(
              (systemInfo.total_swap || 0) - (systemInfo.used_swap || 0)
            );
          case "swap_total_bytes":
            return String(systemInfo.total_swap || 0);
          case "swap_used_bytes":
            return String(systemInfo.used_swap || 0);
          case "swap_available_bytes":
            return String(
              (systemInfo.total_swap || 0) - (systemInfo.used_swap || 0)
            );
          case "battery_model":
            return battery?.model || "NA";
          case "battery_vendor":
            return battery?.vendor || "NA";
          case "battery_health":
            return parseFloat(
              String((battery?.state_of_health || 0) * 100)
            ).toFixed();
          case "battery_charge":
            return parseFloat(
              String((battery?.state_of_charge || 0) * 100)
            ).toFixed();
          case "battery_cycles":
            return String(battery?.cycle_count || 0);
          case "battery_technology":
            return battery?.technology || "NA";
          default:
            return "NA";
        }
      },
    });
  }, [systemInfo]);

  useEffect(() => {
    if (!weatherInfo || Object.keys(weatherInfo).length === 0) return;

    useDynamicTextStore.setState({
      weather: (formatStr?: string) => {
        switch (formatStr) {
          case "city":
            return weatherInfo.location?.name || "NA";
          case "region":
            return weatherInfo.location?.region || "NA";
          case "country":
            return weatherInfo.location?.country || "NA";
          case "temperature_celsius":
            return `${parseFloat(
              String(weatherInfo.current?.temp_c || 0)
            ).toFixed(1)}°C`;
          case "temperature_fahrenheit":
            return `${parseFloat(
              String(weatherInfo.current?.temp_f || 0)
            ).toFixed(1)}°F`;
          case "humidity":
            return `${parseFloat(
              String(weatherInfo.current?.humidity || 0)
            ).toFixed(1)}%`;
          case "description":
            return weatherInfo.current?.condition.text || "NA";
          case "icon":
            return weatherInfo.current?.condition.icon || "";
          case "precip_mm":
            return `${weatherInfo.current?.precip_mm}mm`;
          case "precip_in":
            return `${weatherInfo.current?.precip_in}in`;
          case "pressure_mb":
            return `${weatherInfo.current?.pressure_mb}mb`;
          case "pressure_in":
            return `${weatherInfo.current?.pressure_in}in`;
          case "uv_index":
            return `${weatherInfo.current?.uv || 0}`;
          default:
            return "NA";
        }
      },
    });
  }, [weatherInfo]);
};

export default useVariableUpdater;
