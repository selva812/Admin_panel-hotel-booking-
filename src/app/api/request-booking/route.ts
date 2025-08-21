import { NextRequest, NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})

const DEFAULT_PAGE_SIZE = 10
const JWT_SECRET = process.env.JWT_SECRET as string

function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, JWT_SECRET) as { id: number; role: string }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE.toString())
    const searchPhone = searchParams.get('searchPhone') || ''
    const searchName = searchParams.get('searchName') || ''
    const searchDate = searchParams.get('searchDate') || ''

    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json({ message: 'Invalid pagination parameters' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await prisma.booking.updateMany({
      where: {
        date: { lt: today },
        bookingstatus: 2,
        status: true
      },
      data: {
        bookingstatus: 3
      }
    })

    const where: any = {
      type: false,
      status: true
    }

    // Customer phone filter
    if (searchPhone) {
      where.customer = {
        phoneNumber: {
          contains: searchPhone,
          mode: 'insensitive'
        }
      }
    }

    // Customer name filter
    if (searchName) {
      if (where.customer) {
        where.customer.name = {
          contains: searchName,
          mode: 'insensitive'
        }
      } else {
        where.customer = {
          name: {
            contains: searchName,
            mode: 'insensitive'
          }
        }
      }
    }

    // Date filter
    if (searchDate) {
      const startDate = new Date(searchDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(searchDate)
      endDate.setHours(23, 59, 59, 999)

      where.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          bookedBy: {
            select: {
              name: true
            }
          },
          payments: {
            where: {
              status: true
            },
            select: {
              amount: true
            }
          }
        }
      })
    ])

    const totalPages = Math.ceil(total / pageSize)

    // Format bookings with required fields including payment total
    const formattedBookings = bookings.map(booking => {
      const paymentTotal = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

      return {
        id: booking.id,
        bookingref: booking.bookingref,
        date: booking.date,
        bookingstatus: booking.bookingstatus,
        customerName: booking.customer.name,
        customerPhone: booking.customer.phoneNumber,
        bookedBy: booking.bookedBy?.name || null,
        status: booking.bookingstatus,
        rooms: booking.rooms,
        createdAt: booking.createdAt,
        paymentTotal: paymentTotal,
        payments: booking.payments // Include full payment details if needed
      }
    })

    return NextResponse.json(
      {
        data: formattedBookings,
        pagination: {
          total,
          currentPage: page,
          totalPages,
          pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error fetching bookings' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }
    const body = await req.json()
    const {
      phoneNumber,
      customerName,
      checkIn,
      numberOfRooms,
      selectedRooms, // Array of { roomId, isAc, price }
      isadvance,
      amount,
      method,
      transaction
    } = body

    // Validate required fields
    if (!phoneNumber || !customerName || !checkIn || !numberOfRooms || !selectedRooms) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Validate number of selected rooms matches requested number
    if (selectedRooms.length !== numberOfRooms) {
      return NextResponse.json(
        {
          message: `Number of selected rooms (${selectedRooms.length}) doesn't match requested rooms (${numberOfRooms})`
        },
        { status: 400 }
      )
    }

    // Parse dates
    const checkInDate = new Date(checkIn)
    if (isNaN(checkInDate.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    const result = await prisma.$transaction(async tx => {
      // Find or create customer
      let customer = await tx.customer.findUnique({
        where: { phoneNumber }
      })

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            phoneNumber,
            name: customerName
          }
        })
      }

      // Create booking data object
      const bookingData: any = {
        userId: user.id,
        customerId: customer.id,
        bookedById: user.id,
        bookingTypeId: 1,
        type: false,
        bookingstatus: 2, // Assuming 2 is for pending/advance bookings
        bookingref: '', // You might want to generate a reference here
        date: checkInDate,
        rooms: numberOfRooms,
        isadvance: isadvance
      }

      // Create the booking
      const booking = await tx.booking.create({
        data: bookingData
      })

      // Create booking rooms for each selected room
      const bookingRooms = await Promise.all(
        selectedRooms.map(async (room: any) => {
          return await tx.bookingRoom.create({
            data: {
              bookingId: booking.id,
              roomId: room.roomId,
              checkIn: checkInDate,
              checkOut: new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000), // Example: +1 day
              bookedPrice: new Prisma.Decimal(room.price),
              isAc: room.isAc,
              status: true
            }
          })
        })
      )

      // Handle advance payment if provided
      if (isadvance && amount && method) {
        await tx.payment.create({
          data: {
            amount: new Prisma.Decimal(amount),
            bookingId: booking.id,
            method: parseInt(method),
            note: `Advance payment for booking ${booking.id}`,
            transactionid: transaction,
            date: new Date()
          }
        })
      }

      return { booking, customer, bookingRooms }
    })

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: result.booking,
        customer: result.customer,
        bookingRooms: result.bookingRooms,
        status: 'PENDING'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Error creating booking'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const bookingId = body.bookingId

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Update booking status to CANCELLED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingstatus: 3
      }
    })

    return NextResponse.json({
      success: true,
      message: `Booking #${bookingId} has been cancelled successfully`,
      booking: {
        id: updatedBooking.id,
        bookingref: updatedBooking.bookingref,
        status: updatedBooking.bookingstatus
      }
    })
  } catch (error: any) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Server error during cancellation',
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

