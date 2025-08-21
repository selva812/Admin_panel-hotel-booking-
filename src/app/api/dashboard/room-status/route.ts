// app/api/dashboard/room-status/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const currentDate = new Date().toISOString().split('T')[0]

    // Step 1: Get all rooms with their status
    const allRooms = await prisma.room.findMany({
      select: {
        id: true,
        roomStatus: true,
        status: true
      }
    })

    // Step 2: Get all active bookings for today (excluding advance bookings unless they're active today)
    const activeBookings = await prisma.bookingRoom.findMany({
      where: {
        checkIn: { lte: new Date(currentDate) },
        checkOut: { gte: new Date(currentDate) },
        booking: {
          bookingstatus: { not: 2 } // Exclude advance bookings
        }
      },
      select: {
        roomId: true
      }
    })

    // Also include advance bookings that are active today
    const advanceBookingsActiveToday = await prisma.bookingRoom.findMany({
      where: {
        checkIn: { lte: new Date(currentDate) },
        checkOut: { gte: new Date(currentDate) },
        booking: {
          bookingstatus: 2 // Only advance bookings
        }
      },
      select: {
        roomId: true
      }
    })

    // Combine both sets of room IDs
    const allOccupiedRoomIds = [...activeBookings.map(b => b.roomId), ...advanceBookingsActiveToday.map(b => b.roomId)]
    const occupiedRoomIds = new Set(allOccupiedRoomIds)

    // Step 3: Count statuses
    const statusCounts = {
      maintenance: 0,
      occupied: 0,
      available: 0
    }

    allRooms.forEach(room => {
      if (room.roomStatus === 2) {
        statusCounts.maintenance++
      } else if (occupiedRoomIds.has(room.id)) {
        statusCounts.occupied++
      } else {
        statusCounts.available++
      }
    })

    return NextResponse.json({
      statuses: ['available', 'occupied', 'maintenance'],
      counts: [statusCounts.available, statusCounts.occupied, statusCounts.maintenance]
    })
  } catch (error) {
    console.error('Failed to fetch room status data:', error)
    return NextResponse.json({ error: 'Failed to fetch room status data' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
