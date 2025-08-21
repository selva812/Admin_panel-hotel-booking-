import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('id')

    // Validate and convert categoryId to number
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const categoryIdNum = parseInt(categoryId)
    if (isNaN(categoryIdNum)) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
    }

    const whereClause: any = {
      entrytype: false,
      status: 1,
      categoryId: categoryIdNum // Using the converted number
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        recorder: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryIdNum } // Using the converted number
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({
      category,
      expenses
    })
  } catch (error) {
    console.error('Error fetching category expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch category expenses' }, { status: 500 })
  }
}
