'use client'

import { useQuery } from '@tanstack/react-query'
import { api, DeviceStatus } from '@/lib/api'
import { Skeleton } from './ui/skeleton'
import { formatTimeAgo } from '@/lib/utils'
import { Truck, Gauge, DollarSign } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface SidebarProps {
  onDeviceSelect: (deviceId: string) => void
  selectedDevice: string | null
}

export function Sidebar({ onDeviceSelect, selectedDevice }: SidebarProps) {
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: api.getDevices,
    refetchInterval: 2000,
  })

  const filteredDevices = devices?.filter((d) => {
    if (filter === 'online') return d.online
    if (filter === 'offline') return !d.online
    return true
  }) || []

  return (
    <div className="w-80 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-3">Devices</h2>
        
        {/* LINK PARA ECONOMIA DE COMBUSTÍVEL */}
        <Link 
          href="/fuel-economy"
          className="mb-3 flex items-center gap-2 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <DollarSign className="h-5 w-5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Economia Combustível</p>
            <p className="text-xs opacity-90">Ver dashboard completo</p>
          </div>
        </Link>
        
        <div className="flex gap-2">
          {(['all', 'online', 'offline'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'online' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 mb-2" />
          ))
        ) : filteredDevices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum device encontrado</p>
          </div>
        ) : (
          filteredDevices.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              isSelected={selectedDevice === device.device_id}
              onClick={() => onDeviceSelect(device.device_id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function DeviceCard({ device, isSelected, onClick }: {
  device: DeviceStatus
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg mb-2 cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'bg-primary/10 border-2 border-primary'
          : 'bg-card border hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <span className="font-medium text-sm">{device.device_id}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            device.online
              ? 'bg-green-500/20 text-green-700 dark:text-green-300'
              : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
          }`}
        >
          {device.online ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Gauge className="h-3 w-3" />
          <span>{device.last_speed?.toFixed(1) || 0} km/h</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(new Date(device.last_seen))}
        </p>
      </div>
    </div>
  )
}
