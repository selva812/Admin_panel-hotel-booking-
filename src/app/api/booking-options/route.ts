// app/api/booking-options/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch both lists in parallel
    const [purposes, bookingTypes] = await Promise.all([
      prisma.purposeOfVisit.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.bookingType.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ])

    return NextResponse.json(
      {
        purposes,
        bookingTypes
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching booking options:', error)
    return NextResponse.json(
      { message: 'Failed to fetch booking options', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
