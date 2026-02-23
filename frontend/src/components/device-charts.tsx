'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from './ui/skeleton'
import { format } from 'date-fns'

interface DeviceChartsProps {
  deviceId: string | null
}

export function DeviceCharts({ deviceId }: DeviceChartsProps) {
  const [timeRange, setTimeRange] = useState<15 | 60 | 360>(60)

  const { data: events, isLoading } = useQuery({
    queryKey: ['device-events', deviceId, timeRange],
    queryFn: () => deviceId ? api.getDeviceEvents(deviceId, timeRange, 500) : Promise.resolve([]),
    enabled: !!deviceId,
    refetchInterval: 3000,
  })

  const chartData = events?.map(e => ({
    time: format(new Date(e.ts), 'HH:mm:ss'),
    speed: e.speed_kmh || 0,
    temp: e.engine_temp_c || 0,
    battery: e.battery_v || 0,
  })).reverse() || []

  if (!deviceId) {
    return (
      <div className="py-12 text-center text-slate-400">
        Selecione um device para ver os gráficos
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botões de filtro de tempo */}
      <div className="flex justify-end gap-2">
        {[15, 60, 360].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeRange === range
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {range < 60 ? `${range}min` : `${range / 60}h`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-[500px] bg-slate-100" />
      ) : (
        <div className="space-y-6">
          {/* Gráfico de Velocidade */}
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Velocidade (km/h)</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="speed" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false}
                  name="Velocidade"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Temperatura */}
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Temperatura (°C)</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  dot={false}
                  name="Temperatura"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Bateria */}
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Bateria (V)</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  domain={[11, 13]} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="battery" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  dot={false}
                  name="Bateria"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
