from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TelemetryEvent(BaseModel):
    device_id: str
    ts: datetime
    lat: Optional[float] = None
    lon: Optional[float] = None
    speed_kmh: Optional[float] = None
    engine_temp_c: Optional[float] = None
    battery_v: Optional[float] = None

class DeviceStatus(BaseModel):
    device_id: str
    online: bool
    last_seen: datetime
    last_lat: Optional[float] = None
    last_lon: Optional[float] = None
    last_speed: Optional[float] = None
    last_temp: Optional[float] = None
    last_battery: Optional[float] = None

class MetricsSummary(BaseModel):
    devices_online: int
    events_last_minute: int
    avg_speed_5min: float
    alerts_last_10min: int

class Alert(BaseModel):
    id: int
    device_id: str
    ts: datetime
    alert_type: str
    value: float
    message: str

# ==================== FUEL ECONOMY MODELS ====================

class FuelConfig(BaseModel):
    """Configuração de combustível por veículo"""
    tank_capacity: float = 300.0      # Litros
    expected_kml: float = 3.5          # km/L esperado
    fuel_price: float = 6.00           # R$/L
    idle_consumption_lh: float = 1.5   # L/h em marcha lenta

class WasteBreakdown(BaseModel):
    """Detalhamento de desperdício"""
    idle_cost: float
    idle_hours: float
    idle_percentage: float
    aggressive_cost: float
    aggressive_events: int
    aggressive_percentage: float
    route_cost: float
    route_extra_km: float
    route_percentage: float
    total_waste: float

class DriverScore(BaseModel):
    """Score do motorista"""
    driver_id: str
    score: int                         # 0-100
    avg_consumption: float             # km/L
    harsh_events: int
    idle_hours: float
    estimated_waste: float             # R$
    rank: Optional[int] = None

class FuelEconomyDashboard(BaseModel):
    """Dashboard completo de economia"""
    current_month_cost: float
    previous_month_cost: float
    savings: float
    savings_percent: float
    waste_breakdown: WasteBreakdown
    top_drivers: list[DriverScore]
    critical_alerts: list[dict]
    roi_data: dict

class CriticalAlert(BaseModel):
    """Alerta crítico de desperdício"""
    device_id: str
    alert_type: str  # idle, aggressive, mechanical
    cost_per_month: float
    description: str
    action: str
