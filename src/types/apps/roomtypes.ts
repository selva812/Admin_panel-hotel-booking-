// Type Imports
import type { ThemeColor } from '@core/types'

export type RoomStatusObj = {
  title: 'Available' | 'Occupied' | 'Maintenance' | 'Cleaning'
  color: ThemeColor
}

export type RoomTypes = {
  id: number
  roomNumber: string
  type: 'STANDARD' | 'DELUXE' | 'SUITE' | 'FAMILY' | 'EXECUTIVE'
  pricePerNight: number
  status: RoomStatusObj
  maxOccupancy: {
    adults: number
    children: number
  }
  amenities: string[]
  createdAt: string
  updatedAt: string
  actions: string
}

// Status color mapping
export const statusObj: Record<string, RoomStatusObj> = {
  AVAILABLE: { title: 'Available', color: 'success' },
  OCCUPIED: { title: 'Occupied', color: 'error' },
  MAINTENANCE: { title: 'Maintenance', color: 'warning' },
  CLEANING_IN_PROGRESS: { title: 'Cleaning', color: 'info' }
} as const
