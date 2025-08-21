// api/booking-calender/route.ts
import { PrismaClient } from '@prisma/client'
import { format, eachDayOfInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, toDate } from 'date-fns-tz'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()
const TIMEZONE = 'Asia/Kolkata'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ message: 'Start date and end date are required' }, { status: 400 })
    }

    // Parse dates properly - treat input as IST dates
    const startDateIST = parseISO(startDate)
    const endDateIST = parseISO(endDate)

    // Get current date in IST for comparison
    const todayIST = toZonedTime(new Date(), TIMEZONE)
    const todayDateOnly = startOfDay(todayIST)

    const totalRooms = await prisma.room.count({ where: { status: true } })

    console.log(`Date range: ${format(startDateIST, 'yyyy-MM-dd')} to ${format(endDateIST, 'yyyy-MM-dd')}`)
    console.log(`Today IST: ${format(todayDateOnly, 'yyyy-MM-dd')}`)

    // Get active booking rooms that are not checked out
    const activeBookingRooms = await prisma.bookingRoom.findMany({
      where: {
        status: true,
        isCheckedOut: false,
        booking: {
          bookingstatus: 1,
          status: true
        }
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingref: true,
            bookingstatus: true
          }
        },
        room: {
          select: {
            id: true,
            roomNumber: true
          }
        }
      }
    })

    console.log(`Found ${activeBookingRooms.length} active booking rooms`)

    // Get requested bookings for the date range
    const requestedBookings = await prisma.booking.findMany({
      where: {
        type: false,
        bookingstatus: 2,
        status: true,
        date: {
          gte: toDate(format(startDateIST, 'yyyy-MM-dd') + 'T00:00:00', { timeZone: TIMEZONE }),
          lte: toDate(format(endDateIST, 'yyyy-MM-dd') + 'T23:59:59', { timeZone: TIMEZONE })
        }
      },
      select: {
        date: true,
        rooms: true
      }
    })

    // Initialize day map
    const days: Record<string, { booked: number; available: number; requested: number; totalRooms: number }> = {}
    const dateRange = eachDayOfInterval({
      start: startDateIST,
      end: endDateIST
    })

    for (const day of dateRange) {
      const dateStr = format(day, 'yyyy-MM-dd')
      days[dateStr] = {
        booked: 0,
        available: totalRooms,
        requested: 0,
        totalRooms
      }
    }

    // Process each booking room
    for (const bookingRoom of activeBookingRooms) {
      // Convert UTC times to IST for date comparison
      const checkInUTC = new Date(bookingRoom.checkIn)
      const checkOutUTC = new Date(bookingRoom.checkOut)

      // Convert to IST
      const checkInIST = toZonedTime(checkInUTC, TIMEZONE)
      const checkOutIST = toZonedTime(checkOutUTC, TIMEZONE)

      // Get date-only versions
      const checkInDate = startOfDay(checkInIST)
      const checkOutDate = startOfDay(checkOutIST)

      console.log(`Room ${bookingRoom.room.roomNumber} (ID: ${bookingRoom.roomId}):`)
      console.log(`  CheckIn: ${format(checkInDate, 'yyyy-MM-dd')}`)
      console.log(`  CheckOut: ${format(checkOutDate, 'yyyy-MM-dd')}`)
      console.log(`  IsCheckedOut: ${bookingRoom.isCheckedOut}`)

      // Determine effective end date for occupancy
      let effectiveEndDate = checkOutDate

      // If not checked out and checkout date is in the past or today, extend to today
      if (!bookingRoom.isCheckedOut && checkOutDate <= todayDateOnly) {
        effectiveEndDate = todayDateOnly
        console.log(`  Extended to: ${format(effectiveEndDate, 'yyyy-MM-dd')} (overstay)`)
      }

      // Find overlapping days within the requested range
      const occupancyStart = checkInDate > startDateIST ? checkInDate : startDateIST
      const occupancyEnd = effectiveEndDate < endDateIST ? effectiveEndDate : endDateIST

      if (occupancyStart <= occupancyEnd) {
        const occupiedDays = eachDayOfInterval({
          start: occupancyStart,
          end: occupancyEnd
        })

        console.log(`  Occupied days: ${occupiedDays.map(d => format(d, 'yyyy-MM-dd')).join(', ')}`)

        for (const day of occupiedDays) {
          const dateStr = format(day, 'yyyy-MM-dd')
          if (days[dateStr]) {
            days[dateStr].booked += 1
            console.log(`  Marked ${dateStr} as booked`)
          }
        }
      }
    }

    // Process requested bookings
    for (const booking of requestedBookings) {
      const bookingDateIST = toZonedTime(booking.date, TIMEZONE)
      const dateStr = format(bookingDateIST, 'yyyy-MM-dd')

      if (days[dateStr]) {
        days[dateStr].requested += booking.rooms
        console.log(`Added ${booking.rooms} requested rooms for ${dateStr}`)
      }
    }

    // Calculate final availability
    for (const dateStr in days) {
      days[dateStr].available = Math.max(0, totalRooms - days[dateStr].booked)
    }

    console.log('Final day summary:')
    Object.entries(days).forEach(([date, data]) => {
      console.log(`${date}: Booked=${data.booked}, Available=${data.available}, Requested=${data.requested}`)
    })

    return NextResponse.json({
      totalRooms,
      days,
      debug: {
        today: format(todayDateOnly, 'yyyy-MM-dd'),
        queryRange: {
          start: format(startDateIST, 'yyyy-MM-dd'),
          end: format(endDateIST, 'yyyy-MM-dd')
        },
        activeBookings: activeBookingRooms.length
      }
    })
  } catch (error: any) {
    console.error('Calendar data fetch error:', error)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
