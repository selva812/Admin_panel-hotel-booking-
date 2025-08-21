// // app/api/bookings/closed/route.ts
// import { NextResponse } from 'next/server'
// // import { PrismaClient } from '@prisma/client'
// import { prisma } from '@/libs/prisma'

// // const prisma = new PrismaClient({
// //   log: [
// //     { emit: 'event', level: 'query' },
// //     { emit: 'stdout', level: 'info' },
// //     { emit: 'stdout', level: 'warn' },
// //     { emit: 'stdout', level: 'error' }
// //   ]
// // })

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const page = Number(searchParams.get('page') || 1)
//     const pageSize = Number(searchParams.get('pageSize') || 10)
//     const skip = (page - 1) * pageSize
//     const bookingDate = searchParams.get('bookingDate') || ''
//     const fromDate = searchParams.get('fromDate') || ''
//     const toDate = searchParams.get('toDate') || ''
//     const taxType = searchParams.get('taxType') // 'tax', 'non-tax', or undefined
//     const isOnline = searchParams.get('isOnline')
//     let where: any = {
//       bookingstatus: 0
//     }

//     if (fromDate && toDate) {
//       const startDate = new Date(fromDate)
//       const endDate = new Date(toDate)
//       endDate.setHours(23, 59, 59, 999)

//       where.bookedRooms = {
//         some: {
//           checkIn: {
//             gte: startDate,
//             lte: endDate
//           }
//         }
//       }
//     }
//     if (bookingDate) {
//       const startDate = new Date(bookingDate)
//       const endDate = new Date(bookingDate)
//       endDate.setHours(23, 59, 59, 999)

//       where.bookedRooms = {
//         some: {
//           checkIn: {
//             gte: startDate,
//             lte: endDate
//           }
//         }
//       }
//     }

//     // Add tax type filter
//     if (taxType) {
//       where.bill = {
//         istax: taxType === 'tax' ? true : false
//       }
//     }
//     // Add isOnline filter
//     if (isOnline && isOnline !== 'all') {
//       where.isonline = isOnline === 'online'
//     }
//     const [bookings, total] = await Promise.all([
//       prisma.booking.findMany({
//         skip,
//         take: pageSize,
//         orderBy: { createdAt: 'desc' },
//         where,
//         select: {
//           id: true,
//           bookingref: true,
//           payments: true,
//           customer: {
//             select: { id: true, name: true, phoneNumber: true }
//           },
//           bookedBy: {
//             select: { id: true, name: true, email: true }
//           },
//           bookedRooms: {
//             select: {
//               room: { select: { id: true, roomNumber: true } },
//               checkIn: true,
//               checkOut: true
//             }
//           },
//           bill: {
//             select: {
//               id: true,
//               totalAmount: true,
//               invoiceId: true,
//               createdAt: true,
//               istax: true, // Include istax in the select
//               payments: {
//                 select: {
//                   id: true,
//                   amount: true,
//                   method: true,
//                   date: true
//                 }
//               }
//             }
//           }
//         }
//       }),
//       prisma.booking.count({ where })
//     ])

//     const formattedBookings = bookings.map(booking => {
//       const firstCheckIn = booking.bookedRooms[0]?.checkIn ?? null
//       const lastCheckOut = booking.bookedRooms[booking.bookedRooms.length - 1]?.checkOut ?? null
//       const totalPaid = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

//       // Calculate balance
//       const balance = booking.bill ? Number(booking.bill.totalAmount) - totalPaid : 0
//       return {
//         id: booking.id,
//         bookingref: booking.bookingref,
//         invoiceref: booking.bill?.invoiceId,
//         checkIn: firstCheckIn,
//         checkOut: lastCheckOut,
//         customer: booking.customer,
//         bookedBy: booking.bookedBy,
//         invoicedate: booking.bill?.createdAt,
//         roomNumbers: booking.bookedRooms.map(br => br.room.roomNumber).join(', '),
//         bill: booking.bill
//           ? {
//               id: booking.bill.id,
//               totalAmount: booking.bill.totalAmount,
//               invoiceId: booking.bill.invoiceId,
//               istax: booking.bill.istax, // Include tax status in response
//               totalPaid,
//               balance,
//               payments: booking.bill.payments.map(payment => ({
//                 id: payment.id,
//                 amount: payment.amount,
//                 mode: payment.method,
//                 createdAt: payment.date
//               }))
//             }
//           : null
//       }
//     })

//     const totalPages = Math.ceil(total / pageSize)

