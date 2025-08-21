import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { endOfDay, parseISO, startOfDay } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get date from query parameters or use current date
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const date = dateParam ? parseISO(dateParam) : new Date()

    const startDate = startOfDay(date)
    const endDate = endOfDay(date)

    // Get bookings for the day by checking their bookedRooms
    const bookings = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            OR: [
              // New check-ins for today
              {
                checkIn: {
                  gte: startDate,
                  lte: endDate
                }
              },
              // Check-outs for today
              {
                checkOut: {
                  gte: startDate,
                  lte: endDate
                }
              },
              // Currently staying (checked in before today, checking out after today)
              {
                AND: [{ checkIn: { lt: startDate } }, { checkOut: { gt: endDate } }]
              }
            ]
          }
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            phoneNumber: true,
            companyName: true
          }
        },
        bookedRooms: {
          include: {
            room: {
              select: {
                roomNumber: true,
                isAc: true,
                type: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        bill: {
          include: {
            payments: true
          }
        },
        purposeOfVisit: true,
        bookingType: true,
        bookingReference: true
      }
    })

    // Get revenue statistics
    const revenue = await prisma.payment.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: true,
      _avg: {
        amount: true
      }
    })

    // Get room occupancy statistics
    const totalRooms = await prisma.room.count()
    const occupiedRooms = await prisma.room.count({
      where: {
        roomStatus: 1
      }
    })

    // Count check-ins, check-outs, and current stays based on bookedRooms
    const checkIns = bookings.filter(booking =>
      booking.bookedRooms.some(br => br.checkIn >= startDate && br.checkIn <= endDate)
    ).length

    const checkOuts = bookings.filter(booking =>
      booking.bookedRooms.some(br => br.checkOut >= startDate && br.checkOut <= endDate)
    ).length

    const currentStays = bookings.filter(booking =>
      booking.bookedRooms.some(br => br.checkIn < startDate && br.checkOut > endDate)
    ).length

    // Get service usage for the day
    const services = await prisma.service.findMany({
      where: {
        booking: {
          bookedRooms: {
            some: {
              OR: [
                { checkIn: { gte: startDate, lte: endDate } },
                { checkOut: { gte: startDate, lte: endDate } },
                {
                  AND: [{ checkIn: { lt: startDate } }, { checkOut: { gt: endDate } }]
                }
              ]
            }
          }
        }
      },
      select: {
        name: true,
        price: true
      }
    })

    // Format detailed booking information
    const bookingDetails = bookings.map(booking => {
      // Get earliest check-in and latest check-out from all booked rooms
      const checkIns = booking.bookedRooms.map(br => br.checkIn.getTime())
      const checkOuts = booking.bookedRooms.map(br => br.checkOut.getTime())
      const earliestCheckIn = new Date(Math.min(...checkIns))
      const latestCheckOut = new Date(Math.max(...checkOuts))

      const roomNumbers = booking.bookedRooms.map(br => br.room.roomNumber).join(', ')
      const totalRooms = booking.bookedRooms.length

      // Calculate total extra beds across all rooms
      const totalExtraBeds = booking.bookedRooms.reduce((sum, br) => sum + (br.extraBeds || 0), 0)

      return {
        id: booking.id,
        customerName: booking.customer.name,
        phoneNumber: booking.customer.phoneNumber,
        companyName: booking.customer.companyName || '',
        checkIn: earliestCheckIn,
        checkOut: latestCheckOut,
        purpose: booking.purposeOfVisit?.name || '',
        bookingType: booking.bookingType.name,
        reference: booking.bookingReference?.companyName || '',
        roomNumbers,
        totalRooms,
        totalAmount: booking.bill?.totalAmount || 0,
        status: getBookingStatus(earliestCheckIn, latestCheckOut, date),
        extras: {
          extraBeds: totalExtraBeds
        }
      }
    })

    // Calculate statistics
    const totalBookings = bookings.length
    const totalRevenue = revenue._sum.amount || 0
    const averageRevenuePerBooking = totalBookings > 0 ? Number(totalRevenue) / totalBookings : 0
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    // Prepare response
    const report = {
      date: date.toISOString().split('T')[0],
      statistics: {
        totalBookings,
        checkIns,
        checkOuts,
        currentStays,
        totalRevenue,
        averageRevenuePerBooking,
        occupancyRate: parseFloat(occupancyRate.toFixed(2)),
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms
      },
      bookings: bookingDetails,
      services: services.map(service => ({
        name: service.name,
        price: service.price
      })),
      paymentMethods: await getPaymentMethodBreakdown(startDate, endDate)
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating daily report:', error)
    return NextResponse.json({ error: 'Failed to generate daily report' }, { status: 500 })
  }
}

// Helper function to determine booking status
function getBookingStatus(earliestCheckIn: Date, latestCheckOut: Date, currentDate: Date) {
  const now = startOfDay(currentDate)

  if (startOfDay(earliestCheckIn) > now) {
    return 'UPCOMING'
  } else if (startOfDay(latestCheckOut) < now) {
    return 'COMPLETED'
  } else {
    return 'ACTIVE'
  }
}

// Helper function to get payment method breakdown
async function getPaymentMethodBreakdown(startDate: Date, endDate: Date) {
  const payments = await prisma.payment.groupBy({
    by: ['method'],
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      amount: true
    },
    _count: true
  })

  return {
    CASH: payments.find(p => p.method === 0)?._sum.amount || 0,
    CARD: payments.find(p => p.method === 1)?._sum.amount || 0,
    ONLINE: payments.find(p => p.method === 2)?._sum.amount || 0,
    cashCount: payments.find(p => p.method === 0)?._count || 0,
    cardCount: payments.find(p => p.method === 1)?._count || 0,
    onlineCount: payments.find(p => p.method === 2)?._count || 0
  }
}
