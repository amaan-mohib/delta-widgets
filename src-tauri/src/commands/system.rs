use std::{thread, time};

use serde_json::Value;
use sysinfo::Networks;
use tauri_plugin_system_info::SysInfoState;

fn get_network_speeds() -> Vec<serde_json::Value> {
    // First measurement
    let mut networks = Networks::new_with_refreshed_list();

    // Store initial values
    let initial_measurements: Vec<(String, u64, u64)> = networks
        .iter()
        .map(|(name, data)| {
            (
                name.to_string(),
                data.total_received(),
                data.total_transmitted(),
            )
        })
        .collect();

    // Wait for a specific duration to measure the delta
    thread::sleep(time::Duration::from_secs(1));

    // Second measurement
    networks.refresh(true);

    // Calculate speeds and return as JSON
    initial_measurements
        .iter()
        .map(|(name, initial_rx, initial_tx)| {
            if let Some(data) = networks.get(name) {
                // Calculate bytes per second
                let rx_speed = data.total_received().saturating_sub(*initial_rx);
                let tx_speed = data.total_transmitted().saturating_sub(*initial_tx);
                let ipv4_addr = data.ip_networks().iter().find(|ip| ip.addr.is_ipv4()).map(|ip| ip.addr.to_string()).unwrap_or_default();
                let ipv6_addr = data.ip_networks().iter().find(|ip| ip.addr.is_ipv6()).map(|ip| ip.addr.to_string()).unwrap_or_default();

                serde_json::json!({
                    "interface_name": name,
                    "download_speed_bytes": rx_speed,
                    "upload_speed_bytes": tx_speed,
                    "received_total": data.total_received(),
                    "transmitted_total": data.total_transmitted(),
                    "packets_received": data.packets_received(),
                    "packets_transmitted": data.packets_transmitted(),
                    "ip_address": data.ip_networks().iter().map(|ip| ip.addr.to_string()).collect::<Vec<_>>(),
                    "ipv4_address": ipv4_addr,
                    "ipv6_address": ipv6_addr,
                })
            } else {
                // Interface was removed between measurements
                serde_json::json!({
                    "interface_name": name,
                    "download_speed_bytes": 0,
                    "upload_speed_bytes": 0,
                    "received_total": 0,
                    "transmitted_total": 0,
                    "packets_received": 0,
                    "packets_transmitted": 0,
                    "ip_address": [],
                    "ipv4_address": "",
                    "ipv6_address": "",
                })
            }
        })
        .collect()
}

#[tauri::command]
pub async fn get_system_info(has_network: Option<bool>) -> Result<Value, ()> {
    let state = SysInfoState::default();
    let mut sysinfo = state.sysinfo.lock().unwrap();
    sysinfo.refresh_all();
    let cpus = sysinfo.sys.cpus();
    let mut total_cpu_speed: u64 = 0;
    let mut total_cpu_usage: f32 = 0.0;
    for cpu in cpus {
        total_cpu_speed += cpu.frequency();
        total_cpu_usage += cpu.cpu_usage();
    }
    let cpu_count = cpus.len();
    let cpu_speed = total_cpu_speed / cpu_count as u64;
    let cpu_usage = total_cpu_usage / cpu_count as f32;
    let cpu_brand = cpus[0].brand().to_string();
    let batteries = sysinfo.batteries().unwrap_or_default();
    let networks = if has_network.unwrap_or(false) {
        get_network_speeds()
    } else {
        vec![]
    };

    let info = serde_json::json!({
        "total_memory": sysinfo.total_memory(),
        "used_memory": sysinfo.used_memory(),
        "total_swap": sysinfo.total_swap(),
        "used_swap": sysinfo.used_swap(),
        "os_version": sysinfo.os_version(),
        "os_name": sysinfo.name(),
        "kernel_version": sysinfo.kernel_version(),
        "hostname": sysinfo.hostname(),
        "disks": sysinfo.disks(),
        "batteries": batteries,
        "cpus": sysinfo.cpus(),
        "cpu": serde_json::json!({
            "count": cpu_count,
            "speed": cpu_speed,
            "usage": cpu_usage,
            "brand": cpu_brand,
        }),
        "networks": networks,
    });
    Ok(info)
}
