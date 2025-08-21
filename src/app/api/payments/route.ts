import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const payments = await prisma.payment.findMany({
      where: {
        bookingId: parseInt(bookingId)
      },
      include: {
        bill: true,
        booking: {
          select: {
            bookingref: true,
            customer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        bookingRef: payments[0]?.booking?.bookingref,
        customerName: payments[0]?.booking?.customer?.name,
        payments
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
