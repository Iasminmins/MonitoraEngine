import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 5) return 'agora'
  if (seconds < 60) return `há ${seconds}s`
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes}min`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}
