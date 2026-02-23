'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Activity, Gauge, AlertTriangle, TrendingUp } from 'lucide-react'

export function MetricsCards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => api.getMetricsSummary(5),
    refetchInterval: 3000,
  })

  const cards = [
    {
      title: 'Devices Online',
      value: metrics?.devices_online || 0,
      icon: Activity,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Eventos (1min)',
      value: metrics?.events_last_minute || 0,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Velocidade Média',
      value: `${metrics?.avg_speed_5min.toFixed(1) || 0} km/h`,
      icon: Gauge,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Alertas (10min)',
      value: metrics?.alerts_last_10min || 0,
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{card.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
