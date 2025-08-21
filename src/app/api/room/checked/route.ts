import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Incoming Request:', request.url)

    const { searchParams } = new URL(request.url)
    const checkInDateStr = searchParams.get('checkInDate')

    if (!checkInDateStr) {
      console.warn('[WARNING] checkInDate query param is missing')
      return NextResponse.json({ message: 'checkInDate is required' }, { status: 400 })
    }

    console.log('[DEBUG] Received checkInDate:', checkInDateStr)

    const [day, month, year] = checkInDateStr.split('-')
    const localDate = new Date(Number(year), Number(month) - 1, Number(day))

    if (isNaN(localDate.getTime())) {
      console.error('[ERROR] Invalid date format:', checkInDateStr)
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    const selectedDate = new Date(localDate.getTime())
    const earlyBufferDate = new Date(selectedDate.getTime() - 5 * 60 * 60 * 1000)
    const nextDay = new Date(selectedDate)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)

    console.log('[DEBUG] selectedDate:', selectedDate.toISOString())
    console.log('[DEBUG] earlyBufferDate:', earlyBufferDate.toISOString())
    console.log('[DEBUG] nextDay:', nextDay.toISOString())

    const rooms = await prisma.room.findMany({
      include: {
        type: true,
        floor: true,
        bookingRooms: {
          include: {
            booking: true
          },
          where: {
            checkIn: { lt: nextDay },
            checkOut: { gt: earlyBufferDate },
            booking: {
              bookingstatus: 0
            }
          }
        }
      }
    })

    console.log('[DEBUG] Total rooms fetched:', rooms.length)

    const pendingRooms = rooms
      .filter(room => room.bookingRooms.length > 0)
      .map(room => ({
        id: room.id,
        roomNumber: room.roomNumber,
        roomName: room.type.name,
        floorName: room.floor.name,
        acPrice: Number(room.acPrice),
        nonAcPrice: Number(room.nonAcPrice),
        occupancy: room.occupancy,
        bookingDetails: room.bookingRooms.map(br => ({
          checkIn: br.checkIn,
          checkOut: br.checkOut,
          bookingStatus: br.booking.bookingstatus,
          adults: br.adults,
          children: br.children
        }))
      }))

    console.log('[DEBUG] Pending rooms count:', pendingRooms.length)

    return NextResponse.json(pendingRooms, { status: 200 })
  } catch (error: any) {
    console.error('[FATAL ERROR] Failed to fetch pending rooms:', error?.message)
    console.error('[STACK TRACE]', error?.stack)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}
