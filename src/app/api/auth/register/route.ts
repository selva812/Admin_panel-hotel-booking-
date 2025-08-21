import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/libs/auth'
const prisma = new PrismaClient()
export async function POST(req: Request) {
  try {
    console.log('Registration request received')
    const body = await req.text()
    console.log('Raw request body:', body)
    const jsonBody = JSON.parse(body)
    console.log('Parsed JSON body:', jsonBody)
    const { name, email, password, phone, address } = jsonBody
    console.log('Extracted fields:', { name, email, password: '***', phone, address })

    // Validate required fields
    if (!name || !email || !password || !phone || !address) {
      console.error('Missing required fields:', { name, email, password: !!password })
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
    }

    // Check for existing user
    console.log('Checking for existing user with email:', email)
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { name }, { phone }]
        }
      })
      if (existingUser) {
        console.error('Email already exists:', email)
        return NextResponse.json({ message: 'Email already in use' }, { status: 400 })
      }
    } catch (prismaError) {
      console.error('Prisma findUnique error:', prismaError)
      throw new Error('Database query failed')
    }

    // Hash password
    console.log('Hashing password...')
    let hashedPassword
    try {
      hashedPassword = await hashPassword(password)
      console.log('Password hashed successfully')
    } catch (hashError) {
      console.error('Password hashing failed:', hashError)
      return NextResponse.json({ message: 'Password processing failed' }, { status: 500 })
    }

    // Create user
    console.log('Creating user with data:', {
      name,
      email,
      password: '***',
      phone,
      address
    })

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          address
        }
      })

      console.log('User created successfully:', { id: user.id, email: user.email })
      return NextResponse.json(
        { message: 'User registered successfully', user: { id: user.id, email: user.email } },
        { status: 201 }
      )
    } catch (createError) {
      console.error('User creation failed:', createError)
      return NextResponse.json(
        {
          message: 'User creation failed',
          error: createError instanceof Error ? createError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Registration process failed:')
    console.error('Error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
    console.log('Prisma connection closed')
  }
}
