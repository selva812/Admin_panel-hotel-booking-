// import { prisma } from '@/libs/prisma'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})
export async function GET() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json()

    const newCategory = await prisma.expenseCategory.create({
      data: {
        name,
        description,
        status: 1 // Default to active
      }
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json()

    const updatedCategory = await prisma.expenseCategory.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    // Soft delete (set status to 0)
    const deletedCategory = await prisma.expenseCategory.update({
      where: { id },
      data: { status: 0 }
    })

    return NextResponse.json({
      message: 'Category deactivated successfully',
      category: deletedCategory
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate category' }, { status: 400 })
  }
}
