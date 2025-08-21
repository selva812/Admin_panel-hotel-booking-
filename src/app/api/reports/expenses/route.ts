// app/api/reports/expenses/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')

    const whereClause: any = {
      entrytype: false, // Only expenses (not income)
      status: 1 // Only active records
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId)
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2))

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

    // Get expense categories for summary
    const categoryBreakdown = await prisma.expenseCategory.findMany({
      include: {
        expenses: {
          where: whereClause
        }
      }
    })

    const summary = {
      totalExpenses: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
      totalTransactions: expenses.length,
      averageExpense:
        expenses.length > 0 ? expenses.reduce((sum, expense) => sum + Number(expense.amount), 0) / expenses.length : 0,
      categoryBreakdown: categoryBreakdown.map(category => ({
        id: category.id, // <-- now each breakdown has the category ID
        name: category.name,
        total: category.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
        count: category.expenses.length
      }))
    }

    return NextResponse.json({
      expenses,
      summary
    })
  } catch (error) {
    console.error('Error fetching expense reports:', error)
    return NextResponse.json({ error: 'Failed to fetch expense reports' }, { status: 500 })
  }
}
