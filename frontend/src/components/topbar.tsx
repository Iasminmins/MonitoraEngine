'use client'

import { Activity, Search } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function Topbar() {
  const { data: health, isError } = useQuery({
    queryKey: ['health'],
    queryFn: api.healthCheck,
    refetchInterval: 5000,
  })

  return (
    <div className="border-b bg-card">
      <div className="flex h-16 items-center px-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">MonitoraEngine</h1>
            <p className="text-xs text-muted-foreground">Telemetria em Tempo Real</p>
          </div>
        </div>

        <div className="flex-1 max-w-md ml-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar device..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border">
            <div className={`h-2 w-2 rounded-full ${isError ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
            <span className="text-xs font-medium">
              {isError ? 'Offline' : 'Online'}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
