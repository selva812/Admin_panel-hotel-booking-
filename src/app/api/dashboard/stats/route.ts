// app/api/availability/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')

    // Requested date (default: today)
    const requestedDate = dateParam ? new Date(dateParam) : new Date()
    requestedDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(requestedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Fetch all bookings with their booking rooms and room details
    const bookings = await prisma.booking.findMany({
      include: {
        bookedRooms: {
          include: {
            room: true
          }
        }
      },
      where: {
        status: true
      }
    })

    const allRooms = await prisma.room.findMany({
      where: {
        status: true
      }
    })
    const totalRooms = allRooms.length

    let occupiedRooms: any[] = []
    let reservedRooms = 0
    let overdueRooms = 0

    bookings.forEach(booking => {
      booking.bookedRooms.forEach(bookedRoom => {
        const checkIn = new Date(bookedRoom.checkIn)
        const checkOut = new Date(bookedRoom.checkOut)

        // OCCUPIED (check-in date has passed and not checked out yet)
        if (checkIn <= requestedDate && !bookedRoom.isCheckedOut) {
          occupiedRooms.push({
            roomId: bookedRoom.roomId,
            roomNumber: bookedRoom.room.roomNumber,
            checkIn: bookedRoom.checkIn,
            checkOut: bookedRoom.checkOut,
            isExtended: checkOut > new Date(booking.date),
            isOverstayed: checkOut < requestedDate
          })

          // OVERDUE if checkout date already passed
          if (checkOut < requestedDate) {
            overdueRooms++
          }
        }

        // RESERVED (future check-in)
        if (checkIn >= requestedDate && checkIn < nextDay) {
          reservedRooms++
        }
      })
    })

    const availableRooms = totalRooms - (occupiedRooms.length + reservedRooms)

    return NextResponse.json({
      totalBookings: bookings.length,
      totalCustomers: await prisma.customer.count(),
      totalRooms,
      occupiedRooms: occupiedRooms.length,
      reservedRooms,
      availableRooms,
      overdueRooms,
      detailedOccupiedRooms: occupiedRooms
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
