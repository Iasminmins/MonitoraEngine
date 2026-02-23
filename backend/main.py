from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import List, Optional

from config import settings
from database import db
from models import (
    TelemetryEvent, DeviceStatus, MetricsSummary,
    FuelConfig, WasteBreakdown, DriverScore, FuelEconomyDashboard
)
from fuel_economy import (
    calculate_waste_breakdown,
    calculate_driver_score,
    calculate_roi
)
from models import FuelConfig

# Config padrão
DEFAULT_FUEL_CONFIG = FuelConfig(
    fuel_price=5.80,
    expected_kml=8.5,
    idle_consumption_lh=0.8
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan para startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting MonitoraEngine Backend...")
    await db.connect()
    await db.start_flush_task()
    logger.info("Backend ready!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await db.disconnect()
    logger.info("Backend stopped.")

# App
app = FastAPI(
    title="MonitoraEngine API",
    description="Sistema de telemetria em tempo real",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ENDPOINTS ====================

@app.get("/health")
async def health_check():
    """Status do servidor"""
    return {
        "status": "ok",
        "service": "MonitoraEngine Backend",
        "version": "1.0.0"
    }

@app.post("/ingest")
async def ingest_telemetry(event: TelemetryEvent):
    """Recebe evento de telemetria"""
    try:
        await db.add_to_buffer(event)
        return {"status": "accepted"}
    except Exception as e:
        logger.error(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices", response_model=List[DeviceStatus])
async def get_devices():
    """Lista devices com status online/offline"""
    try:
        devices = await db.get_devices()
        return devices
    except Exception as e:
        logger.error(f"Get devices error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices/{device_id}/latest")
async def get_device_latest(device_id: str):
    """Último evento do device"""
    try:
        event = await db.get_device_latest(device_id)
        if not event:
            raise HTTPException(status_code=404, detail="Device not found")
        return event
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get latest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices/{device_id}/events")
async def get_device_events(
    device_id: str,
    minutes: int = 60,
    limit: int = 500
):
    """Histórico de eventos do device"""
    try:
        events = await db.get_device_events(device_id, minutes, limit)
        return events
    except Exception as e:
        logger.error(f"Get events error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics/summary", response_model=MetricsSummary)
async def get_metrics_summary(minutes: int = 5):
    """Métricas agregadas para dashboard"""
    try:
        metrics = await db.get_metrics_summary(minutes)
        return metrics
    except Exception as e:
        logger.error(f"Get metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts")
async def get_alerts(minutes: int = 10):
    """Alertas recentes"""
    try:
        alerts = await db.get_alerts(minutes)
        return alerts
    except Exception as e:
        logger.error(f"Get alerts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FUEL ECONOMY ENDPOINTS ====================

@app.get("/fuel-analysis/calculate/{device_id}")
async def calculate_fuel_waste(
    device_id: str,
    hours: int = 24
):
    """Calcula desperdício de combustível de um veículo"""
    try:
        # Buscar telemetria das últimas N horas
        minutes = hours * 60
        telemetry_data = await db.get_device_events(device_id, minutes, limit=10000)
        
        if not telemetry_data:
            return {
                "device_id": device_id,
                "period_hours": hours,
                "message": "No data available",
                "waste_breakdown": None
            }
        
        # Calcular desperdício
        waste = calculate_waste_breakdown(telemetry_data, DEFAULT_FUEL_CONFIG)
        
        return {
            "device_id": device_id,
            "period_hours": hours,
            "waste_breakdown": waste,
            "config": DEFAULT_FUEL_CONFIG
        }
    except Exception as e:
        logger.error(f"Calculate fuel waste error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fuel-analysis/dashboard")
async def get_fuel_economy_dashboard(
    hours: int = 24,  # 24 horas padrão (era 30 dias)
    system_cost: float = 70000.0
):
    """Dashboard completo de economia de combustível"""
    try:
        # Buscar todos os devices
        devices = await db.get_devices()
        
        if not devices:
            raise HTTPException(status_code=404, detail="No devices found")
        
        minutes = hours * 60
        total_waste_current = 0
        all_drivers = []
        critical_alerts_list = []
        
        # Processar cada device
        for device in devices:
            telemetry_data = await db.get_device_events(
                device.device_id,
                minutes,
                limit=10000
            )
            
            if telemetry_data:
                waste = calculate_waste_breakdown(telemetry_data, DEFAULT_FUEL_CONFIG)
                total_waste_current += waste.total_waste
                
                # Driver score
                driver_score = calculate_driver_score(
                    device.device_id,
                    telemetry_data,
                    DEFAULT_FUEL_CONFIG
                )
                all_drivers.append(driver_score)
                
                # Alertas críticos (top 3 problemas)
                if waste.idle_cost > 100:
                    critical_alerts_list.append({
                        "device_id": device.device_id,
                        "type": "idle",
                        "message": f"Marcha lenta {waste.idle_hours:.1f}h",
                        "cost": waste.idle_cost
                    })
                
                if waste.aggressive_events > 20:
                    critical_alerts_list.append({
                        "device_id": device.device_id,
                        "type": "aggressive",
                        "message": f"Direção agressiva {waste.aggressive_events}× eventos",
                        "cost": waste.aggressive_cost
                    })
        
        # Ordenar drivers por score
        all_drivers.sort(key=lambda x: x.score, reverse=True)
        for idx, driver in enumerate(all_drivers):
            driver.rank = idx + 1
        
        # Top 5 melhores drivers
        top_drivers = all_drivers[:5]
        
        # Top 3 alertas críticos (maior custo)
        critical_alerts_list.sort(key=lambda x: x['cost'], reverse=True)
        critical_alerts = critical_alerts_list[:3]
        
        # Simular mês anterior (10% pior)
        previous_month_cost = total_waste_current * 1.10
        savings = previous_month_cost - total_waste_current
        savings_percent = (savings / previous_month_cost * 100) if previous_month_cost > 0 else 0
        
        # Calcular ROI
        monthly_savings = savings
        roi_data = calculate_roi(system_cost, monthly_savings)
        
        # Criar waste breakdown agregado
        total_idle_cost = sum(d.estimated_waste for d in all_drivers)
        aggregate_waste = WasteBreakdown(
            idle_cost=total_waste_current * 0.42,  # 42% média
            idle_hours=sum(d.idle_hours for d in all_drivers),
            idle_percentage=42.0,
            aggressive_cost=total_waste_current * 0.19,  # 19% média
            aggressive_events=sum(d.harsh_events for d in all_drivers),
            aggressive_percentage=19.0,
            route_cost=total_waste_current * 0.10,  # 10% média
            route_extra_km=0,
            route_percentage=10.0,
            total_waste=total_waste_current
        )
        
        return FuelEconomyDashboard(
            current_month_cost=round(total_waste_current, 2),
            previous_month_cost=round(previous_month_cost, 2),
            savings=round(savings, 2),
            savings_percent=round(savings_percent, 1),
            waste_breakdown=aggregate_waste,
            top_drivers=top_drivers,
            critical_alerts=critical_alerts,
            roi_data=roi_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get fuel dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fuel-analysis/driver-ranking")
async def get_driver_ranking(hours: int = 720):
    """Ranking de motoristas por economia"""
    try:
        devices = await db.get_devices()
        
        if not devices:
            return []
        
        minutes = hours * 60
        drivers = []
        
        for device in devices:
            telemetry_data = await db.get_device_events(
                device.device_id,
                minutes,
                limit=10000
            )
            
            if telemetry_data:
                driver_score = calculate_driver_score(
                    device.device_id,
                    telemetry_data,
                    DEFAULT_FUEL_CONFIG
                )
                drivers.append(driver_score)
        
        # Ordenar por score
        drivers.sort(key=lambda x: x.score, reverse=True)
        for idx, driver in enumerate(drivers):
            driver.rank = idx + 1
        
        return drivers
        
    except Exception as e:
        logger.error(f"Get driver ranking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=True
    )
