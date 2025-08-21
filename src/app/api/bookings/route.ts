// /api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})

const JWT_SECRET = process.env.JWT_SECRET as string

function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, JWT_SECRET) as { id: number; role: string }
}

// GET single booking with all relations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id') || 1)

    const booking = await prisma.booking.findUnique({
      where: { id: id },
      include: {
        customer: true,
        user: true,
        bookedBy: true,
        bookingType: true,
        purposeOfVisit: true,
        bookingReference: true,
        bookedRooms: {
          include: {
            room: true,
            stayedBy: true,
            occupancies: true
          }
        },
        services: true,
        payments: true,
        bill: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch booking', details: error.message }, { status: 500 })
  }
}

// GET all available rooms for room selection
export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    const { checkIn, checkOut } = await req.json()
    console.log(checkIn)
    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in date is required' }, { status: 400 })
    }

    // Calculate checkout date (checkIn + 1 day if not provided)

    const checkInDate = new Date(checkIn)
    const nextDay = new Date(checkInDate)

    nextDay.setDate(nextDay.getDate() + 1)
    const checkOutDate = checkOut ? new Date(checkOut) : new Date(checkInDate)
    checkOutDate.setDate(checkOutDate.getDate() + 1)

    // Get all rooms that are marked as available (status = 0)
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        roomNumber: true,
        occupancy: true,
        acPrice: true,
        nonAcPrice: true,
        type: {
          select: {
            name: true
          }
        },
        floor: {
          select: {
            name: true
          }
        },
        bookingRooms: {
          select: {
            id: true,
            extraBeds: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true,
            booking: {
              select: {
                id: true,
                bookingstatus: true,
                bookingref: true,
                customer: true
              }
            }
          },
          where: {
            OR: [
              // Active booking that overlaps with the requested date
              {
                checkIn: { lt: nextDay },
                checkOut: { gt: checkInDate },
                booking: {
                  bookingstatus: 1
                },
                isCheckedOut: false
              },
              // Or any booking that hasn't checked out yet
              {
                isCheckedOut: false,
                booking: {
                  bookingstatus: 1
                }
              }
            ]
          }
        }
      }
    })

    // Filter out rooms with active bookings during the requested period
    const trulyAvailableRooms = rooms.filter(room => room.bookingRooms.length === 0)

    // Format response
    const response = {
      dateRange: {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        durationDays: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      },
      availableRooms: trulyAvailableRooms,
      allRooms: rooms.map(room => ({
        ...room,
        isAvailable: room.bookingRooms.length === 0,
        conflictingBookings: room.bookingRooms.map(booking => ({
          id: booking.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          bookingRef: booking.booking.bookingref,
          customerName: booking.booking.customer.name
        }))
      }))
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process request', details: error.message }, { status: 500 })
  }
}
// UPDATE booking and related rooms with complete room change functionality
export async function PUT(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    const {
      bookingTypeId,
      purposeOfVisitId,
      bookingstatus,
      date,
      arriveFrom,
      isadvance,
      rooms,
      bookedRooms,
      id,
      roomChanges // New field for room changes
    } = await request.json()

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async tx => {
      // First update the booking
      const updatedBooking = await tx.booking.update({
        where: { id: parseInt(id) },
        data: {
          bookingTypeId,
          purposeOfVisitId,
          bookingstatus,
          date: new Date(date),
          arriveFrom,
          isadvance,
          rooms
        }
      })

      // Handle room changes if provided
      if (roomChanges && roomChanges.length > 0) {
        for (const roomChange of roomChanges) {
          const { bookingRoomId, oldRoomId, newRoomId, newBookedPrice } = roomChange

          // Update the old room status to available (0)
          if (oldRoomId) {
            await tx.room.update({
              where: { id: oldRoomId },
              data: {
                roomStatus: 0,
                lastUpdatedById: user.id,
                updatedAt: new Date()
              }
            })
          }

          // Update the new room status to occupied (1)
          if (newRoomId) {
            await tx.room.update({
              where: { id: newRoomId },
              data: {
                roomStatus: 1,
                lastUpdatedById: user.id,
                updatedAt: new Date()
              }
            })
          }

          // Update the booking room with new room details
          await tx.bookingRoom.update({
            where: { id: bookingRoomId },
            data: {
              roomId: newRoomId,
              bookedPrice: newBookedPrice || 0
            }
          })
        }
      }

      // Update all the booked rooms with other details
      const updatedRooms = await Promise.all(
        bookedRooms.map(async (room: any) => {
          return await tx.bookingRoom.update({
            where: { id: room.id },
            data: {
              checkIn: new Date(room.checkIn),
              checkOut: new Date(room.checkOut),
              adults: parseInt(room.adults),
              children: parseInt(room.children),
              extraBeds: parseInt(room.extraBeds),
              isAc: room.isAc,
              // Update booked price based on AC/Non-AC selection
              bookedPrice:
                room.bookedPrice || room.isAc
                  ? (await tx.room.findUnique({ where: { id: room.roomId } }))?.acPrice || 0
                  : (await tx.room.findUnique({ where: { id: room.roomId } }))?.nonAcPrice || 0
            }
          })
        })
      )

      return {
        booking: updatedBooking,
        rooms: updatedRooms
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      {
        error: 'Failed to update booking',
        details: error.message
      },
      { status: 500 }
    )
  }
}
