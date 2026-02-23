"""
MÓDULO: Análise de Economia de Combustível
Integrado ao MonitoraEngine
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import math
from models import FuelConfig, WasteBreakdown, DriverScore, CriticalAlert


# ==================== CONSTANTES ====================

IDLE_SPEED_THRESHOLD = 5.0          # km/h
HARSH_ACCEL_THRESHOLD = 2.0         # km/h por segundo
HARSH_EVENT_FUEL_ML = 50            # mL por evento


# ==================== FUNÇÕES DE CÁLCULO ====================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula distância entre dois pontos GPS (Haversine)
    Retorna distância em km
    """
    if not all([lat1, lon1, lat2, lon2]):
        return 0
    
    R = 6371  # Raio da Terra em km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance


def calculate_total_distance(events: List[dict]) -> float:
    """Calcula distância total percorrida via GPS"""
    total_km = 0
    
    for i in range(len(events) - 1):
        lat1 = events[i].get('lat')
        lon1 = events[i].get('lon')
        lat2 = events[i + 1].get('lat')
        lon2 = events[i + 1].get('lon')
        
        if all([lat1, lon1, lat2, lon2]):
            total_km += haversine_distance(lat1, lon1, lat2, lon2)
    
    return total_km


def calculate_idle_waste(events: List[dict], config: FuelConfig) -> dict:
    """
    Calcula desperdício com marcha lenta
    Critério: velocidade < 5 km/h por período prolongado
    """
    idle_time_hours = 0.0
    
    for i in range(len(events) - 1):
        current = events[i]
        next_event = events[i + 1]
        
        # Se velocidade baixa
        speed = current.get('speed_kmh', 0) or 0
        if speed < IDLE_SPEED_THRESHOLD:
            # Calcular tempo parado
            ts1 = current.get('ts')
            ts2 = next_event.get('ts')
            
            if ts1 and ts2:
                if isinstance(ts1, str):
                    ts1 = datetime.fromisoformat(ts1.replace('Z', '+00:00'))
                if isinstance(ts2, str):
                    ts2 = datetime.fromisoformat(ts2.replace('Z', '+00:00'))
                
                duration_seconds = (ts2 - ts1).total_seconds()
                idle_time_hours += duration_seconds / 3600
    
    # Custo
    idle_cost = idle_time_hours * config.idle_consumption_lh * config.fuel_price
    
    return {
        'hours': round(idle_time_hours, 2),
        'cost': round(idle_cost, 2),
        'percentage': 0
    }


def calculate_aggressive_driving_waste(events: List[dict], config: FuelConfig) -> dict:
    """
    Calcula desperdício por direção agressiva
    Critério: mudança brusca de velocidade
    """
    harsh_events = 0
    
    for i in range(len(events) - 1):
        current = events[i]
        next_event = events[i + 1]
        
        speed1 = current.get('speed_kmh', 0) or 0
        speed2 = next_event.get('speed_kmh', 0) or 0
        
        ts1 = current.get('ts')
        ts2 = next_event.get('ts')
        
        if ts1 and ts2:
            if isinstance(ts1, str):
                ts1 = datetime.fromisoformat(ts1.replace('Z', '+00:00'))
            if isinstance(ts2, str):
                ts2 = datetime.fromisoformat(ts2.replace('Z', '+00:00'))
            
            dt = (ts2 - ts1).total_seconds()
            
            if dt > 0:
                # Aceleração/frenagem em km/h por segundo
                accel = abs(speed2 - speed1) / dt
                
                # Se mudança brusca
                if accel > HARSH_ACCEL_THRESHOLD:
                    harsh_events += 1
    
    # Custo (50ml por evento)
    extra_fuel_liters = (harsh_events * HARSH_EVENT_FUEL_ML) / 1000
    aggressive_cost = extra_fuel_liters * config.fuel_price
    
    return {
        'events': harsh_events,
        'cost': round(aggressive_cost, 2),
        'percentage': 0
    }


def calculate_route_waste(
    events: List[dict],
    config: FuelConfig,
    optimal_km: Optional[float] = None
) -> dict:
    """
    Calcula desperdício por rotas ineficientes
    """
    if not optimal_km:
        return {'extra_km': 0, 'cost': 0, 'percentage': 0}
    
    actual_km = calculate_total_distance(events)
    extra_km = max(0, actual_km - optimal_km)
    
    route_cost = (extra_km / config.expected_kml) * config.fuel_price
    
    return {
        'extra_km': round(extra_km, 2),
        'cost': round(route_cost, 2),
        'percentage': 0
    }


