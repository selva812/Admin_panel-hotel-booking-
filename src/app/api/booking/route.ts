import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import jwt from 'jsonwebtoken'
import { existsSync } from 'fs'
import { parseISTDate } from '@/utils/formatdate'
import { DateTime } from 'luxon'
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})

const JWT_SECRET = process.env.JWT_SECRET as string
function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, JWT_SECRET) as { id: number; role: string }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }
    const formData = await req.formData()
    const getFormValue = (key: string) => formData.get(key)?.toString() || null
    const getFormArray = (keyPrefix: string) => {
      const values = []
      let index = 0
      while (formData.has(`${keyPrefix}[${index}]`)) {
        values.push(formData.get(`${keyPrefix}[${index}]`)?.toString())
        index++
      }
      return values
    }
    const roomIds = getFormArray('roomIds').map(Number)
    const isAcs = getFormArray('isAcs').map(val => val === 'true')
    const checkIn = getFormValue('checkIn') || ''
    const checkOut = getFormValue('checkOut') || ''
    const stay = getFormValue('stay') || ''
    const existingid = getFormValue('bookingid')
    const customerId = getFormValue('customerId')
    const bookingTypeId = getFormValue('bookingTypeId')
    const adults = getFormArray('adults').map(Number)
    const children = getFormArray('children').map(Number)
    const extraBeds = getFormArray('extraBeds').map(Number)
    const extrabedprice = getFormValue('extrabedprice')
    const advance = getFormValue('advance')
    const advancePaymentMethod = getFormValue('advancePaymentMethod')
    const purposeOfVisitId = getFormValue('purposeOfVisitId')
    const bookingReferenceId = getFormValue('bookingReferenceId')
    const arriveFrom = getFormValue('arriveFrom')
    const taxIncluded = getFormValue('taxIncluded') === 'true'
    const notes = getFormValue('notes')
    const transaction = getFormValue('transaction')
    const type = formData.get('type') === 'true'
    const isonline = formData.get('isonline') === 'true'

    // Extract occupancy details
    const occupancyDetails: {
      roomIndex: number
      roomId: number
      occupantName: string | null
      occupantAddress: string | null
      occupantPhone: string | null
    }[] = []

    const seenIndices = new Set<number>()

    for (const key of formData.keys()) {
      const match = key.match(/^occupancyDetails\[(\d+)\]\[roomIndex\]$/)
      if (match) {
        const index = parseInt(match[1])
        if (seenIndices.has(index)) continue
        seenIndices.add(index)

        const roomIndex = parseInt(formData.get(`occupancyDetails[${index}][roomIndex]`)?.toString() || '0')
        const roomId = parseInt(formData.get(`occupancyDetails[${index}][roomId]`)?.toString() || '0')
        const occupantName = formData.get(`occupancyDetails[${index}][occupantName]`)?.toString() || null
        const occupantAddress = formData.get(`occupancyDetails[${index}][occupantAddress]`)?.toString() || null
        const occupantPhone = formData.get(`occupancyDetails[${index}][occupantPhone]`)?.toString() || null

        occupancyDetails.push({
          roomIndex,
          roomId,
          occupantName,
          occupantAddress,
          occupantPhone
        })
      }
    }

    // Handle image uploads
    const occupancyImages: { index: number; url: string; originalName: string }[] = []
    let imageIndex = 0
    while (formData.has(`occupancyImages[${imageIndex}]`)) {
      const imageFile = formData.get(`occupancyImages[${imageIndex}]`) as File
      if (imageFile && imageFile.size > 0) {
        // Process and save the image
        const imageUrl = await saveImageFile(imageFile, `occupancy_${imageIndex}`)
        occupancyImages.push({
          index: imageIndex,
          url: imageUrl,
          originalName: imageFile.name
        })
      }
      imageIndex++
    }

    // 1. Validate input arrays
    if (!Array.isArray(adults) || !Array.isArray(children) || !Array.isArray(extraBeds)) {
      throw new Error('Adults, children, and extraBeds must be arrays')
    }
    if (!Array.isArray(isAcs) || roomIds.length !== isAcs.length) {
      throw new Error('Mismatch between room count and isAc data')
    }

    if (roomIds.length !== adults.length || roomIds.length !== children.length || roomIds.length !== extraBeds.length) {
      throw new Error('Mismatch between room count and occupancy data')
    }

    // 2. Sanitize input values
    const sanitizedAdults = adults.map(a => Math.max(1, Number(a)))
    const sanitizedChildren = children.map(c => Math.max(0, Number(c)))
    const sanitizedExtraBeds = extraBeds.map(eb => Math.max(0, Number(eb)))
    const now = new Date()

    const checkInDate = parseISTDate(
      checkIn || DateTime.now().setZone('Asia/Kolkata').toFormat("yyyyMMdd'T'HH:mm:ss.SSS")
    )
    const checkOutDate = parseISTDate(checkOut || '')

    const isFutureBooking = checkInDate > now
    console.log('Dates', checkIn, checkOut)
    console.log('format change', checkInDate, checkOutDate)
    const totalExtraBedsUsed = sanitizedExtraBeds.reduce((sum, count) => sum + count, 0)

    // Transaction starts
    const result = await prisma.$transaction(
      async tx => {
        try {
          const rooms = await tx.room.findMany({
            where: { id: { in: roomIds.map(Number) } }
          })
          if (rooms.length !== roomIds.length) {
            throw new Error('One or more rooms not found')
          }

          // Get room tax percentage if tax is included
          let roomTaxPercentage = 0
          if (taxIncluded) {
            const roomTax = await tx.tax.findUnique({
              where: { name: 'room' }
            })

            if (!roomTax) {
              throw new Error('Room tax configuration not found')
            }

            roomTaxPercentage = roomTax.percentage
          }

          // 4. Check room capacities
          rooms.forEach((room, index) => {
            const totalPeople = sanitizedAdults[index] + sanitizedChildren[index]
            if (totalPeople > room.occupancy) {
              throw new Error(
                `Room ${room.roomNumber} exceeds maximum occupancy of ${room.occupancy} ` +
                  `(Attempted: ${totalPeople} people)`
              )
            }
          })

          // 5. Check for existing bookings - CORRECTED VERSION
          const existingBookings = await tx.bookingRoom.findMany({
            where: {
              roomId: { in: roomIds.map(Number) },
              booking: {
                bookingstatus: 1,
                // Exclude current booking if updating existing one
                ...(existingid && { id: { not: Number(existingid) } })
              },
              // Check date conflicts at bookingRoom level since checkIn/checkOut moved here
              OR: [
                { checkIn: { lte: checkInDate }, checkOut: { gte: checkInDate } },
                { checkIn: { lte: checkOutDate }, checkOut: { gte: checkOutDate } },
                { checkIn: { gte: checkInDate }, checkOut: { lte: checkOutDate } }
              ]
            },
            include: {
              booking: true,
              room: true
            }
          })

          if (existingBookings.length > 0) {
            const conflictingRooms = existingBookings.map(b => b.room.roomNumber)
            throw new Error(`Rooms ${[...new Set(conflictingRooms)]} already booked for selected dates`)
          }

          // 6. Check and update extra bed stock
          if (totalExtraBedsUsed > 0) {
            const defaultExtraBed = await tx.extraBed.findFirst()

            if (!defaultExtraBed) {
              throw new Error('No extra bed record found')
            }
          }

          let booking
          let isUpdatingExisting = false
          console.log('existing id', existingid)
          // Check if this is updating an existing advance booking
          if (existingid) {
            // Verify existing booking exists and is an advance booking
            const existingBooking = await tx.booking.findUnique({
              where: { id: Number(existingid) },
              include: {
                bookedRooms: true
              }
            })

            if (!existingBooking) {
              throw new Error('Existing booking not found')
            }

            if (existingBooking.type !== false) {
              throw new Error('Can only update advance bookings')
            }

            // Generate new booking reference for the existing booking
            const activePrefix = await tx.bookingprefix.findFirst({
              where: { status: true },
              orderBy: { id: 'desc' }
            })

            if (!activePrefix) {
              throw new Error('No active booking prefix found')
            }

            const formattedNumber = activePrefix.number.toString().padStart(4, '0')
            const bookingRef = `${activePrefix.prefix}${formattedNumber}`

            // Update existing booking
            booking = await tx.booking.update({
              where: { id: Number(existingid) },
              data: {
                bookingref: bookingRef,
                bookingstatus: 1,
                date: checkInDate,
                rooms: rooms.length,
                ...(arriveFrom && { arriveFrom }),
                ...(purposeOfVisitId && { purposeOfVisitId: Number(purposeOfVisitId) }),
                ...(bookingReferenceId && { bookingReferenceId: Number(bookingReferenceId) })
              }
            })

            // Increment booking prefix number
            await tx.bookingprefix.update({
              where: { id: activePrefix.id },
              data: { number: activePrefix.number + 1 }
            })

            isUpdatingExisting = true
          } else {
            // Create new booking
            const activePrefix = await tx.bookingprefix.findFirst({
              where: { status: true },
              orderBy: { id: 'desc' }
            })

            if (!activePrefix) {
              throw new Error('No active booking prefix found')
            }

            const formattedNumber = activePrefix.number.toString().padStart(4, '0')
            const bookingRef = type === false ? '-' : `${activePrefix.prefix}${formattedNumber}`

            const bookingData: any = {
              userId: Number(user.id),
              bookingref: bookingRef,
              customerId: Number(customerId),
              bookedById: Number(user.id),
              bookingTypeId: Number(bookingTypeId),
              bookingstatus: type === false ? 2 : 1,
              type: type,
              arriveFrom,
              date: checkInDate,
              rooms: rooms.length,
              isonline: isonline || 0
            }

            if (purposeOfVisitId) {
              bookingData.purposeOfVisitId = Number(purposeOfVisitId)
            }
            if (bookingReferenceId) {
              bookingData.bookingReferenceId = Number(bookingReferenceId)
            }

            booking = await tx.booking.create({
              data: bookingData
            })

            // Increment number only for DIRECT bookings
            if (type === true) {
              await tx.bookingprefix.update({
                where: { id: activePrefix.id },
                data: { number: activePrefix.number + 1 }
              })
            }
          }

          // Handle advance payment using the payment model
          if (advance && advancePaymentMethod) {
            const paymentNote = type === false ? `Advance` : notes || 'Payment'

            await tx.payment.create({
              data: {
                bookingId: booking.id,
                amount: Number(advance),
                method: parseInt(advancePaymentMethod),
                date: new Date(),
                transactionid: transaction,
                note: paymentNote
              }
            })
          }

          // Create/Update booking rooms and occupancy
          const parsedExtraBedPrice = parseFloat(extrabedprice ? extrabedprice : '0').toFixed(2)
          if (existingid) {
            await tx.bookingRoom.deleteMany({
              where: { bookingId: Number(existingid) }
            })
          }
          await Promise.all(
            rooms.map(async (room, index) => {
              const bookedPrice = isAcs[index]
                ? isonline
                  ? room.online_acPrice.toNumber()
                  : room.acPrice.toNumber()
                : isonline
                  ? room.online_nonAcPrice.toNumber()
                  : room.nonAcPrice.toNumber()
              const extraBedPrice = sanitizedExtraBeds[index] > 0 ? parsedExtraBedPrice : 0

              // Calculate tax for room price
              const roomTaxAmount = taxIncluded ? parseFloat(((bookedPrice * roomTaxPercentage) / 100).toFixed(2)) : 0

              // Calculate tax for extra bed price (if any)
              const extraBedTaxAmount =
                taxIncluded && sanitizedExtraBeds[index] > 0
                  ? parseFloat(((parseInt(extraBedPrice || '') * roomTaxPercentage) / 100).toFixed(2))
                  : 0

              // Total tax amount (room tax + extra bed tax)
              const totalTaxAmount = taxIncluded ? (roomTaxAmount + extraBedTaxAmount).toString() : 0

              const bookingRoom = await tx.bookingRoom.create({
                data: {
                  bookingId: booking.id,
                  roomId: room.id,
                  checkIn: checkInDate,
                  checkOut: checkOutDate,
                  stayed: parseInt(stay),
                  bookedPrice,
                  adults: sanitizedAdults[index],
                  children: sanitizedChildren[index],
                  extraBeds: sanitizedExtraBeds[index],
                  extraBedPrice: parsedExtraBedPrice,
                  isAc: isAcs[index],
                  tax: totalTaxAmount
                }
              })

              const roomOccupancy = occupancyDetails.find(occ => occ.roomIndex === index)
              const roomImage = occupancyImages.find(img => img.index === index)
              if (roomOccupancy || roomImage) {
                await tx.occupancy.create({
                  data: {
                    bookingRoomId: bookingRoom.id,
                    name: roomOccupancy?.occupantName || 'Unknown',
                    phone: roomOccupancy?.occupantPhone || null,
                    address: roomOccupancy?.occupantAddress || null,
                    photo: roomImage?.url || null
                  }
                })
              }

              // Update room status only if not an advance booking or if updating existing advance booking
              if (type !== false || isUpdatingExisting) {
                await tx.room.update({
                  where: { id: room.id },
                  data: {
                    roomStatus: !isFutureBooking ? 1 : 3,
                    updatedAt: new Date()
                  }
                })
              }
            })
          )

          return { booking, roomTaxPercentage, isUpdatingExisting }
        } catch (error: any) {
          console.error('Transaction error:', error)
          if (error instanceof Error) {
            throw error
          } else {
            throw new Error('Booking transaction failed')
          }
        }
      },
      {
        maxWait: 10000,
        timeout: 10000
      }
    )

    const responseMessage = result.isUpdatingExisting
      ? 'Advance booking confirmed successfully'
      : isFutureBooking
        ? 'Advanced booking successful'
        : 'Booking successful'

    return NextResponse.json(
      {
        message: responseMessage,
        booking: result.booking,
        uploadedImages: occupancyImages.length,
        taxApplied: taxIncluded,
        taxPercentage: result.roomTaxPercentage,
        bookingType: type,
        isUpdate: result.isUpdatingExisting
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Booking error:', error)
    return NextResponse.json({ message: error?.message || 'Booking failed' }, { status: 400 })
  }
}

