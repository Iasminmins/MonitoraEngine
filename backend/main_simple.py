# Backend Simplificado - Sem Banco de Dados
# Armazena dados em memória para testes rápidos

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import List, Dict
from datetime import datetime, timezone
from collections import defaultdict, deque

from models import TelemetryEvent, DeviceStatus, MetricsSummary

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Armazenamento em memória
class InMemoryStorage:
    def __init__(self):
        # Últimos 1000 eventos por device
        self.telemetry: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        # Status atual de cada device
        self.device_status: Dict[str, DeviceStatus] = {}
        # Contadores
        self.total_events = 0
        
    def add_event(self, event: TelemetryEvent):
        """Adiciona evento"""
        self.telemetry[event.device_id].append(event)
        self.total_events += 1
        
        # Atualiza status do device
        self.device_status[event.device_id] = DeviceStatus(
            device_id=event.device_id,
            online=True,
            last_seen=event.ts,
            last_lat=event.lat,
            last_lon=event.lon,
            last_speed=event.speed_kmh,
            last_temp=event.engine_temp_c,
            last_battery=event.battery_v
        )
        
    def get_device_status(self) -> List[DeviceStatus]:
        """Retorna status de todos os devices"""
        return list(self.device_status.values())
    
    def get_metrics(self) -> MetricsSummary:
        """Calcula métricas agregadas"""
        total_devices = len(self.device_status)
        online_devices = sum(1 for d in self.device_status.values() if d.online)
        
        # Calcula eventos no último minuto
        now = datetime.now(timezone.utc)
        events_last_minute = 0
        for events in self.telemetry.values():
            for e in events:
                if (now - e.ts).total_seconds() <= 60:
                    events_last_minute += 1
        
        # Calcula velocidade média dos últimos 5 minutos
        speeds = []
        for events in self.telemetry.values():
            for e in events:
                if (now - e.ts).total_seconds() <= 300 and e.speed_kmh:
                    speeds.append(e.speed_kmh)
        
        avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
        
        return MetricsSummary(
            devices_online=online_devices,
            events_last_minute=events_last_minute,
            avg_speed_5min=round(avg_speed, 2),
            alerts_last_10min=0  # Não implementado nesta versão
        )

# Storage global
storage = InMemoryStorage()

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Backend iniciado (modo memória)")
    yield
    logger.info("⏹️  Backend encerrado")

# App
app = FastAPI(
    title="MonitoraEngine API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ENDPOINTS ===

@app.get("/")
def root():
    return {
        "service": "MonitoraEngine API",
        "version": "1.0.0",
        "status": "running",
        "mode": "in-memory"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "storage": "memory",
        "devices": len(storage.device_status),
        "events": storage.total_events
    }

@app.post("/ingest")
async def ingest_telemetry(event: TelemetryEvent):
    """Recebe evento de telemetria"""
    try:
        storage.add_event(event)
        logger.info(f"✅ {event.device_id} @ {event.speed_kmh:.1f} km/h")
        return {"status": "ok", "device_id": event.device_id}
    except Exception as e:
        logger.error(f"Erro no ingest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices", response_model=List[DeviceStatus])
async def get_devices():
    """Lista status de todos os devices"""
    return storage.get_device_status()

@app.get("/metrics", response_model=MetricsSummary)
async def get_metrics():
    """Métricas agregadas"""
    return storage.get_metrics()

@app.get("/telemetry/{device_id}")
async def get_device_telemetry(device_id: str, limit: int = 100):
    """Histórico de telemetria de um device"""
    events = list(storage.telemetry.get(device_id, []))
    return {
        "device_id": device_id,
        "total_events": len(events),
        "events": [
            {
                "ts": e.ts.isoformat(),
                "lat": e.lat,
                "lon": e.lon,
                "speed_kmh": e.speed_kmh,
                "engine_temp_c": e.engine_temp_c,
                "battery_v": e.battery_v
            }
            for e in list(events)[-limit:]
        ]
    }

# ENDPOINTS ADICIONAIS PARA O FRONTEND

@app.get("/devices/{device_id}/latest")
async def get_device_latest(device_id: str):
    """Último evento de um device"""
    events = list(storage.telemetry.get(device_id, []))
    if not events:
        raise HTTPException(status_code=404, detail="Device not found")
    
    latest = events[-1]
    return {
        "device_id": device_id,
        "ts": latest.ts.isoformat(),
        "lat": latest.lat,
        "lon": latest.lon,
        "speed_kmh": latest.speed_kmh,
        "engine_temp_c": latest.engine_temp_c,
        "battery_v": latest.battery_v
    }

@app.get("/devices/{device_id}/events")
async def get_device_events(device_id: str, minutes: int = 60, limit: int = 500):
    """Eventos de um device nos últimos N minutos"""
    events = list(storage.telemetry.get(device_id, []))
    now = datetime.now(timezone.utc)
    
    # Filtra por tempo
    filtered = [
        e for e in events 
        if (now - e.ts).total_seconds() <= (minutes * 60)
    ]
    
    # Aplica limite
    filtered = filtered[-limit:] if len(filtered) > limit else filtered
    
    return [
        {
            "device_id": e.device_id,
            "ts": e.ts.isoformat(),
            "lat": e.lat,
            "lon": e.lon,
            "speed_kmh": e.speed_kmh,
            "engine_temp_c": e.engine_temp_c,
            "battery_v": e.battery_v
        }
        for e in filtered
    ]

@app.get("/metrics/summary")
async def get_metrics_summary(minutes: int = 5):
    """Métricas dos últimos N minutos"""
    now = datetime.now(timezone.utc)
    
    # Conta eventos no período
    events_count = 0
    speeds = []
    
    for events in storage.telemetry.values():
        for e in events:
            if (now - e.ts).total_seconds() <= (minutes * 60):
                events_count += 1
                if e.speed_kmh:
                    speeds.append(e.speed_kmh)
    
    avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
    
    return {
        "devices_online": sum(1 for d in storage.device_status.values() if d.online),
        "events_last_minute": events_count,
        "avg_speed_5min": round(avg_speed, 2),
        "alerts_last_10min": 0
    }

@app.get("/alerts")
async def get_alerts(minutes: int = 10):
    """Lista de alertas (não implementado)"""
    return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
