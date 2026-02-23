const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface TelemetryEvent {
  id: number
  device_id: string
  ts: string
  lat: number | null
  lon: number | null
  speed_kmh: number | null
  engine_temp_c: number | null
  battery_v: number | null
}

export interface DeviceStatus {
  device_id: string
  online: boolean
  last_seen: string
  last_lat: number | null
  last_lon: number | null
  last_speed: number | null
  last_temp: number | null
  last_battery: number | null
}

export interface MetricsSummary {
  devices_online: number
  events_last_minute: number
  avg_speed_5min: number
  alerts_last_10min: number
}

export interface Alert {
  id: number
  device_id: string
  ts: string
  alert_type: string
  value: number
  message: string
}

export const api = {
  async healthCheck(): Promise<any> {
    const res = await fetch(`${API_URL}/health`)
    if (!res.ok) throw new Error('Backend offline')
    return res.json()
  },

  async getDevices(): Promise<DeviceStatus[]> {
    const res = await fetch(`${API_URL}/devices`)
    if (!res.ok) throw new Error('Failed to fetch devices')
    return res.json()
  },

  async getDeviceLatest(deviceId: string): Promise<TelemetryEvent> {
    const res = await fetch(`${API_URL}/devices/${deviceId}/latest`)
    if (!res.ok) throw new Error('Failed to fetch device')
    return res.json()
  },

  async getDeviceEvents(
    deviceId: string, 
    minutes: number = 60, 
    limit: number = 500
  ): Promise<TelemetryEvent[]> {
    const res = await fetch(
      `${API_URL}/devices/${deviceId}/events?minutes=${minutes}&limit=${limit}`
    )
    if (!res.ok) throw new Error('Failed to fetch events')
    return res.json()
  },

  async getMetrics(minutes: number = 5): Promise<MetricsSummary> {
    const res = await fetch(`${API_URL}/metrics/summary?minutes=${minutes}`)
    if (!res.ok) throw new Error('Failed to fetch metrics')
    return res.json()
  },

  // Alias for backwards compatibility
  async getMetricsSummary(minutes: number = 5): Promise<MetricsSummary> {
    return this.getMetrics(minutes)
  },

  async getAlerts(minutes: number = 10): Promise<Alert[]> {
    const res = await fetch(`${API_URL}/alerts?minutes=${minutes}`)
    if (!res.ok) throw new Error('Failed to fetch alerts')
    return res.json()
  },
}
