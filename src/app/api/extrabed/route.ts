// app/api/extrabeds/price/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const extraBeds = await prisma.extraBed.findMany({
      select: {
        id: true,
        price: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!extraBeds || extraBeds.length === 0) {
      return NextResponse.json({ message: 'No extra bed prices found' }, { status: 404 })
    }

    // Convert Decimal to string for safe serialization
    const formattedExtraBeds = extraBeds.map(bed => ({
      ...bed,
      price: bed.price.toString()
    }))

    return NextResponse.json(formattedExtraBeds)
  } catch (error) {
    console.error('Error fetching extra bed prices:', error)
    return NextResponse.json({ message: 'Failed to fetch extra bed prices' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
