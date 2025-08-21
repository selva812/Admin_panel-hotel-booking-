import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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
    const bookingIdParam = searchParams.get('bookingId') || ''
    const manualCheckoutParam = searchParams.get('checkout') || ''
    const bookingId = parseInt(bookingIdParam, 10)

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing bookingId query parameter'
        },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        bookedRooms: {
          include: {
            room: true
          }
        },
        services: true,
        payments: true,
        bill: {
          include: {
            payments: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found'
        },
        { status: 404 }
      )
    }

    // Calculate earliest checkIn from all booked rooms
    const checkInDates = booking.bookedRooms.map(br => new Date(br.checkIn))
    const checkIn = new Date(Math.min(...checkInDates.map(date => date.getTime())))

    // Determine checkout - use manual checkout if provided, otherwise calculate from booked rooms
    let checkOut: Date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (manualCheckoutParam) {
      // Use the manually provided checkout time
      checkOut = new Date(manualCheckoutParam)
      if (isNaN(checkOut.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid checkout date format' }, { status: 400 })
      }
    } else {
      const checkOutDates = booking.bookedRooms.map(br => new Date(br.checkOut))
      const calculatedCheckOut = new Date(Math.max(...checkOutDates.map(date => date.getTime())))
      checkOut = calculatedCheckOut < today ? new Date() : calculatedCheckOut
    }

    const stayDurationMs = Math.max(checkOut.getTime() - checkIn.getTime(), 86400000) // 86400000ms = 1 day
    const stayDurationDays = Math.ceil(stayDurationMs / (1000 * 60 * 60 * 24))

    let subtotal = 0
    let roomamount = 0
    let totalRoomTax = 0
    const roomCharges = booking.bookedRooms.map(bookedRoom => {
      const pricePerNight = parseFloat(bookedRoom.bookedPrice.toString())
      const roomCharge = pricePerNight * stayDurationDays
      roomamount += roomCharge
      subtotal += roomCharge
      let roomTaxAmount = 0
      if (bookedRoom.tax && !isNaN(parseFloat(bookedRoom.tax.toString()))) {
        roomTaxAmount = parseFloat(bookedRoom.tax.toString()) * stayDurationDays
        totalRoomTax += roomTaxAmount
      }
      const extraBedPrice = Number(bookedRoom.extraBedPrice?.toString()) || 0
      const extraBedsCount = bookedRoom.extraBeds || 0
      const extraBedCharges = extraBedPrice * extraBedsCount
      subtotal += extraBedCharges
      return {
        id: bookedRoom.room.id,
        roomNumber: bookedRoom.room.roomNumber,
        pricePerNight: bookedRoom.bookedPrice,
        nights: stayDurationDays,
        total: roomCharge + roomTaxAmount + extraBedCharges,
        isAc: bookedRoom.isAc,
        tax: roomTaxAmount > 0 ? roomTaxAmount : undefined,
        extraBeds: {
          count: bookedRoom.extraBeds,
          price: extraBedCharges
        },
        checkIn: bookedRoom.checkIn,
        checkOut: manualCheckoutParam || bookedRoom.checkOut
      }
    })
    const serviceCharges = booking.services.map(service => {
      const serviceCharge = parseFloat(service.price.toString())
      subtotal += serviceCharge
      return {
        name: service.name,
        price: service.price
      }
    })
    const taxAmount = totalRoomTax
    const grandTotal = subtotal + taxAmount
    const paymentsTotal = booking.payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0)
    const totalPayments = paymentsTotal
    const balanceDue = grandTotal - totalPayments
    console.log('checkout', checkOut.toISOString())
    const billDetails = {
      bookingId: booking.id,
      bookingref: booking.bookingref,
      customer: booking.customer,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      stayDuration: stayDurationDays,
      roomCharges,
      serviceCharges,
      subtotal,
      tax: taxAmount > 0 ? { amount: taxAmount } : null,
      grandTotal,
      paymentsTotal,
      totalPayments,
      balanceDue,
      payments: booking.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        date: payment.date,
        transactionId: payment.transactionid,
        note: payment.note || ''
      })),
      billPayments:
        booking.bill?.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          date: payment.date,
          note: payment.note || ''
        })) || [],
      existingBill: booking.bill || null,
      usedManualCheckout: !!manualCheckoutParam
    }

    return NextResponse.json({
      success: true,
      data: billDetails
    })
  } catch (error) {
    console.error('Error generating bill:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate bill'
      },
      { status: 500 }
    )
  }
}
