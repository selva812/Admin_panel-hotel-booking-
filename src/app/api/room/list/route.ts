// File: app/api/rooms/active/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const activeRooms = await prisma.room.findMany({
      where: {
        status: true
      },
      select: {
        id: true,
        roomNumber: true,
        type: true
      },
      orderBy: {
        roomNumber: 'asc'
      }
    })

    return NextResponse.json(activeRooms)
  } catch (error) {
    console.error('Error fetching active rooms:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
