import asyncio
import asyncpg
from datetime import datetime, timedelta
from typing import List, Optional
from config import settings
from models import TelemetryEvent, DeviceStatus, Alert
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.buffer: List[TelemetryEvent] = []
        self.buffer_lock = asyncio.Lock()
        self.flush_task = None
        
    async def connect(self):
        """Cria pool de conexões"""
        self.pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10
        )
        logger.info("Database pool created")
        
    async def disconnect(self):
        """Fecha pool de conexões"""
        if self.flush_task:
            self.flush_task.cancel()
        await self.flush_buffer()
        if self.pool:
            await self.pool.close()
        logger.info("Database pool closed")
    
    async def start_flush_task(self):
        """Inicia task de flush periódico"""
        self.flush_task = asyncio.create_task(self._periodic_flush())
        
    async def _periodic_flush(self):
        """Flush buffer a cada N segundos"""
        while True:
            await asyncio.sleep(settings.batch_timeout)
            await self.flush_buffer()
    
    async def add_to_buffer(self, event: TelemetryEvent):
        """Adiciona evento ao buffer"""
        async with self.buffer_lock:
            self.buffer.append(event)
            if len(self.buffer) >= settings.batch_size:
                await self.flush_buffer()
    
    async def flush_buffer(self):
        """Flush buffer para banco com retry"""
        async with self.buffer_lock:
            if not self.buffer:
                return
            
            events = self.buffer.copy()
            self.buffer.clear()
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                await self._insert_events(events)
                logger.info(f"Flushed {len(events)} events to database")
                return
            except Exception as e:
                logger.error(f"Flush attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    logger.error(f"Lost {len(events)} events after {max_retries} retries")
                await asyncio.sleep(0.5 * (attempt + 1))
    
    async def _insert_events(self, events: List[TelemetryEvent]):
        """Insere eventos em batch"""
        if not events:
            return
            
        async with self.pool.acquire() as conn:
            await conn.executemany(
                """
                INSERT INTO telemetry_events 
                (device_id, ts, lat, lon, speed_kmh, engine_temp_c, battery_v)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                [(e.device_id, e.ts, e.lat, e.lon, e.speed_kmh, 
                  e.engine_temp_c, e.battery_v) for e in events]
            )
    
    async def get_devices(self) -> List[DeviceStatus]:
        """Lista todos devices com status"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                WITH latest AS (
                    SELECT DISTINCT ON (device_id)
                        device_id,
                        ts,
                        lat,
                        lon,
                        speed_kmh,
                        engine_temp_c,
                        battery_v
                    FROM telemetry_events
                    ORDER BY device_id, ts DESC
                )
                SELECT 
                    device_id,
                    ts as last_seen,
                    lat as last_lat,
                    lon as last_lon,
                    speed_kmh as last_speed,
                    engine_temp_c as last_temp,
                    battery_v as last_battery,
                    CASE 
                        WHEN ts > NOW() - INTERVAL '30 seconds' THEN true
                        ELSE false
                    END as online
                FROM latest
                ORDER BY device_id
                """
            )
            
            return [DeviceStatus(**dict(row)) for row in rows]
    
    async def get_device_latest(self, device_id: str) -> Optional[dict]:
        """Último evento de um device"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT *
                FROM telemetry_events
                WHERE device_id = $1
                ORDER BY ts DESC
                LIMIT 1
                """,
                device_id
            )
            return dict(row) if row else None
    
    async def get_device_events(
        self, 
        device_id: str, 
        minutes: int = 60, 
        limit: int = 500
    ) -> List[dict]:
        """Eventos de um device no período"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT *
                FROM telemetry_events
                WHERE device_id = $1
                AND ts > NOW() - INTERVAL '1 minute' * $2
                ORDER BY ts DESC
                LIMIT $3
                """,
                device_id, minutes, limit
            )
            return [dict(row) for row in rows]
    
    async def get_metrics_summary(self, minutes: int = 5) -> dict:
        """Métricas agregadas"""
        async with self.pool.acquire() as conn:
            # Devices online
            online_count = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT device_id)
                FROM telemetry_events
                WHERE ts > NOW() - INTERVAL '30 seconds'
                """
            )
            
            # Eventos no último minuto
            events_count = await conn.fetchval(
                """
                SELECT COUNT(*)
                FROM telemetry_events
                WHERE ts > NOW() - INTERVAL '1 minute'
                """
            )
            
            # Velocidade média últimos N minutos
            avg_speed = await conn.fetchval(
                """
                SELECT COALESCE(AVG(speed_kmh), 0)
                FROM telemetry_events
                WHERE ts > NOW() - INTERVAL '1 minute' * $1
                AND speed_kmh IS NOT NULL
                """,
                minutes
            )
            
            # Alertas (velocidade > 90)
            alerts_count = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT device_id)
                FROM telemetry_events
                WHERE ts > NOW() - INTERVAL '10 minutes'
                AND speed_kmh > 90
                """
            )
            
            return {
                "devices_online": online_count or 0,
                "events_last_minute": events_count or 0,
                "avg_speed_5min": round(float(avg_speed or 0), 2),
                "alerts_last_10min": alerts_count or 0
            }
    
    async def get_alerts(self, minutes: int = 10) -> List[dict]:
        """Alertas recentes (velocidade > 90)"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                WITH speed_alerts AS (
                    SELECT 
                        id,
                        device_id,
                        ts,
                        speed_kmh,
                        'high_speed' as alert_type
                    FROM telemetry_events
                    WHERE ts > NOW() - INTERVAL '1 minute' * $1
                    AND speed_kmh > 90
                    ORDER BY ts DESC
                )
                SELECT 
                    id,
                    device_id,
                    ts,
                    alert_type,
                    speed_kmh as value,
                    'Velocidade acima de 90 km/h: ' || ROUND(speed_kmh::numeric, 1) || ' km/h' as message
                FROM speed_alerts
                LIMIT 50
                """,
                minutes
            )
            return [dict(row) for row in rows]
    
    # ==================== FUEL ECONOMY QUERIES ====================
    
    async def get_device_events_period(
        self,
        device_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[dict]:
        """Eventos de um device em período específico"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT *
                FROM telemetry_events
                WHERE device_id = $1
                AND ts BETWEEN $2 AND $3
                ORDER BY ts ASC
                """,
                device_id, start_date, end_date
            )
            return [dict(row) for row in rows]
    
    async def get_all_devices_events_period(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> dict:
        """Eventos de TODOS devices em período (agrupado por device)"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT *
                FROM telemetry_events
                WHERE ts BETWEEN $1 AND $2
                ORDER BY device_id, ts ASC
                """,
                start_date, end_date
            )
            
            # Agrupar por device_id
            events_by_device = {}
            for row in rows:
                device_id = row['device_id']
                if device_id not in events_by_device:
                    events_by_device[device_id] = []
                events_by_device[device_id].append(dict(row))
            
            return events_by_device
    
    async def get_fuel_consumption_summary(
        self,
        device_id: str,
        days: int = 30
    ) -> dict:
        """Resumo de consumo dos últimos N dias"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                WITH daily_stats AS (
                    SELECT
                        DATE(ts) as day,
                        COUNT(*) as events,
                        AVG(speed_kmh) as avg_speed
                    FROM telemetry_events
                    WHERE device_id = $1
                    AND ts > NOW() - INTERVAL '1 day' * $2
                    GROUP BY DATE(ts)
                )
                SELECT
                    COUNT(*) as total_days,
                    SUM(events) as total_events,
                    AVG(avg_speed) as avg_speed
                FROM daily_stats
                """,
                device_id, days
            )
            return dict(row) if row else {}

# Singleton
db = Database()
