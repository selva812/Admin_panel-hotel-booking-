// import { prisma } from '@/libs/prisma'
// import { fromZonedTime } from 'date-fns-tz'
// import { NextRequest, NextResponse } from 'next/server'
// const INDIA_TIMEZONE = 'Asia/Kolkata'
// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams
//     const dateParam = searchParams.get('date')

//     if (!dateParam) {
//       return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
//     }
//     console.log('date params', dateParam)
//     const date = fromZonedTime(dateParam, INDIA_TIMEZONE)
//     console.log('after convert ', date)
//     if (isNaN(date.getTime())) {
//       return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
//     }

//     // Convert given date to exact requested moment in UTC
//     // const requestedMoment = new Date(
//     //   Date.UTC(
//     //     date.getUTCFullYear(),
//     //     date.getUTCMonth(),
//     //     date.getUTCDate(),
//     //     date.getUTCHours() || 0,
//     //     date.getUTCMinutes() || 0,
//     //     date.getUTCSeconds() || 0
//     //   )
//     // )
//     const requestedMoment = date
//     console.log('request moment', requestedMoment)
//     // Fetch all rooms with relations
//     const allRooms = await prisma.room.findMany({
//       where: { status: true },
//       include: { type: true, floor: true }
//     })

//     // Fetch all bookings that overlap the given moment
//     const overlappingBookings = await prisma.booking.findMany({
//       where: {
//         bookedRooms: {
//           some: {
//             checkIn: { lte: requestedMoment },
//             checkOut: { gte: requestedMoment }
//           }
//         }
//       },
//       select: {
//         id: true,
//         bookingstatus: true,
//         bookedRooms: {
//           select: {
//             roomId: true,
//             checkIn: true,
//             checkOut: true,
//             isCheckedOut: true
//           }
//         }
//       }
//     })

//     // 🔹 New: Fetch future bookings starting within 24 hours of requestedMoment
//     const futureBookingsSoon = await prisma.booking.findMany({
//       where: {
//         bookedRooms: {
//           some: {
//             checkIn: {
//               gt: requestedMoment,
//               lte: new Date(requestedMoment.getTime() + 24 * 60 * 60 * 1000) // within next 24 hours
//             }
//           }
//         }
//       },
//       select: {
//         bookedRooms: {
//           select: {
//             roomId: true,
//             checkIn: true,
//             checkOut: true,
//             isCheckedOut: true
//           }
//         }
//       }
//     })
//     // Map roomId → checkout date for occupied rooms
//     const occupiedMap = new Map<number, Date>()
//     for (const booking of overlappingBookings) {
//       for (const br of booking.bookedRooms) {
//         if (!br.isCheckedOut) {
//           occupiedMap.set(br.roomId, br.checkOut)
//         }
//       }
//     }
//     // 🔹 Add "blocked for future within 24h" logic
//     for (const booking of futureBookingsSoon) {
//       for (const br of booking.bookedRooms) {
//         if (!br.isCheckedOut && !occupiedMap.has(br.roomId)) {
//           occupiedMap.set(br.roomId, br.checkOut)
//         }
//       }
//     }

//     // Build availableRooms array with expected checkout info
//     const availableRooms = allRooms.map(room => ({
//       id: room.id,
//       roomNumber: room.roomNumber,
//       type: room.type.name,
//       floor: room.floor.name,
//       acPrice: room.acPrice,
//       nonAcPrice: room.nonAcPrice,
//       online_ac: room.online_acPrice,
//       online_nonac: room.online_nonAcPrice,
//       occupancy: room.occupancy,
//       expectedCheckout: occupiedMap.get(room.id) || null
//     }))

//     // Count stats
//     const totalRooms = allRooms.length
//     const bookedCount = occupiedMap.size
//     const availableCount = totalRooms - bookedCount

//     return NextResponse.json({
//       date: requestedMoment.toISOString(),
//       totalRooms,
//       booked: bookedCount,
//       available: availableCount,
//       availableRooms
//     })
//   } catch (error: any) {
//     console.error('Availability check error:', error)
//     return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
//   } finally {
//     await prisma.$disconnect()
//   }
// }

