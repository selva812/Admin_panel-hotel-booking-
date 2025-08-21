// api/request-booking/check/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const excludeId = searchParams.get('exclude')

    if (!dateParam) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
    }

    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    const istOffsetMinutes = 330 // IST is UTC+5:30
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))
    startOfDay.setUTCMinutes(startOfDay.getUTCMinutes() - istOffsetMinutes)
    const endOfDay = new Date(startOfDay)
    endOfDay.setUTCMinutes(endOfDay.getUTCMinutes() + 24 * 60 - 1)
    const whereClause: any = {
      OR: [{ bookingstatus: 2 }],
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: true
    }

    if (excludeId && !isNaN(Number(excludeId))) {
      whereClause.id = {
        not: Number(excludeId)
      }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      select: {
        id: true,
        bookingref: true,
        date: true,
        rooms: true,
        customer: {
          select: {
            phoneNumber: true,
            name: true,
            id: true
          }
        },
        bookedRooms: {
          select: {
            room: {
              select: {
                roomNumber: true
              }
            }
          }
        }
      }
    })

    const totalRooms = bookings.reduce((sum, booking) => sum + booking.rooms, 0)

    return NextResponse.json({
      date: date.toISOString().split('T')[0],
      totalRooms,
      bookings: bookings.map(booking => ({
        id: booking.id,
        reference: booking.bookingref,
        date: booking.date,
        customerId: booking.customer?.id,
        customerName: booking.customer?.name,
        phoneNumber: booking.customer?.phoneNumber,
        rooms: booking.bookedRooms.map(room => room.room.roomNumber)
      }))
    })
  } catch (error) {
    console.error('Booking Check Error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
