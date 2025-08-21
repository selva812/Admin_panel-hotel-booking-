// app/api/dashboard/room-types/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get all room types with their counts
    const roomTypes = await prisma.roomtype.findMany({
      include: {
        _count: {
          select: { rooms: true }
        }
      }
    })

    // Format data for chart
    const labels = roomTypes.map(type => type.name)
    const counts = roomTypes.map(type => type._count.rooms)

    return NextResponse.json({ labels, counts })
  } catch (error) {
    console.error('Failed to fetch room type data:', error)
    return NextResponse.json({ error: 'Failed to fetch room type data' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
