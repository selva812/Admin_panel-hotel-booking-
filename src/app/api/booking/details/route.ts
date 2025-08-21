import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
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

        purposeOfVisit: true,
        bookingType: true,
        payments: true
      }
    })

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
    }

    // Calculate earliest checkIn and latest checkOut from bookedRooms
    const checkInDates = booking.bookedRooms.map(br => new Date(br.checkIn))
    const checkOutDates = booking.bookedRooms.map(br => new Date(br.checkOut))

    const checkIn = new Date(Math.min(...checkInDates.map(date => date.getTime())))
    const checkOut = new Date(Math.max(...checkOutDates.map(date => date.getTime())))

    const totalAdvance = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Calculate pricing using stored tax values
    const subtotal = booking.bookedRooms.reduce((sum, br) => sum + Number(br.bookedPrice), 0)
    const extrabedtotal = booking.bookedRooms.reduce((sum, br) => {
      return br.extraBeds > 0 ? sum + Number(br.extraBedPrice || 0) * br.extraBeds : sum
    }, 0)

    const tax = booking.bookedRooms.reduce((sum, br) => sum + Number(br.tax || 0), 0)

    const total = subtotal + tax + extrabedtotal

    const responseData = {
      id: booking.id,
      bookingref: booking.bookingref,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      arriveFrom: booking.arriveFrom,
      advance: totalAdvance,
      isAdvance: booking.isadvance,
      bookingstatus: booking.bookingstatus,
      customer: {
        id: booking.customer.id,
        name: booking.customer.name,
        phone: booking.customer.phoneNumber,
        company: booking.customer.companyName,
        picture: booking.customer.picture || null,
        address: booking.customer.address,
        idNumber: booking.customer.idNumber
      },
      bookedRooms: booking.bookedRooms.map(br => ({
        id: br.id,
        roomId: br.roomId,
        roomNumber: br.room?.roomNumber || '',
        roomName: br.room?.type?.name || '',
        maxOccupancy: br.room?.occupancy || 0,
        floor: br.room?.floor?.name || 0,
        acSelected: br.isAc || false,
        adults: br.adults,
        children: br.children,
        extraBed: br.extraBeds,
        extraBedPrice: br.extraBeds > 0 ? br.extraBedPrice : 0,
        price: br.bookedPrice,
        tax: br.tax ? Number(br.tax) : 0,
        ischeckout: br.isCheckedOut,
        checkIn: br.checkIn.toISOString(),
        checkOut: br.checkOut.toISOString(),
        occupancies: br.occupancies.map(occ => ({
          name: occ.name,
          address: occ.address,
          phone: occ.phone,
          photo: occ.photo
        }))
      })),
      pricing: {
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
        extrabedtotal: Number(extrabedtotal.toFixed(2)),
        balance: Number((total - totalAdvance).toFixed(2))
      },
      purposeOfVisit: booking.purposeOfVisit
        ? {
            id: booking.purposeOfVisit.id,
            name: booking.purposeOfVisit.name
          }
        : null,
      bookingType: {
        id: booking.bookingType.id,
        name: booking.bookingType.name
      },
      payments: booking.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        date: payment.date.toISOString(),
        note: payment.note || '',
        transactionid: payment.transactionid || ''
      }))
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching booking details:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
