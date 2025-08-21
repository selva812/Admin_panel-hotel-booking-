// app/api/reports/occupancy/route.ts
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
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')
    const roomId = searchParams.get('roomId')
    const bookedById = searchParams.get('bookedById')

    console.log('Occupancy report filters:', { startDate, endDate, customerId, roomId, bookedById })

    const whereClause: any = {}

    // Date filter
    if (startDate && endDate) {
      whereClause.checkIn = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Room filter
    if (roomId) {
      whereClause.roomId = parseInt(roomId)
    }

    // Customer and bookedBy filters need to be applied through booking relation
    const bookingWhere: any = {}

    if (customerId) {
      bookingWhere.customerId = parseInt(customerId)
    }

    if (bookedById) {
      bookingWhere.bookedById = parseInt(bookedById)
    }

    // If we have booking-related filters, add them to the where clause
    if (customerId || bookedById) {
      whereClause.booking = bookingWhere
    }

    const bookingRooms = await prisma.bookingRoom.findMany({
      where: whereClause,
      include: {
        room: {
          include: {
            type: { select: { name: true } },
            floor: { select: { name: true } }
          }
        },
        booking: {
          include: {
            customer: { select: { id: true, name: true, phoneNumber: true } },
            bookedBy: { select: { id: true, name: true } },
            bookingType: { select: { name: true } }
          }
        }
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    // Enhanced booking rooms data
    const enhancedBookingRooms = bookingRooms.map(br => ({
      id: br.id,
      roomId: br.room.id,
      roomNumber: br.room.roomNumber,
      roomType: br.room.type?.name || 'N/A',
      floor: br.room.floor?.name || 'N/A',
      checkIn: br.checkIn,
      checkOut: br.checkOut,
      bookedPrice: Number(br.bookedPrice),
      adults: br.adults,
      children: br.children,
      extraBeds: br.extraBeds,
      isAc: br.isAc,
      bookingInfo: {
        bookingId: br.booking.id,
        bookingRef: br.booking.bookingref,
        customerId: br.booking.customer.id,
        customerName: br.booking.customer.name,
        customerPhone: br.booking.customer.phoneNumber,
        bookedById: br.booking.bookedById,
        bookedByName: br.booking.bookedBy?.name || 'N/A',
        bookingType: br.booking.bookingType?.name || 'N/A',
        bookingDate: br.booking.date
      }
    }))

    // Get total available rooms for occupancy calculation
    const totalRoomsWhere: any = {}
    if (roomId) {
      totalRoomsWhere.id = parseInt(roomId)
    }

    const totalRooms = await prisma.room.count({
      where: totalRoomsWhere
    })

    // Calculate occupancy metrics by date
    const occupancyData = bookingRooms.reduce((acc: any, bookingRoom) => {
      const checkInDate = new Date(bookingRoom.checkIn).toISOString().split('T')[0]
      const checkOutDate = new Date(bookingRoom.checkOut).toISOString().split('T')[0]

      // Create entries for each day the room is occupied
      const startDate = new Date(bookingRoom.checkIn)
      const endDate = new Date(bookingRoom.checkOut)

      for (
        let currentDate = new Date(startDate);
        currentDate < endDate;
        currentDate.setDate(currentDate.getDate() + 1)
      ) {
        const dateKey = currentDate.toISOString().split('T')[0]

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            occupiedRooms: new Set(),
            totalRooms,
            occupancyRate: 0,
            revenue: 0,
            bookings: []
          }
        }

        acc[dateKey].occupiedRooms.add(bookingRoom.room.id)
        acc[dateKey].revenue +=
          Number(bookingRoom.bookedPrice) / Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        acc[dateKey].bookings.push({
          bookingId: bookingRoom.booking.id,
          roomNumber: bookingRoom.room.roomNumber,
          customerName: bookingRoom.booking.customer.name
        })
      }

      return acc
    }, {})

    // Convert occupancy data and calculate rates
    const occupancyReport = Object.values(occupancyData).map((day: any) => ({
      date: day.date,
      occupiedRooms: day.occupiedRooms.size,
      totalRooms: day.totalRooms,
      occupancyRate: (day.occupiedRooms.size / day.totalRooms) * 100,
      revenue: day.revenue,
      bookings: day.bookings
    }))

    // Calculate summary statistics
    const summary = {
      averageOccupancyRate:
        occupancyReport.length > 0
          ? occupancyReport.reduce((sum: number, day: any) => sum + day.occupancyRate, 0) / occupancyReport.length
          : 0,
      totalRoomsBooked: bookingRooms.length,
      totalRevenue: bookingRooms.reduce((sum, room) => sum + Number(room.bookedPrice), 0),
      averageRoomRate:
        bookingRooms.length > 0
          ? bookingRooms.reduce((sum, room) => sum + Number(room.bookedPrice), 0) / bookingRooms.length
          : 0,
      uniqueCustomers: new Set(bookingRooms.map(br => br.booking.customerId)).size,
      totalRoomsAvailable: totalRooms,
      roomTypeBreakdown: bookingRooms.reduce((acc: any, br) => {
        const roomType = br.room.type?.name || 'N/A'
        if (!acc[roomType]) {
          acc[roomType] = {
            count: 0,
            revenue: 0
          }
        }
        acc[roomType].count += 1
        acc[roomType].revenue += Number(br.bookedPrice)
        return acc
      }, {})
    }

    return NextResponse.json({
      occupancyData: occupancyReport,
      bookingRooms: enhancedBookingRooms,
      summary,
      filters: {
        startDate,
        endDate,
        customerId: customerId ? parseInt(customerId) : null,
        roomId: roomId ? parseInt(roomId) : null,
        bookedById: bookedById ? parseInt(bookedById) : null
      }
    })
  } catch (error) {
    console.error('Error fetching occupancy reports:', error)
    return NextResponse.json({ error: 'Failed to fetch occupancy reports' }, { status: 500 })
  }
}
