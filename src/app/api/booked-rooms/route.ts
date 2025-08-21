// // /api/booked-rooms/route.ts
// import { NextResponse } from 'next/server'
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// export async function GET() {
//   try {
//     // Get today's date range
//     const today = new Date()
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0))
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999))

//     const bookedRooms = await prisma.bookingRoom.findMany({
//       where: {
//         booking: {
//           checkIn: {
//             lte: endOfDay
//           },
//           checkOut: {
//             gte: startOfDay
//           }
//         }
//       },
//       include: {
//         room: true,
//         booking: {
//           include: {
//             customer: true,
//             bookingType: true
//           }
//         }
//       }
//     })

//     const response = bookedRooms.map(room => ({
//       bookingId: room.bookingId,
//       roomNumber: room.room.roomNumber,
//       customerName: room.booking.customer.name,
//       checkIn: room.booking.checkIn.toISOString(),
//       checkOut: room.booking.checkOut.toISOString(),
//       bookingType: room.booking.bookingType.name
//     }))

//     return NextResponse.json(response)
//   } catch (error) {
//     return NextResponse.json(
//       {
//         message: "Error fetching today's booked rooms",
//         error: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     )
//   }
// }

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get active bookings with required relations
    const activeBookings = await prisma.booking.findMany({
      where: {
        bookingstatus: 1
      },
      include: {
        customer: {
          select: {
            name: true
          }
        },
        bookedRooms: {
          include: {
            room: {
              select: {
                roomNumber: true
              }
            }
          }
        },
        bookingType: {
          select: {
            name: true
          }
        }
      }
    })

    // Transform the response structure
    const transformedResponse = activeBookings.flatMap(booking =>
      booking.bookedRooms.map(room => ({
        bookingId: booking.id,
        roomNumber: room.room.roomNumber,
        customerName: booking.customer.name,
        checkIn: room.checkIn.toISOString(),
        checkOut: room.checkOut.toISOString(),
        bookingType: booking.bookingType.name
      }))
    )

    return NextResponse.json({
      success: true,
      data: transformedResponse
    })
  } catch (error) {
    console.error('Error fetching active bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch active bookings' }, { status: 500 })
  }
}
