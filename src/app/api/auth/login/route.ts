// /app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { comparePassword } from '@/libs/auth'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET as string

export async function POST(req: Request) {
  try {
    const { emailOrUsername, password } = await req.json()
    if (!emailOrUsername || !password) {
      return NextResponse.json({ message: 'Email or username and password are required' }, { status: 400 })
    }

    // Determine if it's an email (basic check)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrUsername)

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

    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

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

    return NextResponse.json({ message: 'Login successful', user: safeUser, token })
  } catch (error: any) {
    return NextResponse.json({ message: 'Authentication failed', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
