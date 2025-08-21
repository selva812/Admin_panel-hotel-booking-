// import { PrismaClient } from '@prisma/client'
// import { NextRequest, NextResponse } from 'next/server'

// const prisma = new PrismaClient()

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams
//     const dateParam = searchParams.get('date')

//     if (!dateParam) {
//       return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
//     }
//     const date = new Date(dateParam)
//     if (isNaN(date.getTime())) {
//       return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
//     }
//     const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
//     const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
//     const totalRooms = await prisma.room.count()

//     // Find all bookings that overlap with the requested date
//     const bookings = await prisma.booking.findMany({
//       where: {
//         OR: [
//           {
//             bookingstatus: 0,
//             bookedRooms: {
//               some: {
//                 checkIn: { lte: endOfDay },
//                 checkOut: { gte: startOfDay }
//               }
//             }
//           },
//           {
//             bookingstatus: 1,
//             bookedRooms: {
//               some: {
//                 checkIn: { lte: endOfDay },
//                 checkOut: { gte: startOfDay }
//               }
//             }
//           },
//           {
//             bookingstatus: 2,
//             date: {
//               gte: startOfDay,
//               lte: endOfDay
//             },
//             status: true
//           }
//         ]
//       },
//       select: {
//         id: true,
//         bookingstatus: true,
//         rooms: true,
//         date: true,
//         bookedRooms: {
//           select: {
//             checkIn: true,
//             checkOut: true,
//             isCheckedOut: true
//           }
//         }
//       }
//     })

//     let bookedCount = 0

//     for (const booking of bookings) {
//       if (booking.bookingstatus === 2) {
//         bookedCount += booking.rooms || 0
//       } else {
//         for (const room of booking.bookedRooms) {
//           if (
//             room.checkIn <= endOfDay &&
//             room.checkOut >= startOfDay &&
//             room.isCheckedOut === false // ✅ only count rooms not yet checked out
//           ) {
//             bookedCount++
//           }
//         }
//       }
//     }

//     const bookedRoomIds = bookings.map(room => room.id)

//     // 2. Now find all rooms that are NOT in the booked rooms list
//     const availableRooms = await prisma.room.findMany({
//       where: {
//         id: { notIn: bookedRoomIds },
//         status: true // Only active rooms
//       },
//       include: {
//         type: true,
//         floor: true
//       },
//       orderBy: [{ floorId: 'asc' }, { roomNumber: 'asc' }]
//     })
//     const available = Math.max(0, totalRooms - bookedCount)

//     return NextResponse.json({
//       date: date.toISOString().split('T')[0],
//       totalRooms,
//       booked: bookedCount,
//       available,
//       availableRooms: availableRooms.map(room => ({
//         id: room.id,
//         roomNumber: room.roomNumber,
//         type: room.type.name,
//         floor: room.floor.name,
//         acPrice: room.acPrice,
//         nonAcPrice: room.nonAcPrice,
//         online_ac: room.online_acPrice,
//         online_nonac: room.online_nonAcPrice,
//         occupancy: room.occupancy
//       })),
//       breakdown: {
//         active: bookings.filter(b => b.bookingstatus === 0).length,
//         confirmed: bookings.filter(b => b.bookingstatus === 1).length,
//         requests: bookings.filter(b => b.bookingstatus === 2).length
//       }
//     })
//   } catch (error: any) {
//     console.error('Availability check error:', error)
//     return NextResponse.json(
//       {
//         message: 'Internal server error',
//         error: error.message
//       },
//       { status: 500 }
//     )
//   } finally {
//     await prisma.$disconnect()
//   }
// }

import { prisma } from '@/libs/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
    }

    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    // Convert given date to exact requested moment in UTC
    const requestedMoment = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours() || 0,
        date.getUTCMinutes() || 0,
        date.getUTCSeconds() || 0
      )
    )

    // Fetch all rooms with relations
    const allRooms = await prisma.room.findMany({
      where: { status: true },
      include: { type: true, floor: true }
    })

    // Fetch all bookings that overlap the given moment
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            checkIn: { lte: requestedMoment },
            checkOut: { gte: requestedMoment }
          }
        }
      },
      select: {
        id: true,
        bookingstatus: true,
        bookedRooms: {
          select: {
            roomId: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true
          }
        }
      }
    })

    // 🔹 New: Fetch future bookings starting within 24 hours of requestedMoment
    const futureBookingsSoon = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            checkIn: {
              gt: requestedMoment,
              lte: new Date(requestedMoment.getTime() + 24 * 60 * 60 * 1000) // within next 24 hours
            }
          }
        }
      },
      select: {
        bookedRooms: {
          select: {
            roomId: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true
          }
        }
      }
    })
    // Map roomId → checkout date for occupied rooms
    const occupiedMap = new Map<number, Date>()
    for (const booking of overlappingBookings) {
      for (const br of booking.bookedRooms) {
        if (!br.isCheckedOut) {
          occupiedMap.set(br.roomId, br.checkOut)
        }
      }
    }
    // 🔹 Add "blocked for future within 24h" logic
    for (const booking of futureBookingsSoon) {
      for (const br of booking.bookedRooms) {
        if (!br.isCheckedOut && !occupiedMap.has(br.roomId)) {
          occupiedMap.set(br.roomId, br.checkOut)
        }
      }
    }

    // Build availableRooms array with expected checkout info
    const availableRooms = allRooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      type: room.type.name,
      floor: room.floor.name,
      acPrice: room.acPrice,
      nonAcPrice: room.nonAcPrice,
      online_ac: room.online_acPrice,
      online_nonac: room.online_nonAcPrice,
      occupancy: room.occupancy,
      expectedCheckout: occupiedMap.get(room.id) || null
    }))

    // Count stats
    const totalRooms = allRooms.length
    const bookedCount = occupiedMap.size
    const availableCount = totalRooms - bookedCount

    return NextResponse.json({
      date: requestedMoment.toISOString(),
      totalRooms,
      booked: bookedCount,
      available: availableCount,
      availableRooms
    })
  } catch (error: any) {
    console.error('Availability check error:', error)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
