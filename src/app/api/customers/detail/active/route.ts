import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const customerId = parseInt(searchParams.get('id') || '')
  if (isNaN(customerId)) {
    return NextResponse.json({ message: 'Invalid customer ID' }, { status: 400 })
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        customerId,
        bookingstatus: 1
      },
      include: {
        bookedRooms: {
          include: {
            room: {
              include: { type: true }
            }
          }
        }
      }
    })
    console.log('active booking', bookings)
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching active bookings:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
