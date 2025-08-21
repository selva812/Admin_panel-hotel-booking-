// app/api/room/filter/route.ts
// import { NextResponse } from 'next/server'
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// export async function GET(request: Request) {
//     try {
//         const { searchParams } = new URL(request.url)
//         const checkInDateStr = searchParams.get('checkInDate')

//         if (!checkInDateStr) {
//             return NextResponse.json({ message: 'checkInDate is required' }, { status: 400 })
//         }
//         const [day, month, year] = checkInDateStr.split('-')
//         const formattedCheckInDate = new Date(`${year}-${month}-${day}T00:00:00`)
//         const nextDay = new Date(formattedCheckInDate)
//         nextDay.setDate(nextDay.getDate() + 1)
//         const blockBefore = new Date(formattedCheckInDate.getTime() - 24 * 60 * 60 * 1000)
//         const today = new Date()
//         today.setHours(0, 0, 0, 0)
//         const isToday = formattedCheckInDate.getTime() === today.getTime()
//         const rooms = await prisma.room.findMany({
//             select: {
//                 id: true,
//                 roomNumber: true,
//                 occupancy: true,
//                 online_acPrice: true,
//                 online_nonAcPrice: true,
//                 acPrice: true,
//                 nonAcPrice: true,
//                 type: { select: { name: true } },
//                 floor: { select: { name: true } },
//                 bookingRooms: {
//                     where: {
//                         booking: {
//                             bookingstatus: { in: [1, 2] } // ✅ confirmed + tentative
//                         },
//                         OR: [
//                             // normal overlap with requested date
//                             {
//                                 checkIn: { lt: nextDay },
//                                 checkOut: { gt: formattedCheckInDate },
//                                 ...(isToday ? { isCheckedOut: false } : {})
//                             },
//                             // overdue / extended-stay (today only)
//                             ...(isToday
//                                 ? [
//                                     {
//                                         isCheckedOut: false,
//                                         checkOut: { lte: formattedCheckInDate }
//                                     }
//                                 ]
//                                 : []),
//                             // ✅ new: block if check-in is within 24 hours of requested date
//                             {
//                                 checkIn: {
//                                     gte: blockBefore,
//                                     lt: formattedCheckInDate
//                                 }
//                             }
//                         ]
//                     },
//                     select: {
//                         id: true,
//                         extraBeds: true,
//                         checkIn: true,
//                         checkOut: true,
//                         isCheckedOut: true,
//                         booking: {
//                             select: {
//                                 id: true,
//                                 bookingstatus: true
//                             }
//                         }
//                     }
//                 }
//             }
//         })

//         // Extra-bed config (unchanged)
//         const extraBed = await prisma.extraBed.findFirst()
//         const extraBedPrice = extraBed ? Number(extraBed.price).toFixed(2) : '0.00'

//         // Format the response
//         const formattedRooms = rooms.map(room => {
//             const isBooked = room.bookingRooms.length > 0
//             const hasBooking = room.bookingRooms.length > 0
//             const isRequest = hasBooking && room.bookingRooms.some(br => br.booking.bookingstatus === 2)
//             return {
//                 id: room.id,
//                 roomNumber: room.roomNumber,
//                 roomName: room.type.name,
//                 floorName: room.floor.name,
//                 online_acPrice: room.online_acPrice,
//                 online_nonAcPrice: room.online_nonAcPrice,
//                 status: hasBooking
//                     ? isRequest
//                         ? 'REQUEST'
//                         : 'BOOKED'
//                     : 'AVAILABLE',
//                 acPrice: Number(room.acPrice).toFixed(2),
//                 nonAcPrice: Number(room.nonAcPrice).toFixed(2),
//                 extraBedPrice,
//                 occupancy: room.occupancy,
//                 bookingDetails: isBooked
//                     ? room.bookingRooms.map(br => ({
//                         checkIn: br.checkIn,
//                         checkOut: br.checkOut,
//                         isCheckedOut: br.isCheckedOut,
//                         bookingClosed: br.booking.bookingstatus,
//                         bookingStatus: br.booking.bookingstatus,
//                         overstay:
//                             isToday && !br.isCheckedOut && br.checkOut <= formattedCheckInDate
//                     }))
//                     : []
//             }
//         })
//         return NextResponse.json(formattedRooms, { status: 200 })
//     } catch (error) {
//         console.error('Error fetching rooms:', error)
//         return NextResponse.json(
//             {
//                 message: 'Server error',
//                 error: error instanceof Error ? error.message : 'Unknown error'
//             },
//             { status: 500 }
//         )
//     } finally {
//         await prisma.$disconnect()
//     }
// }

