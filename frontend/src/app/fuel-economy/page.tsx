'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, AlertTriangle, Target, Car, Clock, Zap, Route } from 'lucide-react';

interface Device {
  device_id: string;
  online: boolean;
  last_speed: number;
}

interface VehicleAnalysis {
  device_id: string;
  period_hours: number;
  waste_breakdown: {
    idle_cost: number;
    idle_hours: number;
    idle_percentage: number;
    aggressive_cost: number;
    aggressive_events: number;
    aggressive_percentage: number;
    route_cost: number;
    route_extra_km: number;
    route_percentage: number;
    total_waste: number;
  } | null;
}

interface FuelEconomyData {
  current_month_cost: number;
  previous_month_cost: number;
  savings: number;
  savings_percent: number;
  waste_breakdown: {
    idle_cost: number;
    idle_hours: number;
    idle_percentage: number;
    aggressive_cost: number;
    aggressive_events: number;
    aggressive_percentage: number;
    route_cost: number;
    route_extra_km: number;
    route_percentage: number;
    total_waste: number;
  };
  top_drivers: Array<{
    driver_id: string;
    score: number;
    avg_consumption: number;
    harsh_events: number;
    idle_hours: number;
    estimated_waste: number;
    rank: number;
  }>;
  critical_alerts: Array<{
    device_id: string;
    type: string;
    message: string;
    cost: number;
  }>;
  roi_data: {
    payback_months: number;
    annual_savings: number;
    roi_percent: number;
    system_cost: number;
    monthly_savings: number;
  };
}