//     return NextResponse.json({
//       data: formattedBookings,
//       meta: {
//         currentPage: page,
//         totalPages,
//         pageSize,
//         totalItems: total
//       }
//     })
//   } catch (error) {
//     console.error('Error fetching closed bookings:', error)
//     return NextResponse.json(
//       { message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     )
//   } finally {
//     await prisma.$disconnect()
//   }
// }

// app/api/bookings/closed/route.ts
// app/api/bookings/closed/route.ts
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

    // pagination
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 10)))
    const skip = (page - 1) * pageSize

    // filters
    const bookingDate = searchParams.get('bookingDate') || '' // treated as INVOICE DATE (bill.createdAt)
    const fromDate = searchParams.get('fromDate') || ''
    const toDate = searchParams.get('toDate') || ''
    const taxType = searchParams.get('taxType') // 'tax' | 'non-tax' | null
    const isOnlineParam = searchParams.get('isOnline') // 'online' | 'walk-in' | 'all' | null

    // base where: closed bookings (bookingstatus = 0) that HAVE a bill
    const where: any = {
      bookingstatus: 0
    }

    // Build bill filter object
    const billFilter: any = {}

    // Date range filter on the INVOICE date (bill.createdAt)
    if (fromDate && toDate) {
      const startDate = new Date(fromDate)
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)
      billFilter.createdAt = { gte: startDate, lte: endDate }
    }

    // Single-day filter on the INVOICE date
    if (bookingDate) {
      const startDate = new Date(bookingDate)
      const endDate = new Date(bookingDate)
      endDate.setHours(23, 59, 59, 999)
      billFilter.createdAt = { gte: startDate, lte: endDate }
    }

    // Tax / Non-tax
    if (taxType === 'tax') billFilter.istax = true
    if (taxType === 'non-tax') billFilter.istax = false

    // If we have any billField filters, use `is: { ... }`. Otherwise just ensure bill exists.
    where.bill = Object.keys(billFilter).length ? { is: billFilter } : { isNot: null }

    // Online vs Walk-in
    if (isOnlineParam && isOnlineParam !== 'all') {
      where.isonline = isOnlineParam === 'online'
    }

    // Query
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        where,
        select: {
          id: true,
          bookingref: true,
          createdAt: true,
          isonline: true,
          payments: {
            select: { id: true, amount: true, method: true, date: true }
          },
          customer: {
            select: { id: true, name: true, phoneNumber: true }
          },
          bookedBy: {
            select: { id: true, name: true, email: true }
          },
          bookedRooms: {
            select: {
              room: { select: { id: true, roomNumber: true } },
              checkIn: true,
              checkOut: true
            }
          },
          bill: {
            select: {
              id: true,
              totalAmount: true,
              invoiceId: true,
              createdAt: true,
              istax: true,
              payments: {
                select: { id: true, amount: true, method: true, date: true }
              }
            }
          }
        }
      }),
      prisma.booking.count({ where })
    ])

    // Format & compute
    const formattedBookings = bookings.map(b => {
      // sort bookedRooms by checkIn to ensure first/last are correct
      const roomsSorted = [...b.bookedRooms].sort(
        (a, c) => new Date(a.checkIn).getTime() - new Date(c.checkIn).getTime()
      )
      const firstCheckIn = roomsSorted[0]?.checkIn ?? null
      const lastCheckOut = roomsSorted.length ? roomsSorted[roomsSorted.length - 1].checkOut : null

      const totalPaid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const balance = b.bill ? Number(b.bill.totalAmount) - totalPaid : 0

      return {
        id: b.id,
        bookingref: b.bookingref,
        isonline: b.isonline,
        invoiceref: b.bill?.invoiceId,
        checkIn: firstCheckIn,
        checkOut: lastCheckOut,
        customer: b.customer,
        bookedBy: b.bookedBy,
        invoicedate: b.bill?.createdAt,
        roomNumbers: roomsSorted.map(br => br.room.roomNumber).join(', '),
        bill: b.bill
          ? {
              id: b.bill.id,
              totalAmount: b.bill.totalAmount,
              invoiceId: b.bill.invoiceId,
              istax: b.bill.istax,
              totalPaid,
              balance,
              payments: b.bill.payments.map(p => ({
                id: p.id,
                amount: p.amount,
                mode: p.method,
                createdAt: p.date
              }))
            }
          : null
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
  } catch (error) {
    console.error('Error fetching closed bookings:', error)
    return NextResponse.json(
      { message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