export async function PUT(req: NextRequest) {
  try {
    const user = verifyToken(req)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }
    const body = await req.json()
    const {
      bookingId,
      phoneNumber,
      customerName,
      checkIn,
      numberOfRooms,
      isadvance,
      amount,
      method,
      transaction,
      arriveFrom
    } = body

    // Validate required fields
    if (!bookingId || !phoneNumber || !customerName || !checkIn || !numberOfRooms) {
      console.log('[DEBUG] Missing required fields:', {
        bookingId,
        phoneNumber,
        customerName,
        checkIn,
        numberOfRooms
      })
      return NextResponse.json(
        { message: 'Missing required fields (bookingId, phoneNumber, customerName, checkIn, numberOfRooms)' },
        { status: 400 }
      )
    }

    // Parse and validate date
    const checkInDate = new Date(checkIn)
    if (isNaN(checkInDate.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }
    const result = await prisma.$transaction(async tx => {
      const existingBooking = await tx.booking.findUnique({
        where: { id: Number(bookingId) },
        include: { customer: true }
      })

      if (!existingBooking) {
        throw new Error('Booking not found')
      }

      if (existingBooking.userId !== user.id) {
        throw new Error('Unauthorized to update this booking')
      }

      // 2. Update customer information if changed
      let customer = existingBooking.customer
      const customerChanged = customer.phoneNumber !== phoneNumber || customer.name !== customerName

      if (customerChanged) {
        customer = await tx.customer.update({
          where: { id: existingBooking.customerId },
          data: {
            phoneNumber,
            name: customerName
          }
        })
      }

      // 3. Prepare booking update data
      const bookingUpdateData = {
        date: checkInDate,
        rooms: numberOfRooms,
        isadvance: isadvance,
        ...(arriveFrom && { arriveFrom })
      }

      // 4. Update the booking
      const updatedBooking = await tx.booking.update({
        where: { id: Number(bookingId) },
        data: bookingUpdateData
      })

      // 5. Handle advance payment updates

      if (isadvance) {
        const shouldProcessPayment = amount !== undefined && method !== undefined && (method === 0 || !!method)

        if (shouldProcessPayment) {
          // Check for existing advance payment
          const existingPayment = await tx.payment.findFirst({
            where: {
              bookingId: Number(bookingId),
              isadvance: true
            }
          })

          if (existingPayment) {
            const updatedPayment = await tx.payment.update({
              where: { id: existingPayment.id },
              data: {
                amount: new Prisma.Decimal(amount),
                method: Number(method),
                transactionid: transaction,
                date: new Date()
              }
            })
          } else {
            const newPayment = await tx.payment.create({
              data: {
                amount: new Prisma.Decimal(amount),
                bookingId: Number(bookingId),
                method: Number(method),
                note: `Advance payment for booking ${updatedBooking.bookingref}`,
                transactionid: transaction,
                date: new Date(),
                isadvance: true
              }
            })
          }
        } else {
          console.log('[DEBUG] Advance payment requested but missing amount or method')
        }
      } else {
        const deleteResult = await tx.payment.deleteMany({
          where: {
            bookingId: Number(bookingId),
            isadvance: true
          }
        })
      }

      return { booking: updatedBooking, customer }
    })
    return NextResponse.json(
      {
        message: 'Booking updated successfully',
        booking: result.booking,
        customer: result.customer,
        status: 'UPDATED'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DEBUG] Booking update error:', error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Error updating booking',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
