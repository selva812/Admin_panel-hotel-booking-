// /app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET as string

function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, JWT_SECRET) as { id: number; role: string }
}

export async function GET(req: NextRequest) {
  try {
    const user = verifyToken(req)
    console.log('Authenticated user:', user)
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        phone: true,
        createdAt: true
      }
    })
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ message: 'Unauthorized', error: error.message }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await prisma.$connect()

    // Verify admin token
    const user = verifyToken(req)
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Parse and validate input
    const { name, email, password, role, address, phone } = await req.json()

    // Validate required fields
    if (!name || !email || !password || role === undefined || !address || !phone) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        address,
        phone
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        phone: true,
        createdAt: true
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)

    // Handle Prisma errors specifically
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[]
        if (target.includes('email')) {
          return NextResponse.json({ message: 'Email already exists' }, { status: 400 })
        }
        if (target.includes('phone')) {
          return NextResponse.json({ message: 'Phone number already exists' }, { status: 400 })
        }
      }
      return NextResponse.json({ message: 'Database error: ' + error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Error creating user', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
