'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Clock,
  Zap,
  Search,
  Moon,
  Sun,
  Gauge,
  Navigation,
  Fuel,
  Menu,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceMap } from '@/components/device-map'
import { DeviceCharts } from '@/components/device-charts'

export default function DashboardPage() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: api.getDevices,
    refetchInterval: 2000,
  })

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => api.getMetrics(5),
    refetchInterval: 2000,
  })

  const currentDevice = devices?.find(d => d.device_id === selectedDevice)

  // Debug
  useEffect(() => {
    if (currentDevice) {
      console.log('Current device:', currentDevice)
      console.log('Lat/Lon:', currentDevice.last_lat, currentDevice.last_lon)
    }
  }, [currentDevice])

  const filteredDevices = devices?.filter(device => {
    if (filter === 'online') return device.online
    if (filter === 'offline') return !device.online
    return true
  }) || []

  const devicesOnline = devices?.filter(d => d.online).length || 0
  const eventsLastMin = metrics?.events_last_minute || 0
  const avgSpeed = metrics?.avg_speed_5min || 0
  const alertsCount = metrics?.alerts_last_10min || 0

  const getDeviceStatusColor = (online: boolean) => {
    return online ? 'bg-emerald-500' : 'bg-slate-300'
  }

  const getSpeedColor = (speed: number) => {
    if (speed > 80) return 'text-rose-600'
    if (speed > 60) return 'text-amber-600'
    return 'text-emerald-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-slate-900">MonitoraEngine</h1>
                <p className="text-sm text-slate-600">Telemetria em Tempo Real</p>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Botão Economia de Combustível */}
              <Link href="/fuel-economy">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium">
                  <Fuel className="w-5 h-5" />
                  Economia de Combustível
                </button>
              </Link>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar device..."
                  className="pl-10 pr-4 py-2.5 w-80 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-emerald-700">Online</span>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
              >
                {darkMode ? <Sun className="w-5 h-5 text-slate-700" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR MODAL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-80 h-full bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Devices</h2>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                    filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('online')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                    filter === 'online' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => setFilter('offline')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                    filter === 'offline' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
              {filteredDevices.map((device) => (
                <button
                  key={device.device_id}
                  onClick={() => {
                    setSelectedDevice(device.device_id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedDevice === device.device_id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{device.device_id}</span>
                    <span className={`w-2 h-2 rounded-full ${device.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <div className="text-xs text-slate-600">
                    {device.last_speed?.toFixed(1) || '0.0'} km/h
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </header>

      <div className="max-w-[1800px] mx-auto p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR */}
          <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <div className="space-y-4">
              {/* Filtros */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setFilter('all')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        filter === 'all'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilter('online')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        filter === 'online'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Online
                    </button>
                    <button
                      onClick={() => setFilter('offline')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        filter === 'offline'
                          ? 'bg-slate-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Offline
                    </button>
                  </div>

                  {/* Lista de Devices */}
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {filteredDevices.map((device) => (
                      <button
                        key={device.device_id}
                        onClick={() => setSelectedDevice(device.device_id)}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          selectedDevice === device.device_id
                            ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getDeviceStatusColor(device.online)} ${device.online ? 'animate-pulse' : ''}`} />
                          <span className="font-semibold text-slate-900 flex items-center gap-2">
                            <Navigation className="w-4 h-4" />
                            {device.device_id}
                          </span>
                          <span className={`ml-auto text-sm font-bold ${getSpeedColor(device.last_speed || 0)}`}>
                            {device.last_speed?.toFixed(1) || 0} km/h
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>há {device.last_seen ? getTimeAgo(device.last_seen) : '---'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 space-y-6">
            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Devices Online */}
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Activity className="w-6 h-6 text-emerald-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Devices Online</p>
                  <p className="text-4xl font-bold text-slate-900">{devicesOnline}</p>
                  <p className="text-xs text-slate-500 mt-2">de {devices?.length || 0} total</p>
                </CardContent>
              </Card>

              {/* Eventos */}
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Eventos (1min)</p>
                  <p className="text-4xl font-bold text-slate-900">{eventsLastMin}</p>
                  <p className="text-xs text-slate-500 mt-2">eventos recebidos</p>
                </CardContent>
              </Card>

              {/* Velocidade Média */}
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Gauge className="w-6 h-6 text-purple-600" />
                    </div>
                    <Navigation className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Velocidade Média</p>
                  <p className="text-4xl font-bold text-slate-900">{avgSpeed.toFixed(1)} <span className="text-xl">km/h</span></p>
                  <p className="text-xs text-slate-500 mt-2">últimos 5 minutos</p>
                </CardContent>
              </Card>

              {/* Alertas */}
              <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-all group ${alertsCount > 0 ? 'bg-rose-50 border-rose-200' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                      alertsCount > 0 ? 'bg-rose-100' : 'bg-slate-50'
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${alertsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                    </div>
                    {alertsCount > 0 && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Alertas (10min)</p>
                  <p className={`text-4xl font-bold ${alertsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{alertsCount}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {alertsCount > 0 ? 'requer atenção' : 'tudo ok'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* MAPA E GRÁFICOS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* MAPA - 1 coluna (50%) */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="flex items-center gap-3 text-slate-900">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">Localização em Tempo Real</p>
                      {selectedDevice ? (
                        <p className="text-sm font-normal text-slate-600">Rastreando {selectedDevice}</p>
                      ) : (
                        <p className="text-sm font-normal text-slate-600">Selecione um device para ver no mapa</p>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[680px] w-full">
                    <DeviceMap device={currentDevice || null} />
                  </div>
                </CardContent>
              </Card>

              {/* GRÁFICOS - 1 coluna (50%) */}
              <div className="border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
                <div className="border-b border-slate-100 pb-3 p-6">
                  <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Gráficos em Tempo Real
                  </div>
                </div>
                <div className="p-4 h-[640px] overflow-y-auto">
                  {selectedDevice ? (
                    <DeviceCharts deviceId={selectedDevice} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">Selecione um device</p>
                        <p className="text-xs">para ver os gráficos</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// Helper function
function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now.getTime() - past.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  
  if (diffSec < 60) return `${diffSec}s`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
  return `${Math.floor(diffSec / 86400)}d`
}