import { prisma } from '@/libs/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const checkInDateTimeStr = searchParams.get('checkInDateTime');

        if (!checkInDateTimeStr) {
            return NextResponse.json({ message: 'checkInDateTime is required' }, { status: 400 });
        }

        const checkInDateTime = new Date(checkInDateTimeStr);

        if (isNaN(checkInDateTime.getTime())) {
            return NextResponse.json({ message: 'Invalid datetime format' }, { status: 400 });
        }

        // Normalize requestedMoment (same as first API)
        const requestedMoment = new Date(
            Date.UTC(
                checkInDateTime.getUTCFullYear(),
                checkInDateTime.getUTCMonth(),
                checkInDateTime.getUTCDate(),
                checkInDateTime.getUTCHours() || 0,
                checkInDateTime.getUTCMinutes() || 0,
                checkInDateTime.getUTCSeconds() || 0
            )
        )
        // Fetch all active rooms
        const allRooms = await prisma.room.findMany({
            where: { status: true },
            include: { type: true, floor: true }
        })

        // Fetch overlapping bookings
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

        // Fetch future bookings within 24h
        const futureBookingsSoon = await prisma.booking.findMany({
            where: {
                bookedRooms: {
                    some: {
                        checkIn: {
                            gt: requestedMoment,
                            lte: new Date(requestedMoment.getTime() + 24 * 60 * 60 * 1000)
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

        // Build occupancy map
        const occupiedMap = new Map<number, { checkIn: Date; checkOut: Date }>()
        for (const booking of overlappingBookings) {
            for (const br of booking.bookedRooms) {
                if (!br.isCheckedOut) {
                    occupiedMap.set(br.roomId, { checkIn: br.checkIn, checkOut: br.checkOut })
                }
            }
        }
        for (const booking of futureBookingsSoon) {
            for (const br of booking.bookedRooms) {
                if (!br.isCheckedOut && !occupiedMap.has(br.roomId)) {
                    occupiedMap.set(br.roomId, { checkIn: br.checkIn, checkOut: br.checkOut })
                }
            }
        }

        // Extra bed config
        const extraBed = await prisma.extraBed.findFirst()
        const extraBedPrice = extraBed ? Number(extraBed.price).toFixed(2) : '0.00'

        // Build final response per room
        const formattedRooms = allRooms.map(room => {
            const bookingInfo = occupiedMap.get(room.id)
            const status = bookingInfo
                ? bookingInfo.checkIn > requestedMoment
                    ? 'BLOCKED' // has upcoming booking within 24h
                    : 'BOOKED'  // currently occupied
                : 'AVAILABLE'

            return {
                id: room.id,
                roomNumber: room.roomNumber,
                roomName: room.type.name,
                floorName: room.floor.name,
                online_acPrice: room.online_acPrice,
                online_nonAcPrice: room.online_nonAcPrice,
                acPrice: Number(room.acPrice).toFixed(2),
                nonAcPrice: Number(room.nonAcPrice).toFixed(2),
                extraBedPrice,
                occupancy: room.occupancy,
                status,
                expectedCheckIn: bookingInfo?.checkIn || null,
                expectedCheckout: bookingInfo?.checkOut || null
            }
        })

        return NextResponse.json(formattedRooms, { status: 200 })
    } catch (error) {
        console.error('Error fetching rooms:', error)
        return NextResponse.json(
            {
                message: 'Server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}
