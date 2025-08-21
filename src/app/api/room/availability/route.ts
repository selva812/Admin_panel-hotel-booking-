import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')
    const now = new Date()

    if (roomId) {
      // Single room detailed view
      const room = await prisma.room.findUnique({
        where: {
          id: Number(roomId)
        },
        include: {
          type: true,
          floor: true
        }
      })

      if (!room) {
        return NextResponse.json({ message: 'Room not found' }, { status: 404 })
      }

      // Find current and future bookings for this room
      const futureBookings = await prisma.bookingRoom.findMany({
        where: {
          roomId: Number(roomId),
          checkOut: {
            gte: now
          }
        },
        include: {
          booking: {
            include: {
              customer: true
            }
          }
        },
        orderBy: {
          checkIn: 'asc'
        }
      })

      const getTimeOnly = (date: Date) =>
        new Date(date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

      // Build availability periods
      let availabilityPeriods = []
      let lastDate = now

      for (const bookingRoom of futureBookings) {
        if (bookingRoom.checkIn > lastDate) {
          availabilityPeriods.push({
            from: lastDate,
            to: bookingRoom.checkIn,
            status: 'AVAILABLE'
          })
        }

        availabilityPeriods.push({
          from: bookingRoom.checkIn,
          to: bookingRoom.checkOut,
          status: 'BOOKED',
          bookingDetails: {
            id: bookingRoom.booking.id,
            customerName: bookingRoom.booking.customer.name,
            adults: bookingRoom.adults,
            children: bookingRoom.children,
            checkInTime: getTimeOnly(bookingRoom.checkIn),
            checkOutTime: getTimeOnly(bookingRoom.checkOut)
          }
        })

        lastDate = bookingRoom.checkOut
      }

      // Find current customer (if room is occupied)
      const currentBooking = futureBookings.find(br => now >= br.checkIn && now < br.checkOut)

      const currentCustomerName = currentBooking?.booking.customer.name || null

      const formattedRoom = {
        ...room,
        roomName: room.type.name,
        floorName: room.floor.name,
        currentCustomerName,
        price: room.isAc ? Number(room.acPrice).toFixed(2) : Number(room.nonAcPrice).toFixed(2),
        amenities: [],
        availability: {
          periods: availabilityPeriods,
          futureBookings: futureBookings.map(bookingRoom => ({
            id: bookingRoom.booking.id,
            checkInDate: bookingRoom.checkIn,
            checkInTime: getTimeOnly(bookingRoom.checkIn),
            checkOutDate: bookingRoom.checkOut,
            checkOutTime: getTimeOnly(bookingRoom.checkOut),
            customerName: bookingRoom.booking.customer.name,
            adults: bookingRoom.adults,
            children: bookingRoom.children
          }))
        }
      }

      return NextResponse.json(formattedRoom, { status: 200 })
    } else {
      // If no roomId provided, return availability for all rooms
      const rooms = await prisma.room.findMany({
        include: {
          type: true,
          floor: true
        }
      })

      // Get all future bookings
      const bookingRooms = await prisma.bookingRoom.findMany({
        where: {
          checkOut: {
            gte: now
          }
        },
        include: {
          booking: {
            include: {
              customer: true
            }
          },
          room: true
        },
        orderBy: {
          checkIn: 'asc'
        }
      })

      // Group bookings by room
      const bookingsByRoom = bookingRooms.reduce(
        (acc, bookingRoom) => {
          if (!acc[bookingRoom.roomId]) acc[bookingRoom.roomId] = []
          acc[bookingRoom.roomId].push({
            id: bookingRoom.booking.id,
            roomId: bookingRoom.roomId,
            checkIn: bookingRoom.checkIn,
            checkOut: bookingRoom.checkOut,
            adults: bookingRoom.adults,
            children: bookingRoom.children,
            customer: bookingRoom.booking.customer
          })
          return acc
        },
        {} as Record<number, Array<any>>
      )

      const formattedRooms = rooms.map(room => {
        const roomBookings = bookingsByRoom[room.id] || []
        const isBookedNow = roomBookings.some(b => now >= b.checkIn && now < b.checkOut)
        const nextAvailableDate = roomBookings.find(b => now < b.checkOut)?.checkOut ?? now

        // Find current customer for the room
        const currentBooking = roomBookings.find(b => now >= b.checkIn && now < b.checkOut)
        const currentCustomer = currentBooking?.customer.name || null

        return {
          id: room.id,
          roomNumber: room.roomNumber,
          type: room.type.name,
          floor: room.floor.name,
          price: room.isAc ? Number(room.acPrice).toFixed(2) : Number(room.nonAcPrice).toFixed(2),
          maxOccupancy: room.occupancy,
          currentCustomer,
          checkInDate: currentBooking?.checkIn || null,
          checkOutDate: currentBooking?.checkOut || null,
          availabilityStatus: isBookedNow ? 'BOOKED' : 'AVAILABLE',
          nextAvailableDate,
          upcomingBookings: roomBookings.map(booking => ({
            id: booking.id,
            checkInDate: booking.checkIn,
            checkOutDate: booking.checkOut,
            customerName: booking.customer.name,
            adults: booking.adults,
            children: booking.children
          }))
        }
      })

      return NextResponse.json(
        {
          totalRooms: rooms.length,
          availableNow: formattedRooms.filter(r => r.availabilityStatus === 'AVAILABLE').length,
          occupiedNow: formattedRooms.filter(r => r.availabilityStatus === 'BOOKED').length,
          rooms: formattedRooms
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error fetching room availability:', error)
    return NextResponse.json(
      { message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
