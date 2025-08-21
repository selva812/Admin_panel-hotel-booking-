// /api/reports/revenue/export/report.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'excel'
    const dataOnly = searchParams.get('dataOnly') === 'true'

    // New filter parameters
    const customerId = searchParams.get('customerId')
    const roomId = searchParams.get('roomId')
    const bookedById = searchParams.get('bookedById')

    console.log('Export request received:', {
      startDate,
      endDate,
      format,
      dataOnly,
      customerId,
      roomId,
      bookedById
    })

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    // Build dynamic where clauses
    const bookingWhere: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Add customer filter if provided
    if (customerId) {
      bookingWhere.customerId = parseInt(customerId)
    }

    // Add booked by filter if provided
    if (bookedById) {
      bookingWhere.bookedById = parseInt(bookedById)
    }

    // Add room filter if provided (requires filtering through bookedRooms relation)
    if (roomId) {
      bookingWhere.bookedRooms = {
        some: {
          roomId: parseInt(roomId)
        }
      }
    }

    // Get booking data with all related information
    const [bookings, expenses] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        include: {
          customer: true,
          bookingType: true,
          bookedBy: true, // Include bookedBy user information
          bookedRooms: {
            include: {
              room: {
                include: {
                  type: true // Include room type information
                }
              }
            }
          },
          payments: true,
          bill: true
        },
        orderBy: {
          date: 'asc'
        }
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          category: true,
          recorder: true
        },
        orderBy: {
          date: 'asc'
        }
      })
    ])

    console.log('Found bookings:', bookings.length)
    console.log('Found expenses:', expenses.length)

    const reportData = processBookingData(bookings, expenses)

    return NextResponse.json({
      success: true,
      data: reportData,
      period: {
        startDate,
        endDate
      },
      filters: {
        customerId: customerId ? parseInt(customerId) : null,
        roomId: roomId ? parseInt(roomId) : null,
        bookedById: bookedById ? parseInt(bookedById) : null
      },
      totalBookings: bookings.length
    })
  } catch (error) {
    console.error('Error generating export:', error)
    return NextResponse.json(
      { error: 'Failed to generate export', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function processBookingData(bookings: any[], expenses: any[] = []) {
  const processedData = {
    summary: {
      totalBookings: bookings.length,
      totalRevenue: 0,
      totalIncome: 0, // From bookings payments
      otherIncome: 0, // From expenses with entrytype=true
      totalExpenses: 0, // From expenses with entrytype=false
      netRevenue: 0, // (totalIncome + otherIncome) - totalExpenses
      totalRooms: 0,
      averageBookingValue: 0,
      paymentMethods: {
        cash: 0,
        card: 0,
        online: 0
      }
    },
    bookings: bookings.map(booking => {
      const totalAmount = booking.bill?.totalAmount || 0
      const totalPaid = booking.payments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)

      return {
        id: booking.id,
        bookingRef: booking.bookingref,
        date: booking.date,
        customerName: booking.customer?.name || 'N/A',
        customerPhone: booking.customer?.phone || 'N/A',
        customerId: booking.customerId,
        bookedById: booking.bookedById,
        bookedByName: booking.bookedBy?.name || 'N/A', // Add booked by name
        bookingType: booking.bookingType?.name || 'N/A',
        roomsCount: booking.rooms,
        rooms: booking.bookedRooms.map((br: any) => ({
          roomId: br.room.id,
          roomNumber: br.room.roomNumber,
          roomType: br.room.type?.name || 'N/A',
          checkIn: br.checkIn,
          checkOut: br.checkOut,
          bookedPrice: Number(br.bookedPrice),
          isAc: br.isAc,
          adults: br.adults,
          children: br.children,
          extraBeds: br.extraBeds
        })),
        totalAmount: Number(totalAmount),
        totalPaid: totalPaid,
        balance: Number(totalAmount) - totalPaid,
        payments: booking.payments.map((payment: any) => ({
          amount: Number(payment.amount),
          method: payment.method,
          date: payment.date,
          isAdvance: payment.isadvance,
          transactionId: payment.transactionid,
          note: payment.note
        })),
        status: booking.bookingstatus
      }
    }),
    dailySummary: {} as Record<string, any>,
    expenses: expenses // Now includes all expenses, with type distinction
  }

  // Calculate payment totals (income from bookings)
  processedData.bookings.forEach(booking => {
    processedData.summary.totalIncome += booking.totalPaid
    processedData.summary.totalRooms += booking.roomsCount

    // Count payment methods
    booking.payments.forEach((payment: { method: any; amount: number }) => {
      switch (payment.method) {
        case 0:
          processedData.summary.paymentMethods.cash += payment.amount
          break
        case 1:
          processedData.summary.paymentMethods.card += payment.amount
          break
        case 2:
          processedData.summary.paymentMethods.online += payment.amount
          break
      }
    })
  })

  // Process all expense entries
  expenses.forEach(expense => {
    const amount = Number(expense.amount)
    if (expense.entrytype) {
      // Income (profit) entries
      processedData.summary.otherIncome += amount
    } else {
      // Expense entries
      processedData.summary.totalExpenses += amount
    }
  })

  // Calculate net revenue (totalIncome + otherIncome - totalExpenses)
  processedData.summary.netRevenue =
    processedData.summary.totalIncome + processedData.summary.otherIncome - processedData.summary.totalExpenses

  // For backward compatibility, set totalRevenue to netRevenue
  processedData.summary.totalRevenue = processedData.summary.netRevenue

  processedData.summary.averageBookingValue =
    processedData.summary.totalBookings > 0
      ? processedData.summary.totalIncome / processedData.summary.totalBookings
      : 0

  // Create daily summary
  const dailySummary: Record<string, any> = {}

  // Process bookings (income)
  processedData.bookings.forEach(booking => {
    const date = new Date(booking.date).toISOString().split('T')[0]
    if (!dailySummary[date]) {
      dailySummary[date] = {
        date,
        bookings: 0,
        income: 0,
        otherIncome: 0,
        expenses: 0,
        netRevenue: 0,
        rooms: 0
      }
    }
    dailySummary[date].bookings += 1
    dailySummary[date].income += booking.totalPaid
    dailySummary[date].rooms += booking.roomsCount
  })

  // Process all expense entries
  expenses.forEach(expense => {
    const date = new Date(expense.date).toISOString().split('T')[0]
    if (!dailySummary[date]) {
      dailySummary[date] = {
        date,
        bookings: 0,
        income: 0,
        otherIncome: 0,
        expenses: 0,
        netRevenue: 0,
        rooms: 0
      }
    }

    const amount = Number(expense.amount)
    if (expense.entrytype) {
      dailySummary[date].otherIncome += amount
    } else {
      dailySummary[date].expenses += amount
    }
  })

  // Calculate daily net revenue
  Object.keys(dailySummary).forEach(date => {
    dailySummary[date].netRevenue =
      dailySummary[date].income + dailySummary[date].otherIncome - dailySummary[date].expenses
  })

  processedData.dailySummary = dailySummary

  return processedData
}
