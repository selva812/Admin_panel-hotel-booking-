import { prisma } from '@/libs/prisma'
import { fromZonedTime } from 'date-fns-tz'
import { NextRequest, NextResponse } from 'next/server'
const INDIA_TIMEZONE = 'Asia/Kolkata'
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
    }
    console.log('date params', dateParam)
    const date = fromZonedTime(dateParam, INDIA_TIMEZONE)
    console.log('after convert ', date)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    // Convert given date to exact requested moment in UTC
    const requestedMoment = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours() || 0,
        date.getUTCMinutes() || 0,
        date.getUTCSeconds() || 0
      )
    )
    console.log('request moment', requestedMoment)
    // Fetch all rooms with relations
    const allRooms = await prisma.room.findMany({
      where: { status: true },
      include: { type: true, floor: true }
    })

    // Fetch all bookings that overlap the given moment
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            checkIn: { lte: requestedMoment },
            checkOut: { gte: requestedMoment }
          }
        }
      },
      select: {
        id: true,
        bookingstatus: true,
        bookedRooms: {
          select: {
            roomId: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true
          }
        }
      }
    })

    // 🔹 New: Fetch future bookings starting within 24 hours of requestedMoment
    const futureBookingsSoon = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            checkIn: {
              gt: requestedMoment,
              lte: new Date(requestedMoment.getTime() + 24 * 60 * 60 * 1000) // within next 24 hours
            }
          }
        }
      },
      select: {
        bookedRooms: {
          select: {
            roomId: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true
          }
        }
      }
    })
    // Map roomId → checkout date for occupied rooms
    const occupiedMap = new Map<number, Date>()
    for (const booking of overlappingBookings) {
      for (const br of booking.bookedRooms) {
        if (!br.isCheckedOut) {
          occupiedMap.set(br.roomId, br.checkOut)
        }
      }
    }
    // 🔹 Add "blocked for future within 24h" logic
    for (const booking of futureBookingsSoon) {
      for (const br of booking.bookedRooms) {
        if (!br.isCheckedOut && !occupiedMap.has(br.roomId)) {
          occupiedMap.set(br.roomId, br.checkOut)
        }
      }
    }

    // Build availableRooms array with expected checkout info
    const availableRooms = allRooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      type: room.type.name,
      floor: room.floor.name,
      acPrice: room.acPrice,
      nonAcPrice: room.nonAcPrice,
      online_ac: room.online_acPrice,
      online_nonac: room.online_nonAcPrice,
      occupancy: room.occupancy,
      expectedCheckout: occupiedMap.get(room.id) || null
    }))

    // Count stats
    const totalRooms = allRooms.length
    const bookedCount = occupiedMap.size
    const availableCount = totalRooms - bookedCount

    return NextResponse.json({
      date: requestedMoment.toISOString(),
      totalRooms,
      booked: bookedCount,
      available: availableCount,
      availableRooms
    })
  } catch (error: any) {
    console.error('Availability check error:', error)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
