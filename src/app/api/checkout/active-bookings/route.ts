// app/api/checkout/active-bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get active bookings with their rooms
    const activeBookings = await prisma.booking.findMany({
      where: {
        bookingstatus: 1,
        bookedRooms: {
          some: {
            checkIn: {
              lte: new Date() // only include bookings that have at least one room already checked in
            }
          }
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        bookedRooms: {
          where: {
            checkIn: {
              lte: new Date() // ensure only already checked-in rooms are included
            }
          },
          include: {
            room: {
              select: {
                id: true,
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
        services: true
      }
    })

    return NextResponse.json({
      success: true,
      data: activeBookings
    })
  } catch (error) {
    console.error('Error fetching active bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch active bookings' }, { status: 500 })
  }
}
