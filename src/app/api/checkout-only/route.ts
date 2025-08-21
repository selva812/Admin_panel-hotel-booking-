import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bookingId = body.bookingId
    const totalAmount = body.totalamount
    const checkout = body.date

    if (!bookingId || !totalAmount) {
      return NextResponse.json({ success: false, error: 'Missing bookingId or totalAmount' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookedRooms: true,
        bill: true,
        payments: true
      }
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.bookingstatus === 0) {
      return NextResponse.json({ success: false, error: 'Booking already closed' }, { status: 400 })
    }

    const totalPaid = booking.payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount.toString())
    }, 0)

    const balance = parseFloat(totalAmount.toString()) - totalPaid
    const currentDate = new Date(checkout)

    // Generate invoice ID based on tax calculation
    let invoiceId = null
    let isTaxBill = false
    if (!booking.bill) {
      // Calculate total tax from all booking rooms
      const totalTax = booking.bookedRooms.reduce((sum, room) => {
        return sum + (Number(room.tax) || 0)
      }, 0)

      // Determine if this is a tax bill or non-tax bill
      isTaxBill = totalTax > 0
      const prefixName = isTaxBill ? 'tax' : 'non_tax'

      const invoicePrefix = await prisma.invoiceprefix.findFirst({
        where: {
          name: prefixName,
          status: true
        }
      })

      if (!invoicePrefix) {
        return NextResponse.json(
          {
            success: false,
            error: `No active invoice prefix found for ${prefixName}`
          },
          { status: 400 }
        )
      }

      // Format number with leading zeros (4 digits)
      const formattedNumber = String(invoicePrefix.number).padStart(4, '0')
      invoiceId = `${invoicePrefix.prefix}${formattedNumber}`

      // Increment the invoice number for next use
      await prisma.invoiceprefix.update({
        where: { id: invoicePrefix.id },
        data: { number: invoicePrefix.number + 1 }
      })
    }

    // First transaction - update booking, rooms, and booking rooms
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          bookingstatus: 0
        }
      }),
      ...booking.bookedRooms.map(room =>
        prisma.room.update({
          where: { id: room.roomId },
          data: {
            roomStatus: 0,
            updatedAt: currentDate
          }
        })
      ),
      ...booking.bookedRooms.map(room => {
        const checkInDate = new Date(room.checkIn)
        const durationInMs = currentDate.getTime() - checkInDate.getTime()
        const stayedDays = Math.max(1, Math.ceil(durationInMs / (1000 * 60 * 60 * 24))) // Always at least 1 day

        return prisma.bookingRoom.update({
          where: { id: room.id },
          data: {
            isCheckedOut: true,
            checkOut: currentDate,
            stayed: stayedDays
          }
        })
      })
    ])

    // Second operation - create bill if needed
    let billCreated = false
    if (!booking.bill) {
      await prisma.bill.create({
        data: {
          bookingId,
          totalAmount,
          invoiceId,
          istax: isTaxBill // Set istax based on whether there's tax
        }
      })
      billCreated = true
    }

    return NextResponse.json({
      success: true,
      message: `Booking #${bookingId} checked out successfully.`,
      closedBookingId: bookingId,
      roomsFreed: booking.bookedRooms.length,
      billCreated,
      totalAmount,
      totalPaid,
      balance,
      invoiceId,
      isTaxBill
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Server error during checkout',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
              }
            : undefined
      },
      { status: 500 }
    )
  }
}
