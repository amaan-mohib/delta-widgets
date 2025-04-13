use tauri_plugin_system_info::SysInfoState;

#[tauri::command]
pub async fn get_system_info() -> Result<serde_json::Value, ()> {
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
    let info = serde_json::json!({
        "total_memory": sysinfo.total_memory(),
        "used_memory": sysinfo.used_memory(),
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
    });
    Ok(info)
}
