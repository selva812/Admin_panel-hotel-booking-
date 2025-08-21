// app/api/reports/revenue/route.ts
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
    const groupBy = searchParams.get('groupBy') || 'day'
    const customerId = searchParams.get('customerId')
    const roomId = searchParams.get('roomId')
    const bookedById = searchParams.get('bookedById')

    console.log('Revenue report filters:', { startDate, endDate, groupBy, customerId, roomId, bookedById })

    const whereClause: any = {}

    // Date filter
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Build booking filters to get relevant payment IDs
    const bookingWhere: any = {}

    if (customerId) {
      bookingWhere.customerId = parseInt(customerId)
    }

    if (bookedById) {
      bookingWhere.bookedById = parseInt(bookedById)
    }

    if (roomId) {
      bookingWhere.bookedRooms = {
        some: {
          roomId: parseInt(roomId)
        }
      }
    }

    // If we have booking-related filters, we need to filter payments by bookings
    if (customerId || roomId || bookedById) {
      // First get the relevant bookings
      const relevantBookings = await prisma.booking.findMany({
        where: {
          ...bookingWhere,
          // Also apply date filter to bookings if provided
          ...(startDate &&
            endDate && {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            })
        },
        select: { id: true }
      })

      const bookingIds = relevantBookings.map(b => b.id)

      // If no matching bookings, return empty results
      if (bookingIds.length === 0) {
        return NextResponse.json({
          revenueData: [],
          summary: {
            totalRevenue: 0,
            totalPayments: 0,
            averagePayment: 0,
            paymentMethods: {
              cash: 0,
              card: 0,
              online: 0
            }
          },
          filters: {
            startDate,
            endDate,
            groupBy,
            customerId: customerId ? parseInt(customerId) : null,
            roomId: roomId ? parseInt(roomId) : null,
            bookedById: bookedById ? parseInt(bookedById) : null
          }
        })
      }

      // Filter payments by booking IDs
      whereClause.bookingId = {
        in: bookingIds
      }
    }

    // Get payments data with enhanced booking information
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true, phoneNumber: true } },
            bookedBy: { select: { id: true, name: true } },
            bookingType: { select: { name: true } },
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
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Enhanced payments data
    const enhancedPayments = payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      method: payment.method,
      date: payment.date,
      isAdvance: payment.isadvance,
      transactionId: payment.transactionid,
      note: payment.note,
      bookingInfo: {
        bookingId: payment.booking.id,
        bookingRef: payment.booking.bookingref,
        customerId: payment.booking.customer.id,
        customerName: payment.booking.customer.name,
        customerPhone: payment.booking.customer.phoneNumber,
        bookedById: payment.booking.bookedById,
        bookedByName: payment.booking.bookedBy?.name || 'N/A',
        bookingType: payment.booking.bookingType?.name || 'N/A',
        bookingDate: payment.booking.date,
        rooms: payment.booking.bookedRooms.map(br => ({
          roomId: br.room.id,
          roomNumber: br.room.roomNumber,
          roomType: br.room.type?.name || 'N/A'
        }))
      }
    }))

    // Group data based on groupBy parameter
    const groupedData = payments.reduce((acc: any, payment) => {
      let key: string
      const date = new Date(payment.date)

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default: // day
          key = date.toISOString().split('T')[0]
      }

      if (!acc[key]) {
        acc[key] = {
          period: key,
          totalRevenue: 0,
          totalPayments: 0,
          cashPayments: 0,
          cardPayments: 0,
          onlinePayments: 0,
          advancePayments: 0,
          regularPayments: 0,
          customers: new Set(),
          bookings: new Set(),
          rooms: new Set()
        }
      }

      const amount = Number(payment.amount)
      acc[key].totalRevenue += amount
      acc[key].totalPayments += 1
      acc[key].customers.add(payment.booking.customerId)
      acc[key].bookings.add(payment.booking.id)

      // Add rooms
      payment.booking.bookedRooms.forEach(br => {
        acc[key].rooms.add(br.room.id)
      })

      // Payment method breakdown
      switch (payment.method) {
        case 0:
          acc[key].cashPayments += amount
          break
        case 1:
          acc[key].cardPayments += amount
          break
        case 2:
          acc[key].onlinePayments += amount
          break
      }

      // Advance vs regular payments
      if (payment.isadvance) {
        acc[key].advancePayments += amount
      } else {
        acc[key].regularPayments += amount
      }

      return acc
    }, {})

    // Convert grouped data and calculate final metrics
    const revenueData = Object.values(groupedData).map((period: any) => ({
      period: period.period,
      totalRevenue: period.totalRevenue,
      totalPayments: period.totalPayments,
      cashPayments: period.cashPayments,
      cardPayments: period.cardPayments,
      onlinePayments: period.onlinePayments,
      advancePayments: period.advancePayments,
      regularPayments: period.regularPayments,
      uniqueCustomers: period.customers.size,
      uniqueBookings: period.bookings.size,
      uniqueRooms: period.rooms.size,
      averagePayment: period.totalPayments > 0 ? period.totalRevenue / period.totalPayments : 0
    }))

    const summary = {
      totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      totalPayments: payments.length,
      averagePayment:
        payments.length > 0 ? payments.reduce((sum, payment) => sum + Number(payment.amount), 0) / payments.length : 0,
      paymentMethods: {
        cash: payments.filter(p => p.method === 0).reduce((sum, p) => sum + Number(p.amount), 0),
        card: payments.filter(p => p.method === 1).reduce((sum, p) => sum + Number(p.amount), 0),
        online: payments.filter(p => p.method === 2).reduce((sum, p) => sum + Number(p.amount), 0)
      }
    }

    return NextResponse.json({
      revenueData,
      summary
    })
  } catch (error) {
    console.error('Error fetching revenue reports:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue reports' }, { status: 500 })
  }
}
