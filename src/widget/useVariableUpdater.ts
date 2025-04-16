import { useEffect } from "react";
import {
  useDynamicTextStore,
  useVariableStore,
} from "./stores/useVariableStore";
import { format } from "date-fns";
import { Buffer } from "buffer";
import { formatDuration } from "./utils";

const useVariableUpdater = () => {
  const { currentDate, currentMedia, systemInfo } = useVariableStore();

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
          case "cpu":
            return JSON.stringify(systemInfo.cpu || "NA");
          case "battery":
            return JSON.stringify(systemInfo.batteries || []);
          case "disk":
            return JSON.stringify(systemInfo.disks || []);
          default:
            return "NA";
        }
      },
    });
  }, [systemInfo]);
};

export default useVariableUpdater;
