// app/api/dashboard/bookings-chart/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const today = new Date()
    const dates = []
    const bookingCounts = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
      // Format date for query
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      // Count bookings for this day
      const count = await prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
      dates.push(formattedDate)
      bookingCounts.push(count)
    }

    return NextResponse.json({
      labels: dates,
      bookingCounts
    })
  } catch (error) {
    console.error('Failed to fetch booking chart data:', error)
    return NextResponse.json({ error: 'Failed to fetch booking chart data' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