def calculate_waste_breakdown(
    events: List[dict],
    config: FuelConfig,
    optimal_route_km: Optional[float] = None
) -> WasteBreakdown:
    """
    Calcula breakdown completo de desperdício
    """
    idle = calculate_idle_waste(events, config)
    aggressive = calculate_aggressive_driving_waste(events, config)
    route = calculate_route_waste(events, config, optimal_route_km)
    
    total_waste = idle['cost'] + aggressive['cost'] + route['cost']
    
    # Calcular percentuais
    if total_waste > 0:
        idle['percentage'] = round((idle['cost'] / total_waste) * 100, 1)
        aggressive['percentage'] = round((aggressive['cost'] / total_waste) * 100, 1)
        route['percentage'] = round((route['cost'] / total_waste) * 100, 1)
    
    return WasteBreakdown(
        idle_cost=idle['cost'],
        idle_hours=idle['hours'],
        idle_percentage=idle['percentage'],
        aggressive_cost=aggressive['cost'],
        aggressive_events=aggressive['events'],
        aggressive_percentage=aggressive['percentage'],
        route_cost=route['cost'],
        route_extra_km=route.get('extra_km', 0),
        route_percentage=route['percentage'],
        total_waste=round(total_waste, 2)
    )


def calculate_driver_score(
    device_id: str,
    events: List[dict],
    config: FuelConfig
) -> DriverScore:
    """
    Calcula score do motorista (0-100)
    """
    if not events:
        return DriverScore(
            driver_id=device_id,
            score=0,
            avg_consumption=0,
            harsh_events=0,
            idle_hours=0,
            estimated_waste=0
        )
    
    # Cálculos
    idle_data = calculate_idle_waste(events, config)
    aggressive_data = calculate_aggressive_driving_waste(events, config)
    
    # Distância e consumo
    total_km = calculate_total_distance(events)
    estimated_fuel = (idle_data['hours'] * config.idle_consumption_lh +
                      (aggressive_data['events'] * HARSH_EVENT_FUEL_ML / 1000))
    
    if estimated_fuel > 0:
        avg_consumption = total_km / estimated_fuel
    else:
        avg_consumption = config.expected_kml
    
    # Score (0-100)
    # 50% baseado em consumo, 30% eventos agressivos, 20% tempo parado
    consumption_score = min(50, (avg_consumption / config.expected_kml) * 50)
    aggressive_score = max(0, 30 - (aggressive_data['events'] * 0.5))
    idle_score = max(0, 20 - (idle_data['hours'] * 2))
    
    total_score = int(consumption_score + aggressive_score + idle_score)
    
    return DriverScore(
        driver_id=device_id,
        score=total_score,
        avg_consumption=round(avg_consumption, 2),
        harsh_events=aggressive_data['events'],
        idle_hours=idle_data['hours'],
        estimated_waste=round(idle_data['cost'] + aggressive_data['cost'], 2)
    )


def generate_critical_alerts(
    device_id: str,
    waste_breakdown: WasteBreakdown,
    driver_score: DriverScore
) -> List[CriticalAlert]:
    """
    Gera alertas críticos baseado em desperdício
    """
    alerts = []
    
    # Alerta marcha lenta
    if waste_breakdown.idle_hours > 3:  # Mais de 3h parado
        monthly_cost = waste_breakdown.idle_cost * 30
        alerts.append(CriticalAlert(
            device_id=device_id,
            alert_type='idle',
            cost_per_month=round(monthly_cost, 2),
            description=f'Marcha lenta excessiva: {waste_breakdown.idle_hours:.1f}h/dia',
            action='Verificar se motor está com problema ou orientar motorista'
        ))
    
    # Alerta direção agressiva
    if waste_breakdown.aggressive_events > 30:
        monthly_cost = waste_breakdown.aggressive_cost * 30
        alerts.append(CriticalAlert(
            device_id=device_id,
            alert_type='aggressive',
            cost_per_month=round(monthly_cost, 2),
            description=f'Aceleração/frenagem brusca {waste_breakdown.aggressive_events}x/dia',
            action='Treinar motorista sobre direção econômica'
        ))
    
    # Alerta score baixo
    if driver_score.score < 50:
        alerts.append(CriticalAlert(
            device_id=device_id,
            alert_type='low_score',
            cost_per_month=round(driver_score.estimated_waste * 30, 2),
            description=f'Score do motorista muito baixo: {driver_score.score}/100',
            action='Avaliação completa do motorista necessária'
        ))
    
    return alerts


def calculate_roi(
    system_cost: float,
    monthly_savings: float
) -> dict:
    """
    Calcula ROI do sistema
    """
    if monthly_savings <= 0:
        return {
            'system_cost': round(system_cost, 2),
            'monthly_savings': 0,
            'payback_months': 999,
            'annual_savings': 0,
            'roi_percent': 0,
            'times_paid': 0
        }
    
    payback_months = system_cost / monthly_savings
    annual_savings = monthly_savings * 12
    roi_percent = ((annual_savings - system_cost) / system_cost) * 100
    times_paid = annual_savings / system_cost if system_cost > 0 else 0
    
    return {
        'system_cost': round(system_cost, 2),
        'monthly_savings': round(monthly_savings, 2),
        'payback_months': round(payback_months, 1),
        'annual_savings': round(annual_savings, 2),
        'roi_percent': round(roi_percent, 1),
        'times_paid': round(times_paid, 1)
    }
