import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET as string
function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, JWT_SECRET) as { id: number; role: string }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phonenumber, address } = body

    // Validate required fields
    if (!name || !phonenumber) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 })
    }

    // Check if vendor with this phone number already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { phonenumber }
    })

    if (existingVendor) {
      return NextResponse.json({ error: 'Vendor with this phone number already exists' }, { status: 400 })
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        phonenumber,
        address: address || undefined
      }
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error('Vendor creation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create vendor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
