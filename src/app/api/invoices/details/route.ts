// app/api/bookings/closed/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bookingId = Number(searchParams.get('id'))

    if (isNaN(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 })
    }

    // Fetch booking data
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        bookingstatus: 0
      },
      include: {
        user: true,
        customer: true,
        bookedBy: true,
        payments: true,
        bookedRooms: {
          include: {
            room: {
              include: {
                type: true,
                floor: true
              }
            },
            occupancies: true
          }
        },
        bookingType: true,
        purposeOfVisit: true,
        bookingReference: true,
        bill: {
          include: {
            payments: true
          }
        },
        services: true
      }
    })

    if (!booking) {
      return NextResponse.json({ message: 'Closed booking not found' }, { status: 404 })
    }

    // Fetch hotel information
    const hotelInfo = await prisma.hotel_info.findFirst()

    const totalPaid = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const balance = booking.bill ? Number(booking.bill.totalAmount) - totalPaid : 0

    const response = {
      ...booking,
      bill: booking.bill
        ? {
            ...booking.bill,
            totalPaid,
            balance
          }
        : null
    }

    return NextResponse.json({
      booking: response,
      paymentSummary: {
        totalPaid,
        balance
      },
      hotelInfo: hotelInfo || null // Include hotel info in the response
    })
  } catch (error) {
    console.error('Error fetching closed booking:', error)
    return NextResponse.json(
      {
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
