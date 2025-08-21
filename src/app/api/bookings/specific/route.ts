// app/api/bookings/specific/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      select: {
        id: true,
        bookingref: true,
        bookingstatus: true,
        createdAt: true,
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            date: true,
            note: true,
            transactionid: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        bookedRooms: {
          select: {
            id: true,
            room: {
              select: {
                id: true,
                roomNumber: true
              }
            },
            checkIn: true,
            checkOut: true,
            bookedPrice: true,
            tax: true,
            adults: true,
            children: true,
            extraBeds: true,
            extraBedPrice: true,
            isAc: true
          }
        },
        bill: {
          select: {
            id: true,
            totalAmount: true,
            invoiceId: true,
            createdAt: true,
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                date: true,
                note: true
              }
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
    }

    const totalPaid = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const balance = booking.bill ? Number(booking.bill.totalAmount) - totalPaid : 0

    const formattedBooking = {
      id: booking.id,
      bookingref: booking.bookingref,
      bookingstatus: booking.bookingstatus,
      createdAt: booking.createdAt,
      customer: booking.customer,
      bookedBy: booking.bookedBy,
      roomNumbers: booking.bookedRooms.map(br => br.room.roomNumber).join(', '),
      bookedRooms: booking.bookedRooms,
      bill: booking.bill
        ? {
            id: booking.bill.id,
            totalAmount: booking.bill.totalAmount,
            invoiceId: booking.bill.invoiceId,
            createdAt: booking.bill.createdAt,
            totalPaid,
            balance,
            payments: booking.bill.payments
          }
        : null,
      payments: booking.payments
    }

    return NextResponse.json({
      success: true,
      data: formattedBooking
    })
  } catch (error) {
    console.error('Error fetching specific booking:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const { customerName, customerPhone, customerEmail, bookedRooms, billTotalAmount, payments } = body

    // Start a transaction
    const result = await prisma.$transaction(async tx => {
      // Update customer information if provided
      if (customerName || customerPhone || customerEmail) {
        const booking = await tx.booking.findUnique({
          where: { id: parseInt(bookingId) },
          select: { customerId: true }
        })

        if (booking) {
          await tx.customer.update({
            where: { id: booking.customerId },
            data: {
              ...(customerName && { name: customerName }),
              ...(customerPhone && { phoneNumber: customerPhone }),
              ...(customerEmail && { email: customerEmail })
            }
          })
        }
      }

      // Update booked rooms if provided
      if (bookedRooms && Array.isArray(bookedRooms)) {
        for (const room of bookedRooms) {
          if (room.id) {
            await tx.bookingRoom.update({
              where: { id: room.id },
              data: {
                ...(room.checkIn && { checkIn: new Date(room.checkIn) }),
                ...(room.checkOut && { checkOut: new Date(room.checkOut) }),
                ...(room.bookedPrice !== undefined && { bookedPrice: room.bookedPrice }),
                ...(room.tax !== undefined && { tax: room.tax }),
                ...(room.adults !== undefined && { adults: room.adults }),
                ...(room.children !== undefined && { children: room.children }),
                ...(room.extraBeds !== undefined && { extraBeds: room.extraBeds }),
                ...(room.extraBedPrice !== undefined && { extraBedPrice: room.extraBedPrice }),
                ...(room.isAc !== undefined && { isAc: room.isAc })
              }
            })
          }
        }
      }

      // Update bill total amount if provided
      if (billTotalAmount !== undefined) {
        await tx.bill.updateMany({
          where: { bookingId: parseInt(bookingId) },
          data: { totalAmount: billTotalAmount }
        })
      }

      // Update payments if provided
      if (payments && Array.isArray(payments)) {
        for (const payment of payments) {
          if (payment.id) {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                ...(payment.amount !== undefined && { amount: payment.amount }),
                ...(payment.method !== undefined && { method: payment.method }),
                ...(payment.note !== undefined && { note: payment.note }),
                ...(payment.transactionid !== undefined && { transactionid: payment.transactionid })
              }
            })
          }
        }
      }

      // Return updated booking
      return await tx.booking.findUnique({
        where: { id: parseInt(bookingId) },
        select: {
          id: true,
          bookingref: true,
          customer: { select: { id: true, name: true, phoneNumber: true } },
          bookedRooms: {
            select: {
              id: true,
              room: { select: { id: true, roomNumber: true } },
              checkIn: true,
              checkOut: true,
              bookedPrice: true,
              tax: true,
              adults: true,
              children: true,
              extraBeds: true,
              extraBedPrice: true,
              isAc: true
            }
          },
          bill: {
            select: {
              id: true,
              totalAmount: true,
              invoiceId: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              date: true,
              note: true,
              transactionid: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      data: result
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
