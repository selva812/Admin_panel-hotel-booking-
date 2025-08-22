// api/bookingcalender/detail/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { format, parseISO, startOfDay } from 'date-fns'
import { toDate, toZonedTime } from 'date-fns-tz'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()
const TIMEZONE = 'Asia/Kolkata'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
    }

    // Parse the requested date as IST
    const requestedDate = parseISO(dateParam)
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    // Get current date in IST
    const todayIST = toZonedTime(new Date(), TIMEZONE)
    const todayDateOnly = startOfDay(todayIST)
    const requestedDateOnly = startOfDay(requestedDate)
    const totalRooms = await prisma.room.count({ where: { status: true } })
    console.log(`Requested date: ${format(requestedDateOnly, 'yyyy-MM-dd')}`)
    console.log(`Today: ${format(todayDateOnly, 'yyyy-MM-dd')}`)

    // Get all active booking rooms
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
            bookingstatus: true,
            customer: {
              select: {
                name: true,
                phoneNumber: true,
                idNumber: true,
                address: true,
                companyName: true
              }
            }
          }
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: { select: { name: true } },
            floor: { select: { name: true } }
          }
        }
      }
    })

    // Get all rooms for available rooms calculation
    const allRooms = await prisma.room.findMany({
      where: { status: true },
      include: {
        type: { select: { name: true } },
        floor: { select: { name: true } }
      },
      orderBy: [{ floorId: 'asc' }, { roomNumber: 'asc' }]
    })

    // Get requested bookings for the specific date
    const startOfDayUTC = toDate(format(requestedDateOnly, 'yyyy-MM-dd') + 'T00:00:00', { timeZone: TIMEZONE })
    const endOfDayUTC = toDate(format(requestedDateOnly, 'yyyy-MM-dd') + 'T23:59:59', { timeZone: TIMEZONE })

    const requestedBookings = await prisma.booking.findMany({
      where: {
        type: false,
        bookingstatus: 2,
        status: true,
        date: {
          gte: startOfDayUTC,
          lte: endOfDayUTC
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            phoneNumber: true,
            idNumber: true,
            address: true,
            companyName: true
          }
        },
        bookedRooms: {
          select: {
            room: true,
            roomId: true
          }
        }
      }
    })
    // Get checked out rooms for today only
    let checkedOutToday: ({
      booking: {
        bookingref: string
        customer: {
          name: string
          phoneNumber: string
          idNumber: string | null
          address: string | null
          companyName: string | null
        }
      }
      room: { type: { name: string }; roomNumber: string }
    } & {
      id: number
      bookingId: number
      roomId: number
      stayedById: number | null
      checkIn: Date
      checkOut: Date
      bookedPrice: Decimal
      tax: Decimal | null
      stayed: number | null
      adults: number | null
      children: number | null
      extraBeds: number
      extraBedPrice: Decimal | null
      isAc: boolean
      isCheckedOut: boolean
      status: boolean
    })[] = []
    if (format(requestedDateOnly, 'yyyy-MM-dd') === format(todayDateOnly, 'yyyy-MM-dd')) {
      checkedOutToday = await prisma.bookingRoom.findMany({
        where: {
          status: true,
          isCheckedOut: true,
          booking: {
            bookingstatus: 1,
            status: true
          }
          // Check if checkout happened today (you might want to add a checkedOutAt timestamp)
        },
        include: {
          booking: {
            select: {
              bookingref: true,
              customer: {
                select: {
                  name: true,
                  phoneNumber: true,
                  idNumber: true,
                  address: true,
                  companyName: true
                }
              }
            }
          },
          room: {
            select: {
              roomNumber: true,
              type: { select: { name: true } }
            }
          }
        }
      })
    }

    // Initialize result arrays
    const todayCheckin = []
    const checkout = []
    const overstay = []
    const staying = []

    // Track unique booking references to avoid duplicates
    const processedBookings = new Map()
    let bookedRoomsCount = 0
    const occupiedRoomIds = new Set()

    // Process each booking room
    for (const bookingRoom of activeBookingRooms) {
      // Convert times to IST
      const checkInUTC = new Date(bookingRoom.checkIn)
      const checkOutUTC = new Date(bookingRoom.checkOut)

      const checkInIST = toZonedTime(checkInUTC, TIMEZONE)
      const checkOutIST = toZonedTime(checkOutUTC, TIMEZONE)

      const checkInDate = startOfDay(checkInIST)
      const checkOutDate = startOfDay(checkOutIST)

      console.log(`Processing Room ${bookingRoom.room.roomNumber} (${bookingRoom.booking.bookingref}):`)
      console.log(`  CheckIn: ${format(checkInDate, 'yyyy-MM-dd')}`)
      console.log(`  CheckOut: ${format(checkOutDate, 'yyyy-MM-dd')}`)

      const bookingRef = bookingRoom.booking.bookingref
      const isCheckingInToday = format(checkInDate, 'yyyy-MM-dd') === format(requestedDateOnly, 'yyyy-MM-dd')
      const isScheduledCheckOutToday = format(checkOutDate, 'yyyy-MM-dd') === format(requestedDateOnly, 'yyyy-MM-dd')
      const isOverstaying = checkOutDate < todayDateOnly && requestedDateOnly <= todayDateOnly

      // Determine if room is occupied on requested date
      let effectiveEndDate = checkOutDate
      if (!bookingRoom.isCheckedOut && checkOutDate <= todayDateOnly) {
        effectiveEndDate = todayDateOnly // Extend for overstay
      }

      const isOccupiedOnDate = checkInDate <= requestedDateOnly && effectiveEndDate >= requestedDateOnly

      if (isOccupiedOnDate) {
        bookedRoomsCount++
        occupiedRoomIds.add(bookingRoom.room.id)
      }

      // Categorize bookings
      if (isCheckingInToday) {
        if (!processedBookings.has(`checkin_${bookingRef}`)) {
          todayCheckin.push({
            ...bookingRoom.booking,
            bookedRooms: activeBookingRooms.filter(br => br.booking.bookingref === bookingRef)
          })
          processedBookings.set(`checkin_${bookingRef}`, true)
          console.log(`  Added to check-in list`)
        }
      }

      if (isOverstaying && requestedDateOnly <= todayDateOnly) {
        if (!processedBookings.has(`overstay_${bookingRef}`)) {
          overstay.push({
            ...bookingRoom.booking,
            bookedRooms: activeBookingRooms.filter(br => br.booking.bookingref === bookingRef)
          })
          processedBookings.set(`overstay_${bookingRef}`, true)
          console.log(`  Added to overstay list`)
        }
      } else if (isOccupiedOnDate && !isCheckingInToday) {
        // Only add to staying if not already in check-in or overstay
        if (
          !processedBookings.has(`staying_${bookingRef}`) &&
          !processedBookings.has(`checkin_${bookingRef}`) &&
          !processedBookings.has(`overstay_${bookingRef}`)
        ) {
          staying.push({
            ...bookingRoom.booking,
            bookedRooms: activeBookingRooms.filter(br => br.booking.bookingref === bookingRef)
          })
          processedBookings.set(`staying_${bookingRef}`, true)
          console.log(`  Added to staying list`)
        }
      }
    }

    // Process checkout for today only
    if (format(requestedDateOnly, 'yyyy-MM-dd') === format(todayDateOnly, 'yyyy-MM-dd')) {
      const checkoutRefs = new Set()
      for (const room of checkedOutToday) {
        if (!checkoutRefs.has(room.booking.bookingref)) {
          checkout.push({
            ...room.booking,
            bookedRooms: [room]
          })
          checkoutRefs.add(room.booking.bookingref)
        }
      }
    }
    const requestedRoomIds = new Set(requestedBookings.flatMap(booking => booking.bookedRooms.map(br => br.roomId)))

    // Calculate available rooms
    const availableRooms = allRooms.filter(room => !occupiedRoomIds.has(room.id) && !requestedRoomIds.has(room.id))

    return NextResponse.json({
      date: format(requestedDateOnly, 'yyyy-MM-dd'),
      totalRooms,
      booked: bookedRoomsCount,
      available: availableRooms.length,
      availableRooms,
      todayCheckin,
      checkout,
      overstay,
      staying,
      pendingRequests: requestedBookings,
      stats: {
        todayCheckin: todayCheckin.length,
        overstay: overstay.length,
        checkout: checkout.length,
        staying: staying.length,
        requested: requestedBookings.length,
        available: availableRooms.length
      }
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error.message
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
