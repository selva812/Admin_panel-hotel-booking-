// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('id')

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 })
    }

    const parsedId = parseInt(customerId)

    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, message: 'Invalid customer ID' }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: parsedId
      }
    })

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        picture: customer.picture,
        idNumber: customer.idNumber,
        gst_no: customer.gst_no,
        idPicture: customer.idPicture,
        address: customer.address,
        companyName: customer.companyName,
        createdAt: customer.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
