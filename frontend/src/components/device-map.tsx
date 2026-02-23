'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { DeviceStatus } from '@/lib/api'

interface DeviceMapProps {
  device: DeviceStatus | null
}

export function DeviceMap({ device }: DeviceMapProps) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return

    // Carregar CSS do Leaflet
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // Importar Leaflet apenas no cliente
    import('leaflet').then((L) => {
      if (!mapContainerRef.current) return

      // Inicializar mapa
      const map = L.map(mapContainerRef.current).setView([-23.5505, -46.6333], 12)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isClient])

  useEffect(() => {
    if (!isClient || !mapRef.current || !device || !device.last_lat || !device.last_lon) return

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      const pos: [number, number] = [device.last_lat!, device.last_lon!]

      // Remover marcador anterior
      if (markerRef.current) {
        markerRef.current.remove()
      }

      // Criar ícone customizado
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${device.online ? '#22c55e' : '#6b7280'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      // Adicionar marcador
      const marker = L.marker(pos, { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 8px;">${device.device_id}</h3>
            <div style="font-size: 13px; color: #666;">
              <div>⚡ ${device.last_speed?.toFixed(1) || 0} km/h</div>
              <div>🌡️ ${device.last_temp?.toFixed(1) || 0}°C</div>
              <div>🔋 ${device.last_battery?.toFixed(1) || 0}V</div>
            </div>
          </div>
        `)

      markerRef.current = marker
      mapRef.current.setView(pos, 14)
    })
  }, [isClient, device])

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Localização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 rounded-lg bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Localização</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapContainerRef} className="h-96 rounded-lg overflow-hidden" />
      </CardContent>
    </Card>
  )
}