// Helper function to save uploaded images
async function saveImageFile(file: File, prefix: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'occupancy')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const filename = `${prefix}_${timestamp}.${fileExtension}`
    const filepath = join(uploadDir, filename)

    // Save the file
    await writeFile(filepath, buffer)

    // Return the public URL
    return `/uploads/occupancy/${filename}`
  } catch (error) {
    console.error('Error saving image:', error)
    throw new Error('Failed to save image file')
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const pageSize = Number(searchParams.get('pageSize') || 10)
    const skip = (page - 1) * pageSize
    const startDateParam = searchParams.get('startDate') || ''
    const endDateParam = searchParams.get('endDate') || ''
    const customerId = searchParams.get('customerId') || ''
    const roomNumber = searchParams.get('roomNumber') || ''
    const statusFilter = searchParams.get('status') || ''

    let where: any = {
      status: true // Only active bookings
    }

    // Date range filter
    if (startDateParam || endDateParam) {
      const startDate = startDateParam ? new Date(startDateParam) : new Date(0)
      const endDate = endDateParam ? new Date(endDateParam) : new Date(8640000000000000)
      endDate.setHours(23, 59, 59, 999)

      where.bookedRooms = {
        some: {
          checkIn: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    }

    // Customer filter by ID
    if (parseInt(customerId)) {
      where.customerId = parseInt(customerId)
    }

    // Room number filter
    if (roomNumber) {
      where.bookedRooms = {
        ...where.bookedRooms,
        some: {
          room: {
            roomNumber: {
              contains: roomNumber
            }
          }
        }
      }
    }

    // Status filter
    if (statusFilter) {
      const statusValues = statusFilter.split(',').map(s => parseInt(s.trim()))
      where.bookingstatus = {
        in: statusValues
      }
    } else {
      // Default status filter if none provided
      where.bookingstatus = {
        in: [0, 1] // Default to confirmed and pending
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        where,
        select: {
          bookingref: true,
          bookingstatus: true,
          id: true,
          date: true,
          bookedBy: {
            select: {
              name: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              phoneNumber: true
            }
          },
          bookedRooms: {
            select: {
              checkIn: true,
              room: {
                select: {
                  roomNumber: true,
                  type: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          payments: {
            select: {
              amount: true
            }
          },
          bill: {
            select: {
              totalAmount: true
            }
          }
        }
      }),
      prisma.booking.count({ where })
    ])

    // Format response
    const formattedBookings = bookings.map(booking => {
      const roomNumbers = booking.bookedRooms.map(br => br.room.roomNumber)
      const roomTypes = [...new Set(booking.bookedRooms.map(br => br.room.type.name))]
      const paymentTotal = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalAmount = booking.bill?.totalAmount ? Number(booking.bill.totalAmount) : null

      return {
        bookingref: booking.bookingref,
        id: booking.id,
        customerId: booking.customer.id,
        checkIn: booking.date,
        numberOfRooms: booking.bookedRooms.length,
        roomNumbers,
        roomTypes,
        bookedBy: booking.bookedBy?.name || null,
        bookingStatus: booking.bookingstatus,
        customerName: booking.customer.name,
        customerPhone: booking.customer.phoneNumber,
        paymentTotal,
        totalAmount,
        balanceDue: totalAmount ? totalAmount - paymentTotal : null
      }
    })

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      data: formattedBookings,
      meta: {
        currentPage: page,
        totalPages,
        pageSize,
        totalItems: total
      }
    })
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      {
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')

    if (!bookingId || isNaN(Number(bookingId))) {
      return NextResponse.json({ success: false, error: 'Valid booking ID is required' }, { status: 400 })
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: {
        customer: true,
        bookedRooms: true,
        services: true,
        payments: true,
        bill: true
      }
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Use a transaction to ensure all updates succeed or fail together
    const result = await prisma.$transaction(async prisma => {
      // 1. Soft delete booking
      const updatedBooking = await prisma.booking.update({
        where: { id: Number(bookingId) },
        data: { status: false },
        include: { customer: true }
      })

      // 2. Soft delete all related booking rooms
      if (booking.bookedRooms.length > 0) {
        await prisma.bookingRoom.updateMany({
          where: { bookingId: Number(bookingId) },
          data: { status: false }
        })
      }

      // 3. Soft delete all related services
      if (booking.services.length > 0) {
        await prisma.service.updateMany({
          where: { bookingId: Number(bookingId) },
          data: { status: false }
        })
      }

      // 4. Soft delete all related payments
      if (booking.payments.length > 0) {
        await prisma.payment.updateMany({
          where: { bookingId: Number(bookingId) },
          data: { status: false }
        })
      }

      // 5. Soft delete related bill if exists
      if (booking.bill) {
        await prisma.bill.update({
          where: { id: booking.bill.id },
          data: { status: false }
        })
      }

      return updatedBooking
    })

    return NextResponse.json({
      success: true,
      message: `Booking #${booking.bookingref} and all related records have been deleted`,
      booking: {
        id: result.id,
        bookingref: result.bookingref,
        status: result.status,
        customerName: result.customer.name,
        affectedRecords: {
          bookingRooms: booking.bookedRooms.length,
          services: booking.services.length,
          payments: booking.payments.length,
          bill: booking.bill ? 1 : 0
        }
      }
    })
  } catch (error: any) {
    console.error('Error soft-deleting booking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Server error during deletion',
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
