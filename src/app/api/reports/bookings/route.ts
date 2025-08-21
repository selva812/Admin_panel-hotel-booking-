// app/api/reports/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')
    const roomId = searchParams.get('roomId')
    const bookedById = searchParams.get('bookedById')

    console.log('Bookings report filters:', { startDate, endDate, customerId, roomId, bookedById })

    const whereClause: any = {}

    // Date filter
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Customer filter
    if (customerId) {
      whereClause.customerId = parseInt(customerId)
    }

    // Booked by filter
    if (bookedById) {
      whereClause.bookedById = parseInt(bookedById)
    }

    // Room filter (through bookedRooms relation)
    if (roomId) {
      whereClause.bookedRooms = {
        some: {
          roomId: parseInt(roomId)
        }
      }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, phoneNumber: true } },
        bookedBy: { select: { id: true, name: true } },
        bill: { select: { totalAmount: true } },
        bookedRooms: {
          select: {
            room: {
              select: {
                id: true,
                roomNumber: true,
                type: { select: { name: true } }
              }
            }
          }
        },
        payments: {
          where: { status: true },
          select: { amount: true, date: true, isadvance: true, method: true }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    const result = bookings.map(booking => {
      const paidAmount = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const paymentDates = booking.payments.map(p => p.date)

      return {
        bookingId: booking.id,
        bookingRef: booking.bookingref,
        customerId: booking.customer.id,
        customerName: booking.customer.name,
        customerPhone: booking.customer.phoneNumber,
        bookedById: booking.bookedById,
        bookedByName: booking.bookedBy?.name || 'N/A',
        bookingDate: booking.date,
        roomNumbers: booking.bookedRooms.map(r => r.room.roomNumber),
        roomIds: booking.bookedRooms.map(r => r.room.id),
        roomTypes: booking.bookedRooms.map(r => r.room.type?.name || 'N/A'),
        totalAmount: booking.bill?.totalAmount ? Number(booking.bill.totalAmount) : null,
        paidAmount,
        paymentDates,
        paymentMethods: booking.payments.map(p => ({
          method: p.method,
          amount: Number(p.amount),
          isAdvance: p.isadvance
        }))
      }
    })

    // Calculate summary statistics
    const summary = {
      totalBookings: bookings.length,
      totalRevenue: 0,
      totalPaidAmount: 0,
      totalDueAmount: 0,
      totalRooms: 0,
      averageBookingValue: 0,
      totalAdvancePayments: 0,
      paymentMethods: {
        cash: 0,
        card: 0,
        online: 0
      }
    }

    for (const booking of bookings) {
      const paidAmount = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalAmount = booking.bill?.totalAmount ? Number(booking.bill.totalAmount) : null

      summary.totalRooms += booking.rooms
      summary.totalPaidAmount += paidAmount
      summary.totalRevenue += paidAmount

      if (totalAmount !== null) {
        summary.totalDueAmount += Math.max(totalAmount - paidAmount, 0)
      }

      // Calculate payment method totals
      booking.payments.forEach(payment => {
        switch (payment.method) {
          case 0:
            summary.paymentMethods.cash += Number(payment.amount)
            break
          case 1:
            summary.paymentMethods.card += Number(payment.amount)
            break
          case 2:
            summary.paymentMethods.online += Number(payment.amount)
            break
        }
      })
    }

    summary.totalAdvancePayments = bookings.reduce(
      (sum, booking) => sum + booking.payments.filter(p => p.isadvance).reduce((s, p) => s + Number(p.amount), 0),
      0
    )

    summary.averageBookingValue = bookings.length > 0 ? summary.totalRevenue / bookings.length : 0

    return NextResponse.json({
      bookings: result,
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
    console.error('Error fetching booking reports:', error)
    return NextResponse.json({ error: 'Failed to fetch booking reports' }, { status: 500 })
  }
}
