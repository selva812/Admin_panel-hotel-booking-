// app/api/customers/[id]/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient({})
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ message: 'Customer ID is required' }, { status: 400 })
    }
    const customerId = Number(id)
    if (isNaN(customerId)) {
      return NextResponse.json({ message: 'Invalid customer ID' }, { status: 400 })
    }
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        bookings: {
          where: {
            bookingstatus: 1
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(customer, { status: 200 })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const customerId = parseInt(searchParams.get('id') || '1')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const skip = (page - 1) * pageSize

  if (isNaN(customerId)) {
    return NextResponse.json({ message: 'Invalid customer ID' }, { status: 400 })
  }

  try {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { customerId },
        include: {
          bookedBy: {
            select: { id: true, name: true }
          },
          purposeOfVisit: {
            select: { id: true, name: true }
          },
          services: true,
          bill: {
            include: {
              payments: true
            }
          },
          bookedRooms: {
            include: {
              room: {
                include: {
                  type: true
                }
              }
            }
          },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.booking.count({ where: { customerId } })
    ])

    const transformedBookings = bookings.map(booking => {
      // Handle dates differently based on booking status
      let earliestCheckIn: Date | null = null
      let latestCheckOut: Date | null = null
      let nights = 0
      let roomChargesTotal = 0
      let extraBedChargesTotal = 0
      let taxTotal = 0
      const roomDetails: {
        roomNumber: string
        price: number
        tax: number
        extraBeds: number
        extraBedPrice: number
        total: number
        isAc: boolean
        roomType: string
        adults: number
        children: number
        maxoccupancy: number
        occupancySummary: string
        checkIn: Date
        checkOut: Date
      }[] = []

      // Only calculate dates and room details if booking is confirmed and has rooms
      if ([0, 1].includes(booking.bookingstatus) && booking.bookedRooms.length > 0) {
        const checkIns = booking.bookedRooms.map(r => new Date(r.checkIn).getTime())
        const checkOuts = booking.bookedRooms.map(r => new Date(r.checkOut).getTime())
        earliestCheckIn = new Date(Math.min(...checkIns))
        latestCheckOut = new Date(Math.max(...checkOuts))
        nights = Math.ceil((latestCheckOut.getTime() - earliestCheckIn.getTime()) / (1000 * 3600 * 24))

        // Calculate room charges only for confirmed bookings with rooms
        booking.bookedRooms.forEach(room => {
          const roomPrice = parseFloat(room.bookedPrice.toString())
          const roomTax = parseFloat(room.tax?.toString() || '0')
          const roomTotal = roomPrice * nights

          const extraBedPrice = room.extraBedPrice ? parseFloat(room.extraBedPrice.toString()) : 0
          const roomExtraBeds = room.extraBeds || 0
          const roomExtraBedCharges = roomExtraBeds * extraBedPrice

          roomChargesTotal += roomTotal
          extraBedChargesTotal += roomExtraBedCharges
          taxTotal += roomTax

          roomDetails.push({
            roomNumber: room.room.roomNumber,
            price: roomPrice,
            tax: roomTax,
            extraBeds: roomExtraBeds,
            extraBedPrice,
            total: roomTotal + roomExtraBedCharges + roomTax,
            isAc: room.isAc,
            roomType: room.room.type.name,
            adults: room.adults || 0,
            children: room.children || 0,
            maxoccupancy: room.room.occupancy,
            occupancySummary: `${room.adults} Adult${(room.adults || 0) > 1 ? 's' : ''}, ${room.children} Child${(room.children || 0) > 1 ? 'ren' : ''}`,
            checkIn: room.checkIn,
            checkOut: room.checkOut
          })
        })
      } else {
        // For pending/cancelled bookings, use booking creation date as reference
        earliestCheckIn = booking.createdAt
        latestCheckOut = booking.createdAt
      }

      // Calculate services total (applies to all booking statuses)
      const servicesTotal = booking.services.reduce((sum, service) => {
        const price = parseFloat(service.price.toString())
        const quantity = (service as any).quantity || 1
        return sum + price * quantity
      }, 0)

      // Calculate base amount
      const baseAmount = roomChargesTotal + extraBedChargesTotal + servicesTotal

      // Get all payments
      const paymentHistory = booking.payments
        .map(payment => ({
          id: payment.id,
          amount: parseFloat(payment.amount.toString()),
          method: payment.method,
          date: payment.date,
          note: payment.note || '',
          transactionId: payment.transactionid || ''
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)

      // Calculate totals differently based on booking status
      let totalAmount = 0
      let pendingAmount = 0

      if (booking.bookingstatus === 1) {
        totalAmount = booking.bill ? parseFloat(booking.bill.totalAmount.toString()) : baseAmount + taxTotal
        pendingAmount = totalAmount - totalPaid
      } else {
        // For cancelled/pending bookings, total amount is just services (if any)
        totalAmount = servicesTotal
        pendingAmount = Math.max(0, totalAmount - totalPaid) // Ensure no negative pending amount
      }

      return {
        id: booking.id,
        checkIn: earliestCheckIn,
        checkOut: latestCheckOut,
        arrive: booking.arriveFrom,
        bookedBy: booking.bookedBy
          ? {
              id: booking.bookedBy.id,
              name: booking.bookedBy.name
            }
          : null,
        purposeOfVisit: booking.purposeOfVisit
          ? {
              id: booking.purposeOfVisit.id,
              name: booking.purposeOfVisit.name
            }
          : null,
        roomDetails,
        services: booking.services.map(service => ({
          id: service.id,
          name: service.name,
          price: parseFloat(service.price.toString()),
          quantity: (service as any).quantity || 1
        })),
        baseAmount,
        taxTotal,
        totalAmount: baseAmount + taxTotal,
        totalPaid,
        pendingAmount,
        paymentHistory,
        nights,
        createdAt: booking.createdAt,
        bookingStatus: booking.bookingstatus // Return actual status instead of derived
      }
    })

    return NextResponse.json({
      data: transformedBookings,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
        pageSize
      }
    })
  } catch (error) {
    console.error('Error fetching paginated bookings:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
