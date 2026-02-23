"""
Script de teste rápido para endpoints de economia de combustível
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """Testa health check"""
    print("\n" + "="*60)
    print("TESTE 1: Health Check")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_devices():
    """Testa listagem de devices"""
    print("\n" + "="*60)
    print("TESTE 2: Listar Devices")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/devices")
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Total devices: {len(data)}")
    if data:
        print(f"Primeiro device: {json.dumps(data[0], indent=2, default=str)}")
    return response.status_code == 200

def test_fuel_dashboard():
    """Testa dashboard de economia"""
    print("\n" + "="*60)
    print("TESTE 3: Dashboard de Economia")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/fuel-analysis/dashboard?days=7")
    
    if response.status_code != 200:
        print(f"❌ Erro: {response.status_code}")
        print(f"Detalhes: {response.text}")
        return False
    
    data = response.json()
    print(f"Status: {response.status_code}")
    print("\n📊 RESUMO FINANCEIRO:")
    print(f"  Custo mês atual: R$ {data.get('current_month_cost', 0):,.2f}")
    print(f"  Custo mês anterior: R$ {data.get('previous_month_cost', 0):,.2f}")
    print(f"  Economia: R$ {data.get('savings', 0):,.2f} ({data.get('savings_percent', 0):.1f}%)")
    
    print("\n💸 DESPERDÍCIO:")
    waste = data.get('waste_breakdown', {})
    print(f"  Marcha lenta: R$ {waste.get('idle_cost', 0):,.2f} ({waste.get('idle_percentage', 0):.1f}%)")
    print(f"  Direção agressiva: R$ {waste.get('aggressive_cost', 0):,.2f} ({waste.get('aggressive_percentage', 0):.1f}%)")
    print(f"  Rotas: R$ {waste.get('route_cost', 0):,.2f} ({waste.get('route_percentage', 0):.1f}%)")
    print(f"  TOTAL: R$ {waste.get('total_waste', 0):,.2f}")
    
    print("\n🏆 TOP MOTORISTAS:")
    for driver in data.get('top_drivers', [])[:3]:
        print(f"  {driver.get('rank')}º {driver.get('driver_id')}: Score {driver.get('score')}/100")
    
    print("\n⚠️  ALERTAS CRÍTICOS:")
    for alert in data.get('critical_alerts', [])[:3]:
        print(f"  • {alert.get('description')} (R$ {alert.get('cost_per_month', 0):,.2f}/mês)")
    
    print("\n💰 ROI DO SISTEMA:")
    roi = data.get('roi_data', {})
    print(f"  Payback: {roi.get('payback_months', 0):.1f} meses")
    print(f"  Economia anual: R$ {roi.get('annual_savings', 0):,.2f}")
    print(f"  ROI: {roi.get('roi_percent', 0):.1f}%")
    
    return True

def test_driver_ranking():
    """Testa ranking de motoristas"""
    print("\n" + "="*60)
    print("TESTE 4: Ranking de Motoristas")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/fuel-analysis/driver-ranking?hours=168")
    
    if response.status_code != 200:
        print(f"❌ Erro: {response.status_code}")
        return False
    
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"\nTotal motoristas: {len(data)}")
    
    for driver in data[:5]:
        print(f"\n{driver.get('rank')}º lugar - {driver.get('driver_id')}")
        print(f"  Score: {driver.get('score')}/100")
        print(f"  Consumo médio: {driver.get('avg_consumption'):.2f} km/L")
        print(f"  Eventos agressivos: {driver.get('harsh_events')}")
        print(f"  Tempo parado: {driver.get('idle_hours'):.1f}h")
        print(f"  Desperdício estimado: R$ {driver.get('estimated_waste'):.2f}")
    
    return True

def main():
    """Executa todos os testes"""
    print("\n" + "🚀 INICIANDO TESTES DE ECONOMIA DE COMBUSTÍVEL")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "Health Check": test_health(),
        "Listar Devices": test_devices(),
        "Dashboard Economia": test_fuel_dashboard(),
        "Ranking Motoristas": test_driver_ranking()
    }
    
    print("\n" + "="*60)
    print("📋 RESUMO DOS TESTES")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"{test_name}: {status}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\nTotal: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
    else:
        print("\n⚠️  ALGUNS TESTES FALHARAM")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERRO: Não foi possível conectar ao backend")
        print("Certifique-se que o backend está rodando em http://localhost:8000")
    except Exception as e:
        print(f"\n❌ ERRO INESPERADO: {e}")
