import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const searchTerm = searchParams.get('phone') || searchParams.get('searchTerm') || ''
    const normalizedSearchTerm = searchTerm.toLowerCase()

    if (!searchTerm) {
      return NextResponse.json(
        { message: 'Search parameter is required (use "phone" or "searchTerm")' },
        { status: 400 }
      )
    }

    // Get all customers and filter in JavaScript
    const allCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        companyName: true
      }
    })

    // Filter with case-insensitive matching
    const filteredCustomers = allCustomers
      .filter(
        customer =>
          customer.phoneNumber.toLowerCase().includes(normalizedSearchTerm) ||
          customer.name.toLowerCase().includes(normalizedSearchTerm)
      )
      .slice(0, 10) // Limit to 5 results

    return NextResponse.json(filteredCustomers, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error searching customers', error: (error as Error).message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
