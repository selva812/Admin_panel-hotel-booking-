// /app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { comparePassword } from '@/libs/auth'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET as string

export async function POST(req: Request) {
  console.log('Auth API called')
  try {
    const body = await req.json()
    console.log('Request body:', body)

    const { emailOrUsername, password } = body
    if (!emailOrUsername || !password) {
      console.log('Missing credentials')
      return NextResponse.json({ message: 'Email or username and password are required' }, { status: 400 })
    }

    // Check if Prisma is connected
    try {
      await prisma.$connect()
      console.log('Database connected successfully')
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ message: 'Database connection failed', error: dbError.message }, { status: 500 })
    }

    const isEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+\$/.test(emailOrUsername)
    console.log(`Is email: ${isEmail}, value: ${emailOrUsername}`)

    const user = await prisma.user.findUnique({
      where: isEmail ? { email: emailOrUsername } : { name: emailOrUsername },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        lastLogin: true
      }
    })

    console.log(`User found: ${user ? user.id : 'None'}`)

    if (!user) {
      console.log('User not found')
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await comparePassword(password, user.password)
    console.log(`Password match: ${passwordMatch}`)

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined')
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role === 0 ? 'STAFF' : user.role === 1 ? 'ADMIN' : 'MANAGER',
        name: user.name,
        email: user.email
      },
      JWT_SECRET
    )

    const { password: _, ...safeUser } = user
    console.log('Login successful for user:', safeUser.email)

    return NextResponse.json({
      message: 'Login successful',
      user: safeUser,
      token
    })
  } catch (error: any) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      {
        message: 'Authentication failed',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
