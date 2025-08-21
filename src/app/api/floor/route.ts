import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const floors = await prisma.floornumber.findMany({
      orderBy: {
        id: 'asc' // Sort by ID in ascending order
      }
    })

    return NextResponse.json({ data: floors }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch Floors' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    const newRoomType = await prisma.roomtype.create({
      data: { name }
    })
    return NextResponse.json({ message: 'Room Type Added', newRoomType }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to add room type' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await prisma.roomtype.delete({
      where: { id: Number(id) }
    })
    return NextResponse.json({ message: 'Room Type Deleted' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete room type' }, { status: 500 })
  }
}
