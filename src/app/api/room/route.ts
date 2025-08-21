import { NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})

export async function GET() {
  try {
    const now = new Date()

    // Fetch only active rooms
    const rooms = await prisma.room.findMany({
      where: {
        status: true
      },
      include: {
        type: true,
        floor: true
      }
    })
    const relevantBookingRooms = await prisma.bookingRoom.findMany({
      where: {
        OR: [
          {
            checkIn: { gt: now }
          },
          {
            AND: [{ checkIn: { lte: now } }, { isCheckedOut: false }]
          }
        ],
        room: { status: true }
      },
      include: {
        booking: {
          include: { customer: true }
        },
        room: true
      },
      orderBy: { checkIn: 'asc' }
    })

    // Group by roomId
    const bookingsByRoom = relevantBookingRooms.reduce(
      (acc, bookingRoom) => {
        const roomId = bookingRoom.roomId
        if (!acc[roomId]) acc[roomId] = []
        acc[roomId].push(bookingRoom)
        return acc
      },
      {} as Record<number, typeof relevantBookingRooms>
    )

    const formattedRooms = await Promise.all(
      rooms.map(async room => {
        const roomBookings = bookingsByRoom[room.id] || []

        let actualStatus = 0
        let nextAvailableDate: Date | null = now
        let currentBooking = null
        const occupiedBooking = roomBookings.find(br => br.checkIn <= now && br.isCheckedOut === false)

        if (occupiedBooking) {
          actualStatus = 1
          currentBooking = occupiedBooking
          if (occupiedBooking.checkOut > now) {
            nextAvailableDate = occupiedBooking.checkOut
          } else {
            nextAvailableDate = null
          }
        } else {
          const futureBookings = roomBookings.filter(br => br.checkIn > now)
          if (futureBookings.length > 0) {
            nextAvailableDate = futureBookings[futureBookings.length - 1].checkOut
          }
        }

        // Update DB if status mismatch
        if (room.roomStatus !== actualStatus) {
          await prisma.room.update({
            where: { id: room.id },
            data: { roomStatus: actualStatus }
          })
        }

        return {
          ...room,
          roomName: room.type.name,
          floorName: room.floor.name,
          currentCustomerName: currentBooking?.booking.customer.name || null,
          price: Number(room.isAc ? room.acPrice : room.nonAcPrice).toFixed(2),
          actualStatus,
          nextAvailableDate,
          isExtendedStay: currentBooking && currentBooking.checkOut < now ? true : false,
          upcomingBookings: roomBookings.map(br => {
            const isCurrentlyOccupying = br.checkIn <= now && br.isCheckedOut === false
            const isExtended = br.checkOut < now && br.isCheckedOut === false

            return {
              id: br.booking.id,
              checkIn: br.checkIn,
              checkOut: br.checkOut,
              customerName: br.booking.customer.name,
              adults: br.adults,
              children: br.children,
              isCheckedOut: br.isCheckedOut,
              isCurrentlyOccupying,
              isExtended,
              status: isCurrentlyOccupying ? (isExtended ? 'extended' : 'current') : 'future'
            }
          })
        }
      })
    )

    return NextResponse.json(formattedRooms, { status: 200 })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      {
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
// ✅ POST - Create new room
export async function POST(request: Request) {
  try {
    const roomData = await request.json()

    if (!roomData || typeof roomData !== 'object' || Array.isArray(roomData)) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const requiredFields = [
      'roomNumber',
      'typeId',
      'floorId',
      'acPrice',
      'nonAcPrice',
      'online_acPrice',
      'online_nonAcPrice'
    ]
    const missing = requiredFields.filter(field => !(field in roomData))
    if (missing.length > 0) {
      return NextResponse.json({ message: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
    }

    const newRoom = await prisma.room.create({
      data: {
        roomNumber: roomData.roomNumber,
        typeId: Number(roomData.typeId),
        floorId: Number(roomData.floorId),
        acPrice: new Prisma.Decimal(roomData.acPrice),
        nonAcPrice: new Prisma.Decimal(roomData.nonAcPrice),
        isAc: roomData.isAc === true,
        occupancy: roomData.occupancy || 2,
        online_acPrice: roomData.online_acPrice,
        online_nonAcPrice: roomData.online_nonAcPrice,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ data: newRoom }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { message: 'Failed to create room', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ✅ PUT - Update existing room
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = parseInt(searchParams.get('id') || '0')
    if (isNaN(roomId) || roomId <= 0) {
      return NextResponse.json({ message: 'Invalid room ID' }, { status: 400 })
    }

    const roomData = await request.json()
    console.log('roomData', roomData)

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        roomNumber: roomData.roomNumber,
        typeId: Number(roomData.typeId),
        floorId: Number(roomData.floorId),
        acPrice: new Prisma.Decimal(roomData.acPrice),
        nonAcPrice: new Prisma.Decimal(roomData.nonAcPrice),
        online_acPrice: roomData.online_acPrice,
        online_nonAcPrice: roomData.online_nonAcPrice,
        isAc: roomData.isAc === true,
        occupancy: roomData.occupancy || 2,
        roomStatus: roomData.status || 0
      }
    })

    return NextResponse.json(updatedRoom, { status: 200 })
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { message: 'Failed to update room', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ✅ DELETE - Delete room by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = parseInt(searchParams.get('id') || '0')

    if (isNaN(roomId)) {
      return NextResponse.json({ message: 'Invalid room ID' }, { status: 400 })
    }

    // Check if room exists first
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!existingRoom) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 })
    }

    // Soft delete by updating status to false
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { status: false }
    })

    return NextResponse.json(
      {
        message: 'Room deactivated successfully',
        room: updatedRoom
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deactivating room:', error)
    return NextResponse.json(
      {
        message: 'Failed to deactivate room',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