export default function FuelEconomyPage() {
  const [viewMode, setViewMode] = useState<'global' | 'individual'>('global');
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleAnalysis | null>(null);
  const [globalData, setGlobalData] = useState<FuelEconomyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (viewMode === 'global') {
      fetchGlobalData();
      const interval = setInterval(fetchGlobalData, 60000);
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'individual' && selectedDevice) {
      fetchVehicleData(selectedDevice);
    }
  }, [viewMode, selectedDevice]);

  async function fetchDevices() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/devices`);
      if (!response.ok) throw new Error('Falha ao carregar devices');
      const result = await response.json();
      setDevices(result);
      if (result.length > 0 && !selectedDevice) {
        setSelectedDevice(result[0].device_id);
      }
    } catch (err) {
      console.error('Erro ao carregar devices:', err);
    }
  }

  async function fetchGlobalData() {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/fuel-analysis/dashboard?hours=24`);
      if (!response.ok) throw new Error('Falha ao carregar dados');
      const result = await response.json();
      setGlobalData(result);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dashboard global');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicleData(deviceId: string) {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/fuel-analysis/calculate/${deviceId}?hours=24`);
      if (!response.ok) throw new Error('Falha ao carregar dados do veículo');
      const result = await response.json();
      setVehicleData(result);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados do veículo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !globalData && !vehicleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-900 mb-2">Ops!</p>
            <p className="text-slate-600 mb-4">{error}</p>
            <button 
              onClick={() => viewMode === 'global' ? fetchGlobalData() : fetchVehicleData(selectedDevice!)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Tentar Novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = viewMode === 'global' ? globalData : null;
  const waste = viewMode === 'individual' && vehicleData?.waste_breakdown 
    ? vehicleData.waste_breakdown 
    : data?.waste_breakdown;

  const roiData = data?.roi_data || {
    system_cost: 70000,
    monthly_savings: 0,
    payback_months: 999,
    annual_savings: 0,
    roi_percent: 0
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return '🌟 Excelente';
    if (score >= 60) return '✅ Bom';
    if (score >= 40) return '⚠️ Regular';
    return '❌ Crítico';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              Economia de Combustível
            </h1>
            <p className="text-slate-600 mt-1">Análise inteligente de desperdício e eficiência</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <button
                onClick={() => setViewMode('global')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                  viewMode === 'global' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Target className="w-4 h-4" />
                Visão Geral
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                  viewMode === 'individual' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Car className="w-4 h-4" />
                Por Veículo
              </button>
            </div>

            {viewMode === 'individual' && devices.length > 0 && (
              <select
                value={selectedDevice || ''}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 shadow-sm hover:border-slate-300 transition-colors"
              >
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_id} {device.online ? '●' : '○'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ROI BANNER - Visão Global */}
        {viewMode === 'global' && (
          <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Retorno do Investimento</h3>
                  <p className="text-emerald-50 text-sm">Análise financeira do sistema</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-emerald-50 text-sm font-medium mb-1">Investimento</p>
                  <p className="text-white text-2xl font-bold">
                    R$ {(roiData?.system_cost || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-emerald-50 text-sm font-medium mb-1">Economia/Mês</p>
                  <p className="text-white text-2xl font-bold">
                    R$ {(roiData?.monthly_savings || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-emerald-50 text-sm font-medium mb-1">Payback</p>
                  <p className="text-white text-2xl font-bold">
                    {(roiData?.payback_months || 0).toFixed(1)} meses
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-emerald-50 text-sm font-medium mb-1">Economia Anual</p>
                  <p className="text-white text-2xl font-bold">
                    R$ {(roiData?.annual_savings || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CARDS PRINCIPAIS - Visão Global */}
        {viewMode === 'global' && data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Últimas 24h</span>
                </div>
                <p className="text-sm text-slate-600 font-medium mb-1">Desperdício Atual</p>
                <p className="text-3xl font-bold text-slate-900">
                  R$ {(data?.current_month_cost || 0).toLocaleString('pt-BR')}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-600">
                    {(data?.savings_percent || 0).toFixed(1)}% vs período anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Período Anterior</span>
                </div>
                <p className="text-sm text-slate-600 font-medium mb-1">Desperdício Anterior</p>
                <p className="text-3xl font-bold text-slate-900">
                  R$ {(data?.previous_month_cost || 0).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full">
                    ✓ META
                  </span>
                </div>
                <p className="text-sm text-emerald-700 font-medium mb-1">Economia Total</p>
                <p className="text-3xl font-bold text-emerald-900">
                  R$ {(data?.savings || 0).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CARD VEÍCULO INDIVIDUAL */}
        {viewMode === 'individual' && (
          <>
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-slate-600">Carregando dados do veículo...</p>
                </CardContent>
              </Card>
            ) : !vehicleData || !vehicleData.waste_breakdown ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">Aguardando Dados</h3>
                      <p className="text-amber-700 text-sm">
                        O veículo <strong>{selectedDevice}</strong> ainda não possui telemetria suficiente.
                        <br />
                        <span className="text-xs text-amber-600">Aguarde alguns minutos para acumular mais eventos...</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{selectedDevice}</h3>
                      <p className="text-sm text-slate-600">Análise das últimas 24 horas</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 mb-1">Desperdício Total</p>
                      <p className="text-2xl font-bold text-slate-900">
                        R$ {(waste?.total_waste || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 mb-1">Tempo Parado</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {(waste?.idle_hours || 0).toFixed(1)}h
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 mb-1">Eventos</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {waste?.aggressive_events || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 mb-1">Projeção Mensal</p>
                      <p className="text-2xl font-bold text-rose-600">
                        R$ {((waste?.total_waste || 0) * 30).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ANÁLISE DE DESPERDÍCIO */}
        {waste ? (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-slate-700" />
                </div>
                Análise de Desperdício
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Marcha Lenta */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Marcha Lenta</p>
                      <p className="text-sm text-slate-500">{(waste?.idle_hours || 0).toFixed(1)} horas parado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">
                      R$ {(waste?.idle_cost || 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm font-medium text-red-600">{waste?.idle_percentage || 0}% do total</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${waste?.idle_percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Direção Agressiva */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Direção Agressiva</p>
                      <p className="text-sm text-slate-500">{waste?.aggressive_events || 0} eventos registrados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">
                      R$ {(waste?.aggressive_cost || 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm font-medium text-orange-600">{waste?.aggressive_percentage || 0}% do total</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${waste?.aggressive_percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Rotas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Route className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Rotas Ineficientes</p>
                      <p className="text-sm text-slate-500">Otimização de trajeto</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">
                      R$ {(waste?.route_cost || 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm font-medium text-amber-600">{waste?.route_percentage || 0}% do total</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${waste?.route_percentage || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aguardando dados para análise de desperdício</p>
            </CardContent>
          </Card>
        )}

        {/* TOP DRIVERS & ALERTAS - Visão Global */}
        {viewMode === 'global' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Drivers */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  Top 5 Motoristas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {(data?.top_drivers || []).slice(0, 5).map((driver) => (
                    <div key={driver.driver_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-slate-400 shadow-sm">
                          #{driver.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{driver.driver_id}</p>
                          <p className="text-sm text-slate-500">
                            {driver.avg_consumption.toFixed(1)} km/L
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${getScoreColor(driver.score)}`}>
                        {driver.score}/100
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alertas */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  Alertas Críticos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {(data?.critical_alerts || []).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">✓</span>
                    </div>
                    <p className="text-slate-600 font-medium">Tudo em ordem!</p>
                    <p className="text-sm text-slate-500 mt-1">Nenhum alerta crítico no momento</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(data?.critical_alerts || []).map((alert, idx) => (
                      <div key={idx} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-red-900">{alert.device_id}</p>
                          <p className="font-bold text-red-600">
                            R$ {alert.cost.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-sm text-red-700">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}