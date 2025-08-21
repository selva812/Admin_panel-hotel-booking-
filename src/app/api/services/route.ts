import { NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})
const DEFAULT_PAGE_SIZE = 10

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE.toString())

    // Filter parameters
    const startDate = searchParams.get('startDate')
    const customerId = searchParams.get('customerId')

    // Validate inputs
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json({ message: 'Invalid pagination parameters' }, { status: 400 })
    }

    // Build the where clause for filtering
    const whereClause: any = {
      status: true,
      ...(customerId && {
        booking: {
          customerId: parseInt(customerId)
        }
      }),
      ...(startDate && { createdAt: { gte: new Date(startDate) } })
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              bookingref: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phoneNumber: true
                }
              },
              bookedRooms: {
                select: {
                  room: {
                    select: { roomNumber: true }
                  },
                  checkIn: true,
                  checkOut: true,
                  isCheckedOut: true
                }
              }
            }
          }
        }
      }),
      prisma.service.count({ where: whereClause })
    ])

    const transformedServices = services.map(service => {
      const bookedRooms = service.booking?.bookedRooms || []
      const firstRoom = bookedRooms[0]

      return {
        serviceId: service.id,
        serviceName: service.name,
        price: Number(service.price),
        roomNumber: service.room,
        bookingDetails: {
          bookingId: service.booking?.id,
          bookingref: service.booking?.bookingref,
          customer: {
            id: service.booking?.customer?.id,
            name: service.booking?.customer?.name,
            phone: service.booking?.customer?.phoneNumber
          },
          dates: {
            checkIn: firstRoom?.checkIn?.toISOString().split('T')[0],
            checkOut: firstRoom?.checkOut?.toISOString().split('T')[0],
            status: firstRoom?.isCheckedOut ? 'Checked Out' : 'Checked In'
          }
        },
        createdAt: service.createdAt
      }
    })

    return NextResponse.json({
      data: transformedServices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
        totalItems: total,
        pageSize
      }
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { message: 'Error fetching services', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Create new service
export async function POST(request: Request) {
  try {
    const { name, price, bookingId, roomNumber } = await request.json()

    // Validate required fields
    if (!name || !bookingId || isNaN(Number(bookingId))) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name and valid booking ID' },
        { status: 400 }
      )
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      select: { id: true }
    })

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 })
    }

    // Handle decimal conversion safely
    const priceDecimal = new Prisma.Decimal(price || 0)

    const newService = await prisma.service.create({
      data: {
        name,
        room: roomNumber,
        price: priceDecimal,
        bookingId: booking.id
      },
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true
      }
    })

    return NextResponse.json({ success: true, data: newService }, { status: 201 })
  } catch (error: unknown) {
    // Enhanced error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Service creation error:', errorMessage)
    return NextResponse.json(
      { success: false, message: 'Failed to create service', error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, price, bookingId, roomNumber } = await request.json()

    if (!id || !name || !bookingId || isNaN(Number(bookingId))) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: id, name, and valid booking ID' },
        { status: 400 }
      )
    }

    // Check if the service exists
    const existingService = await prisma.service.findUnique({
      where: { id: Number(id) }
    })

    if (!existingService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 })
    }

    // Check if the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      select: { id: true }
    })

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 })
    }

    const updatedService = await prisma.service.update({
      where: { id: Number(id) },
      data: {
        name,
        room: roomNumber,
        price: new Prisma.Decimal(price),
        bookingId: booking.id
      }
    })
    console.log(updatedService)
    return NextResponse.json(
      { success: true, message: 'Service updated successfully', data: updatedService },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Service update error:', errorMessage)

    return NextResponse.json(
      { success: false, message: 'Failed to update service', error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, message: 'Valid service ID is required' }, { status: 400 })
    }

    // Check if the service exists
    const existingService = await prisma.service.findUnique({
      where: { id: Number(id) }
    })

    if (!existingService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 })
    }

    // Soft delete by setting status to false
    const updatedService = await prisma.service.update({
      where: { id: Number(id) },
      data: {
        status: false
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Service deactivated successfully',
        data: {
          id: updatedService.id,
          name: updatedService.name,
          status: updatedService.status
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Service deactivation error:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to deactivate service',
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
