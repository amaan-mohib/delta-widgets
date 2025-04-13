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
    };
    is_shuffle: boolean;
    status:
      | "playing"
      | "paused"
      | "stopped"
      | "changing"
      | "opened"
      | "unknown";
  };
  player: {
    name: string;
    icon: number[];
  };
  player_id: string;
  thumbnail: number[];
  timeline_properties: {
    start_time: number;
    end_time: number;
    position: number;
  };
}

interface Battery {
  cycle_count: number;
  energy: number;
  energy_full: number;
  energy_full_design: number;
  energy_rate: number;
  model: string;
  serial_number: string;
  state: string;
  state_of_charge: number;
  state_of_health: number;
  technology: string;
  temperature_celsius: number | null;
  temperature_fahrenheit: number | null;
  temperature_kelvin: number | null;
  time_to_empty: number | null;
  time_to_full: number | null;
  vendor: string;
  voltage: number;
}

interface CpuSummary {
  brand: string;
  count: number;
  speed: number;
  usage: number;
}

interface CpuCore {
  brand: string;
  cpu_usage: number;
  frequency: number;
  name: string;
  vendor_id: string;
}

type DiskKind = "SSD" | "HDD" | { Unknown: number };

interface Disk {
  available_space: number;
  file_system: string;
  is_removable: boolean;
  kind: DiskKind;
  mount_point: string;
  name: string;
  total_space: number;
}

export interface ISystemInformation {
  batteries: Battery[];
  cpu: CpuSummary;
  cpus: CpuCore[];
  disks: Disk[];
  hostname: string;
  kernel_version: string;
  os_name: string;
  os_version: string;
  total_memory: number;
  used_memory: number;
}
