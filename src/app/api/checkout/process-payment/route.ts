import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'
import { z } from 'zod'

// Updated validation schema to include checkout flag
const paymentSchema = z.object({
  bookingId: z.number().int().positive(),
  amount: z.number().positive(),
  method: z.number(),
  note: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  checkout: z.boolean().optional().default(false), // New field for checkout flag
  checkoutDate: z.string().optional() // Optional checkout date
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transact } = body
    const validatedData = paymentSchema.parse(body)
    const { bookingId, amount, totalAmount, checkout, checkoutDate } = validatedData

    return await prisma.$transaction(async tx => {
      // Fetch booking with all related data including bookedRooms for tax calculation
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          bill: true,
          payments: true,
          bookedRooms: true
        }
      })

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
      }

      // Handle checkout if requested
      if (checkout) {
        if (booking.bookingstatus === 0) {
          return NextResponse.json({ success: false, error: 'Booking already closed' }, { status: 400 })
        }

        const currentDate = checkoutDate ? new Date(checkoutDate) : new Date()

        // Update booking status and rooms
        await tx.booking.update({
          where: { id: bookingId },
          data: { bookingstatus: 0 }
        })

        // Update room statuses
        await Promise.all(
          booking.bookedRooms.map(room =>
            tx.room.update({
              where: { id: room.roomId },
              data: { roomStatus: 0, updatedAt: currentDate }
            })
          )
        )

        // Update booking rooms with checkout info
        await Promise.all(
          booking.bookedRooms.map(room => {
            const checkInDate = new Date(room.checkIn)
            const durationInMs = currentDate.getTime() - checkInDate.getTime()
            const stayedDays = Math.max(1, Math.ceil(durationInMs / (1000 * 60 * 60 * 24)))

            return tx.bookingRoom.update({
              where: { id: room.id },
              data: {
                isCheckedOut: true,
                checkOut: currentDate,
                stayed: stayedDays
              }
            })
          })
        )
      }

      // Handle bill creation/update
      let bill
      if (booking.bill) {
        bill = await tx.bill.update({
          where: { id: booking.bill.id },
          data: {
            totalAmount,
            updatedAt: new Date()
          }
        })
      } else {
        // Calculate total tax from all booking rooms
        const totalTax = booking.bookedRooms.reduce((sum, room) => {
          return sum + (Number(room.tax) || 0)
        }, 0)

        // Determine if this is a tax bill or non-tax bill
        const isTaxBill = totalTax > 0
        const prefixName = isTaxBill ? 'tax' : 'non_tax'

        // Create new bill with invoice number based on tax status
        const invoicePrefix = await tx.invoiceprefix.findFirst({
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

        const formattedNumber = String(invoicePrefix.number).padStart(4, '0')
        const invoiceId = `${invoicePrefix.prefix}${formattedNumber}`

        await tx.invoiceprefix.update({
          where: { id: invoicePrefix.id },
          data: { number: invoicePrefix.number + 1 }
        })

        bill = await tx.bill.create({
          data: {
            bookingId: booking.id,
            invoiceId,
            totalAmount: totalAmount || 0,
            istax: isTaxBill // Set istax based on whether there's tax
          }
        })
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          billId: bill.id,
          bookingId,
          amount,
          method: validatedData.method,
          note: validatedData.note,
          transactionid: transact
        }
      })

      // Calculate payment summary
      const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0) + Number(amount)
      const balance = Number(bill.totalAmount) - totalPaid

      return NextResponse.json({
        success: true,
        data: {
          bookingId,
          payment,
          bill,
          checkoutProcessed: checkout,
          totalPaid,
          balance,
          message: `Payment processed${checkout ? ' and booking checked out' : ''} successfully`
        }
      })
    })
  } catch (error: any) {
    console.error('Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Server error', details: error.message }, { status: 500 })
  }
}
