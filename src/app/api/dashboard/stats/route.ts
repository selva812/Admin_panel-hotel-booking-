// app/api/availability/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const requestedDate = dateParam ? new Date(dateParam) : new Date()
    requestedDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(requestedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Fetch only confirmed bookings (status: true AND bookingstatus not equal to 2 for advance requests)
    const bookings = await prisma.booking.findMany({
      include: {
        bookedRooms: {
          include: {
            room: true
          }
        }
      },
      where: {
        status: true,
        bookingstatus: {
          not: 2 // Exclude advance booking requests
        }
      }
    })

    const allRooms = await prisma.room.findMany({
      where: {
        status: true
      }
    })
    const totalRooms = allRooms.length

    let occupiedRooms: any[] = []
    let reservedRooms: any[] = []
    let overdueRooms = 0

    // Create a set to track unique room IDs to avoid double counting
    const occupiedRoomIds = new Set<number>()
    const reservedRoomIds = new Set<number>()

    bookings.forEach(booking => {
      booking.bookedRooms.forEach(bookedRoom => {
        const checkIn = new Date(bookedRoom.checkIn)
        const checkOut = new Date(bookedRoom.checkOut)
        checkIn.setHours(0, 0, 0, 0)
        checkOut.setHours(0, 0, 0, 0)

        // OCCUPIED: Checked in and not checked out yet
        // Changed condition: checkIn <= requestedDate && checkOut >= requestedDate
        // to: checkIn <= requestedDate && (checkOut > requestedDate || !bookedRoom.isCheckedOut)
        if (checkIn <= requestedDate && (checkOut > requestedDate || !bookedRoom.isCheckedOut)) {
          if (!occupiedRoomIds.has(bookedRoom.roomId)) {
            occupiedRoomIds.add(bookedRoom.roomId)
            const isOverstayed = checkOut < requestedDate

            occupiedRooms.push({
              roomId: bookedRoom.roomId,
              roomNumber: bookedRoom.room.roomNumber,
              checkIn: bookedRoom.checkIn,
              checkOut: bookedRoom.checkOut,
              isExtended: checkOut > new Date(booking.date),
              isOverstayed: isOverstayed,
              isCheckedOut: bookedRoom.isCheckedOut,
              bookingId: booking.id
            })

            // OVERDUE: Checkout date has passed but guest hasn't checked out
            if (isOverstayed) {
              overdueRooms++
            }
          }
        }

        // RESERVED: Future check-in (tomorrow or later)
        if (checkIn >= nextDay && !bookedRoom.isCheckedOut) {
          if (!reservedRoomIds.has(bookedRoom.roomId) && !occupiedRoomIds.has(bookedRoom.roomId)) {
            reservedRoomIds.add(bookedRoom.roomId)
            reservedRooms.push({
              roomId: bookedRoom.roomId,
              roomNumber: bookedRoom.room.roomNumber,
              checkIn: bookedRoom.checkIn,
              checkOut: bookedRoom.checkOut,
              bookingId: booking.id
            })
          }
        }
      })
    })

    const availableRooms = totalRooms - (occupiedRooms.length + reservedRooms.length)

    return NextResponse.json({
      totalBookings: bookings.length,
      totalCustomers: await prisma.customer.count(),
      totalRooms,
      occupiedRooms: occupiedRooms.length,
      reservedRooms: reservedRooms.length,
      availableRooms,
      overdueRooms,
      detailedOccupiedRooms: occupiedRooms,
      detailedReservedRooms: reservedRooms
    })
  } catch (error) {
    console.error('Availability API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