import { prisma } from '@/libs/prisma'
import { fromZonedTime } from 'date-fns-tz'
import { NextRequest, NextResponse } from 'next/server'
const INDIA_TIMEZONE = 'Asia/Kolkata'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 })
    }

    console.log('date params', dateParam)
    const date = fromZonedTime(dateParam, INDIA_TIMEZONE)
    console.log('after convert ', date)

    if (isNaN(date.getTime())) {
      return NextResponse.json({ message: 'Invalid date format' }, { status: 400 })
    }

    const requestedMoment = date
    console.log('request moment', requestedMoment)

    // Fetch all rooms with relations
    const allRooms = await prisma.room.findMany({
      where: { status: true },
      include: { type: true, floor: true }
    })

    // 1. Fetch currently occupied rooms (checkIn <= now <= checkOut)
    const occupiedBookings = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            checkIn: { lte: requestedMoment },
            checkOut: { gte: requestedMoment },
            isCheckedOut: false
          }
        }
      },
      select: {
        id: true,
        bookingstatus: true,
        bookedRooms: {
          where: {
            checkIn: { lte: requestedMoment },
            checkOut: { gte: requestedMoment },
            isCheckedOut: false
          },
          select: {
            roomId: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true
          }
        }
      }
    })

    // 2. Fetch future bookings within 24 hours (Blocked status)
    const twentyFourHoursLater = new Date(requestedMoment.getTime() + 24 * 60 * 60 * 1000)
    const blockedBookings = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            checkIn: {
              gt: requestedMoment,
              lte: twentyFourHoursLater
            },
            isCheckedOut: false
          }
        }
      },
      select: {
        bookedRooms: {
          where: {
            checkIn: {
              gt: requestedMoment,
              lte: twentyFourHoursLater
            },
            isCheckedOut: false
          },
          select: {
            roomId: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true
          }
        }
      }
    })

    // 3. Fetch regular future bookings (beyond 24 hours)
    const regularFutureBookings = await prisma.booking.findMany({
      where: {
        bookedRooms: {
          some: {
            checkIn: {
              gt: twentyFourHoursLater
            },
            isCheckedOut: false
          }
        }
      },
      select: {
        bookedRooms: {
          where: {
            checkIn: {
              gt: twentyFourHoursLater
            },
            isCheckedOut: false
          },
          select: {
            roomId: true,
            checkIn: true,
            checkOut: true,
            isCheckedOut: true
          }
        }
      }
    })

    // Create maps for different statuses
    const occupiedMap = new Map<number, { checkOut: Date; status: 'occupied' }>()
    const blockedMap = new Map<number, { checkIn: Date; checkOut: Date; status: 'blocked' }>()
    const bookedMap = new Map<number, { checkIn: Date; checkOut: Date; status: 'booked' }>()

    // Populate occupied rooms
    for (const booking of occupiedBookings) {
      for (const br of booking.bookedRooms) {
        occupiedMap.set(br.roomId, { checkOut: br.checkOut, status: 'occupied' })
      }
    }

    // Populate blocked rooms (within 24 hours)
    for (const booking of blockedBookings) {
      for (const br of booking.bookedRooms) {
        // Only add if not already occupied
        if (!occupiedMap.has(br.roomId)) {
          blockedMap.set(br.roomId, {
            checkIn: br.checkIn,
            checkOut: br.checkOut,
            status: 'blocked'
          })
        }
      }
    }

    // Populate regular booked rooms (beyond 24 hours)
    for (const booking of regularFutureBookings) {
      for (const br of booking.bookedRooms) {
        // Only add if not already occupied or blocked
        if (!occupiedMap.has(br.roomId) && !blockedMap.has(br.roomId)) {
          bookedMap.set(br.roomId, {
            checkIn: br.checkIn,
            checkOut: br.checkOut,
            status: 'booked'
          })
        }
      }
    }

    // Build availableRooms array with status information
    const availableRooms = allRooms.map(room => {
      let status: 'available' | 'occupied' | 'blocked' | 'booked' = 'available'
      let expectedCheckout: Date | null = null
      let nextCheckin: Date | null = null

      if (occupiedMap.has(room.id)) {
        status = 'occupied'
        expectedCheckout = occupiedMap.get(room.id)!.checkOut
      } else if (blockedMap.has(room.id)) {
        status = 'blocked'
        nextCheckin = blockedMap.get(room.id)!.checkIn
        expectedCheckout = blockedMap.get(room.id)!.checkOut
      } else if (bookedMap.has(room.id)) {
        status = 'booked'
        nextCheckin = bookedMap.get(room.id)!.checkIn
        expectedCheckout = bookedMap.get(room.id)!.checkOut
      }

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        type: room.type.name,
        floor: room.floor.name,
        acPrice: room.acPrice,
        nonAcPrice: room.nonAcPrice,
        online_ac: room.online_acPrice,
        online_nonac: room.online_nonAcPrice,
        occupancy: room.occupancy,
        status,
        expectedCheckout,
        nextCheckin
      }
    })

    // Count stats
    const totalRooms = allRooms.length
    const occupiedCount = occupiedMap.size
    const blockedCount = blockedMap.size
    const bookedCount = bookedMap.size
    const availableCount = totalRooms - (occupiedCount + blockedCount + bookedCount)

    return NextResponse.json({
      date: requestedMoment.toISOString(),
      totalRooms,
      occupied: occupiedCount,
      blocked: blockedCount,
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
