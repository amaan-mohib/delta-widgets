export interface IMedia {
  artist: string;
  title: string;
  is_current_session: boolean;
  playback_info: {
    controls: {
      next_enabled: boolean;
      pause_enabled: boolean;
      play_enabled: boolean;
      prev_enabled: boolean;
      repeat_enabled: boolean;
      shuffle_enabled: boolean;
      stop_enabled: boolean;
      toggle_enabled: boolean;
    },
    is_shuffle: boolean;
    status: "playing" | "paused" | "stopped" | "changing" | "opened" | "unknown";
  },
  player: {
    name: string;
    icon: number[];
  },
  player_id: string;
  thumbnail: number[];
  timeline_properties: {
    start_time: number;
    end_time: number;
    position: number;
  }
}