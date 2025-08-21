// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
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

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest) {
  try {
    // First validate the user ID before anything else
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('id')
    if (!userId || userId === 'null' || userId === 'undefined') {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    const id = parseInt(userId)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 })
    }

    // Then verify admin token
    const user = verifyToken(request)
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Fetch user data
    const userData = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        phone: true,
        createdAt: true,
        lastLogin: true,
        lastLogout: true,
        isOnline: true
      }
    })

    if (!userData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
// export async function PUT(request: NextRequest) {
//   try {
//     // First validate the user ID before anything else
//     const searchParams = request.nextUrl.searchParams
//     const userId = searchParams.get('id')
//     if (!userId || userId === 'null' || userId === 'undefined') {
//       return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
//     }

//     const id = parseInt(userId)
//     if (isNaN(id)) {
//       return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 })
//     }

//     // Then verify admin token
//     const user = verifyToken(request)
//     if (user.role !== 'ADMIN') {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
//     }

//     const body = await request.json()
//     const { name, email, role, address, phone, password } = body

//     // Validate required fields
//     if (!name || !email || !role || !address || !phone) {
//       return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//     if (!emailRegex.test(email)) {
//       return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
//     }

//     // Validate role
//     if (!['STAFF', 'ADMIN', 'MANAGER'].includes(role)) {
//       return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
//     }

//     // Validate password if provided
//     if (password && password.length < 6) {
//       return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 })
//     }

//     // Check if user exists
//     const existingUser = await prisma.user.findUnique({
//       where: { id: id }
//     })

//     if (!existingUser) {
//       return NextResponse.json({ message: 'User not found' }, { status: 404 })
//     }

//     // Check if email or phone is already taken by another user
//     const duplicateCheck = await prisma.user.findFirst({
//       where: {
//         AND: [
//           { id: { not: id } },
//           {
//             OR: [{ email: email }, { phone: phone }]
//           }
//         ]
//       }
//     })

//     if (duplicateCheck) {
//       if (duplicateCheck.email === email) {
//         return NextResponse.json({ message: 'Email already exists' }, { status: 400 })
//       }
//       if (duplicateCheck.phone === phone) {
//         return NextResponse.json({ message: 'Phone number already exists' }, { status: 400 })
//       }
//     }

//     // Prepare update data
//     const updateData: any = {
//       name,
//       email,
//       role,
//       address,
//       phone
//     }

//     // Hash password if provided
//     if (password && password.trim() !== '') {
//       const saltRounds = 12
//       updateData.password = await bcrypt.hash(password, saltRounds)
//     }

//     // Update user
//     const updatedUser = await prisma.user.update({
//       where: { id: id },
//       data: updateData,
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         address: true,
//         phone: true,
//         createdAt: true,
//         lastLogin: true,
//         lastLogout: true,
//         isOnline: true
//       }
//     })

//     return NextResponse.json({
//       message: 'User updated successfully',
//       user: updatedUser
//     })
//   } catch (error) {
//     console.error('Error updating user:', error)

//     // Handle Prisma unique constraint errors
//     if (error instanceof Error && error.message.includes('Unique constraint')) {
//       if (error.message.includes('email')) {
//         return NextResponse.json({ message: 'Email already exists' }, { status: 400 })
//       }
//       if (error.message.includes('phone')) {
//         return NextResponse.json({ message: 'Phone number already exists' }, { status: 400 })
//       }
//     }

//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
//   }
// }

export async function PUT(request: NextRequest) {
  try {
    // Validate user ID
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('id')

    if (!userId || userId === 'null' || userId === 'undefined') {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    const id = parseInt(userId)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 })
    }

    // Verify admin token
    const user = verifyToken(request)
    if (!user.role) {
      // role is boolean in your model
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { name, email, role, address, phone, password } = body

    // Validate required fields
    if (!name || !email || !address || !phone) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check for duplicate email or phone
    const duplicateCheck = await prisma.user.findFirst({
      where: {
        NOT: { id },
        OR: [{ email }, { phone }]
      }
    })

    if (duplicateCheck) {
      if (duplicateCheck.email === email) {
        return NextResponse.json({ message: 'Email already exists' }, { status: 400 })
      }
      if (duplicateCheck.phone === phone) {
        return NextResponse.json({ message: 'Phone number already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role,
      address,
      phone
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        phone: true,
        createdAt: true,
        lastLogin: true,
        lastLogout: true,
        isOnline: true,
        status: true
      }
    })

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[]
        if (target.includes('email')) {
          return NextResponse.json({ message: 'Email already exists' }, { status: 400 })
        }
        if (target.includes('phone')) {
          return NextResponse.json({ message: 'Phone number already exists' }, { status: 400 })
        }
        if (target.includes('name')) {
          return NextResponse.json({ message: 'Name already exists' }, { status: 400 })
        }
      }
      return NextResponse.json({ message: 'Database error: ' + error.message }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
