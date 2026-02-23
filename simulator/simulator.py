#!/usr/bin/env python3
"""
Simulador de Telemetria para MonitoraEngine
Gera dados realistas de múltiplos devices com movimento suave
"""

import os
import time
import random
import requests
import click
from datetime import datetime, timezone
from typing import Dict, List, Tuple
from dataclasses import dataclass
import math

# Configurações de cidades
CITIES = {
    "saopaulo": {
        "center": (-23.5505, -46.6333),
        "radius_km": 15
    },
    "riodejaneiro": {
        "center": (-22.9068, -43.1729),
        "radius_km": 12
    },
    "brasilia": {
        "center": (-15.8267, -47.9218),
        "radius_km": 10
    },
    "curitiba": {
        "center": (-25.4284, -49.2733),
        "radius_km": 8
    }
}

@dataclass
class DeviceState:
    """Estado atual de um device"""
    device_id: str
    lat: float
    lon: float
    speed_kmh: float
    engine_temp_c: float
    battery_v: float
    heading: float  # Direção em graus (0-360)
    
class TelemetrySimulator:
    """Simulador de telemetria com movimento realista"""
    
    def __init__(
        self,
        api_url: str,
        num_devices: int,
        city: str,
        speed_min: float,
        speed_max: float
    ):
        self.api_url = api_url
        self.num_devices = num_devices
        self.city_config = CITIES.get(city.lower(), CITIES["saopaulo"])
        self.speed_min = speed_min
        self.speed_max = speed_max
        self.devices: Dict[str, DeviceState] = {}
        self._initialize_devices()
        
    def _initialize_devices(self):
        """Inicializa devices com posições aleatórias"""
        center_lat, center_lon = self.city_config["center"]
        radius_km = self.city_config["radius_km"]
        
        for i in range(1, self.num_devices + 1):
            device_id = f"TRK-{i:03d}"
            
            # Posição aleatória dentro do raio
            angle = random.uniform(0, 2 * math.pi)
            distance_km = random.uniform(0, radius_km)
            
            # Conversão aproximada: 1 grau lat ≈ 111km, 1 grau lon ≈ 111km * cos(lat)
            lat_offset = (distance_km / 111) * math.cos(angle)
            lon_offset = (distance_km / (111 * math.cos(math.radians(center_lat)))) * math.sin(angle)
            
            self.devices[device_id] = DeviceState(
                device_id=device_id,
                lat=center_lat + lat_offset,
                lon=center_lon + lon_offset,
                speed_kmh=random.uniform(self.speed_min, self.speed_max),
                engine_temp_c=random.uniform(85, 95),
                battery_v=random.uniform(12.2, 12.8),
                heading=random.uniform(0, 360)
            )
    
    def _update_position(self, device: DeviceState, interval_ms: int):
        """Atualiza posição do device com movimento suave"""
        # Variação suave de velocidade
        speed_change = random.uniform(-5, 5)
        device.speed_kmh = max(
            self.speed_min,
            min(self.speed_max, device.speed_kmh + speed_change)
        )
        
        # Variação suave de direção (máx ±15 graus)
        heading_change = random.uniform(-15, 15)
        device.heading = (device.heading + heading_change) % 360
        
        # Calcular deslocamento baseado em velocidade e intervalo
        # distância = velocidade * tempo
        distance_km = (device.speed_kmh / 3600) * (interval_ms / 1000)
        
        # Converter heading para radianos
        heading_rad = math.radians(device.heading)
        
        # Atualizar lat/lon
        lat_change = (distance_km / 111) * math.cos(heading_rad)
        lon_change = (distance_km / (111 * math.cos(math.radians(device.lat)))) * math.sin(heading_rad)
        
        device.lat += lat_change
        device.lon += lon_change
        
        # Atualizar temperatura do motor (correlacionada com velocidade)
        if device.speed_kmh > 80:
            device.engine_temp_c = min(105, device.engine_temp_c + random.uniform(0, 1))
        else:
            device.engine_temp_c = max(85, device.engine_temp_c - random.uniform(0, 0.5))
        
        # Atualizar bateria (lenta diminuição)
        device.battery_v = max(11.8, device.battery_v - random.uniform(0, 0.01))
    
    def _send_telemetry(self, device: DeviceState) -> bool:
        """Envia telemetria para API"""
        payload = {
            "device_id": device.device_id,
            "ts": datetime.now(timezone.utc).isoformat(),
            "lat": round(device.lat, 6),
            "lon": round(device.lon, 6),
            "speed_kmh": round(device.speed_kmh, 2),
            "engine_temp_c": round(device.engine_temp_c, 1),
            "battery_v": round(device.battery_v, 2)
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/ingest",
                json=payload,
                timeout=5
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro enviando {device.device_id}: {e}")
            return False
    
    def run(self, interval_ms: int):
        """Loop principal do simulador"""
        print(f"\n🚀 MonitoraEngine Simulator")
        print(f"📍 Cidade: {list(CITIES.keys())[list(CITIES.values()).index(self.city_config)]}")
        print(f"🚗 Devices: {self.num_devices}")
        print(f"⏱️  Intervalo: {interval_ms}ms")
        print(f"🎯 API: {self.api_url}")
        print(f"🏁 Velocidade: {self.speed_min}-{self.speed_max} km/h")
        print("-" * 60)
        
        iteration = 0
        try:
            while True:
                iteration += 1
                start_time = time.time()
                
                success_count = 0
                for device in self.devices.values():
                    # Atualizar estado
                    self._update_position(device, interval_ms)
                    
                    # Enviar telemetria
                    if self._send_telemetry(device):
                        success_count += 1
                
                # Stats
                elapsed_ms = (time.time() - start_time) * 1000
                print(
                    f"[{iteration:05d}] ✅ {success_count}/{self.num_devices} eventos | "
                    f"{elapsed_ms:.0f}ms"
                )
                
                # Aguardar próximo ciclo
                sleep_time = max(0, (interval_ms - elapsed_ms) / 1000)
                time.sleep(sleep_time)
                
        except KeyboardInterrupt:
            print("\n\n⏹️  Simulador interrompido pelo usuário")
            print(f"📊 Total de iterações: {iteration}")

@click.command()
@click.option(
    '--devices',
    type=int,
    default=5,
    help='Número de devices a simular'
)
@click.option(
    '--interval-ms',
    type=int,
    default=1000,
    help='Intervalo entre envios em milissegundos'
)
@click.option(
    '--city',
    type=click.Choice(['saopaulo', 'riodejaneiro', 'brasilia', 'curitiba'], case_sensitive=False),
    default='saopaulo',
    help='Cidade base para simulação'
)
@click.option(
    '--speed-min',
    type=float,
    default=40.0,
    help='Velocidade mínima em km/h'
)
@click.option(
    '--speed-max',
    type=float,
    default=100.0,
    help='Velocidade máxima em km/h'
)
@click.option(
    '--api-url',
    type=str,
    default=None,
    help='URL da API (padrão: SIMULATOR_API_URL do .env ou http://localhost:8000)'
)
def main(devices, interval_ms, city, speed_min, speed_max, api_url):
    """Simulador de telemetria MonitoraEngine"""
    
    # API URL
    if not api_url:
        api_url = os.getenv('SIMULATOR_API_URL', 'http://localhost:8000')
    
    # Validações
    if devices < 1 or devices > 100:
        click.echo("❌ Número de devices deve estar entre 1 e 100")
        return
    
    if interval_ms < 100:
        click.echo("❌ Intervalo mínimo é 100ms")
        return
    
    if speed_min >= speed_max:
        click.echo("❌ Velocidade mínima deve ser menor que máxima")
        return
    
    # Criar e executar simulador
    simulator = TelemetrySimulator(
        api_url=api_url,
        num_devices=devices,
        city=city,
        speed_min=speed_min,
        speed_max=speed_max
    )
    
    simulator.run(interval_ms)

if __name__ == '__main__':
    main()
