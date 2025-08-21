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

    // Get all vendors and filter in JavaScript
    const allVendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        phonenumber: true,
        address: true
      }
    })

    // Filter with case-insensitive matching
    const filteredVendors = allVendors
      .filter(
        vendor =>
          vendor.phonenumber.toLowerCase().includes(normalizedSearchTerm) ||
          vendor.name.toLowerCase().includes(normalizedSearchTerm)
      )
      .slice(0, 10)

    return NextResponse.json(filteredVendors, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error searching vendors', error: (error as Error).message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
