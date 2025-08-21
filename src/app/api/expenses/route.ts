// import { prisma } from '@/libs/prisma'
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import path from 'path'
import fs from 'fs'

const uploadDir = path.join(process.cwd(), 'public', 'uploads')
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
})
const JWT_SECRET = process.env.JWT_SECRET as string
function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, JWT_SECRET) as { id: number; role: string }
}

const saveFile = async (file: File | null): Promise<string | null> => {
  if (!file) return null
  const shortId = randomBytes(4).toString('hex')
  const extension = file.name.split('.').pop() || ''
  const filename = `${Date.now()}-${shortId}.${extension}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = path.join(uploadDir, filename)
  await fs.promises.writeFile(filePath, buffer)
  return filename
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const user = verifyToken(request)

    // Parse values
    const description = formData.get('description')?.toString().trim()
    const categoryId = Number(formData.get('categoryId'))
    const amount = parseFloat(formData.get('amount') as string)
    const paymentMethod = parseInt(formData.get('paymentMethod') as string)
    const entrytype = formData.get('entrytype') === 'true'
    const transactionId = formData.get('transactionId')?.toString() || undefined
    const vendorid = Number(formData.get('vendorId'))
    const transactionDate = formData.get('transactionDate')?.toString()

    // Validate required fields
    if (!description) throw new Error('Description is required')
    if (!categoryId || isNaN(categoryId)) throw new Error('Category is required')
    if (!amount || isNaN(amount)) throw new Error('Amount is required and must be a number')
    if (!paymentMethod || isNaN(paymentMethod)) throw new Error('Payment method is required')
    if (!vendorid || isNaN(vendorid)) throw new Error('Vendor is required')
    if (!transactionDate) throw new Error('Transaction date is required')
    if (paymentMethod !== 1 && !transactionId)
      throw new Error('Transaction reference is required for non-cash payments')

    // Handle file upload
    let attachment: string | null = null
    const file = formData.get('file-upload') as File | null

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Attachment file size exceeds 2MB limit')
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF, JPG, and PNG files are allowed')
      }

      const savedFileName = (await saveFile(file)) || ''
      if (savedFileName.length > 255) {
        throw new Error('Attachment filename too long')
      }

      attachment = savedFileName
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        categoryId,
        amount,
        paymentMethod,
        entrytype,
        transactionId,
        vendorid,
        recordedBy: user.id,
        date: new Date(transactionDate),
        attachment: attachment || undefined
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Expense creation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create expense' },
      { status: 400 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Filter parameters
    const categoryId = searchParams.get('categoryId')
    const vendorId = searchParams.get('vendorId') // Added vendorId filter
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    // Pagination parameters
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      categoryId: categoryId ? Number(categoryId) : undefined,
      vendorid: vendorId ? Number(vendorId) : undefined, // Added vendor filter
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined
      },
      status: status ? Number(status) : undefined
      // Removed amount filters
    }

    // Get paginated results
    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          recorder: true,
          vendor: true
        },
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.expense.count({ where })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrevious = page > 1

    return NextResponse.json({
      data: expenses,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages,
        hasNext,
        hasPrevious
      }
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const user = verifyToken(request)

    // Parse values
    const id = Number(formData.get('id'))
    const description = formData.get('description')?.toString().trim()
    const categoryId = Number(formData.get('categoryId'))
    const amount = parseFloat(formData.get('amount') as string)
    const paymentMethod = parseInt(formData.get('paymentMethod') as string)
    const entrytype = formData.get('entrytype') === 'true'
    const transactionId = formData.get('transactionId')?.toString() || undefined
    const vendorid = Number(formData.get('vendorId'))
    const transactionDate = formData.get('transactionDate')?.toString()
    const removeAttachment = formData.get('removeAttachment') === 'true'

    // Validate required fields
    if (!id || isNaN(id)) throw new Error('Valid expense ID is required')
    if (!description) throw new Error('Description is required')
    if (!categoryId || isNaN(categoryId)) throw new Error('Category is required')
    if (!amount || isNaN(amount)) throw new Error('Amount is required and must be a number')
    if (!paymentMethod || isNaN(paymentMethod)) throw new Error('Payment method is required')
    if (!vendorid || isNaN(vendorid)) throw new Error('Vendor is required')
    if (!transactionDate) throw new Error('Transaction date is required')
    if (paymentMethod !== 1 && !transactionId) {
      throw new Error('Transaction reference is required for non-cash payments')
    }

    // Handle file upload/removal
    let attachment: string | null | undefined = undefined
    const file = formData.get('file-upload') as File | null

    if (removeAttachment) {
      attachment = null // Explicitly set to null to remove attachment
    } else if (file && file.size > 0) {
      // New file uploaded
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Attachment file size exceeds 2MB limit')
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF, JPG, and PNG files are allowed')
      }

      const savedFileName = (await saveFile(file)) || ''
      if (savedFileName.length > 255) {
        throw new Error('Attachment filename too long')
      }

      attachment = savedFileName
    }
    // If no file action, attachment remains undefined (won't be updated)

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        categoryId,
        amount,
        paymentMethod,
        entrytype,
        transactionId,
        vendorid,
        date: new Date(transactionDate),
        ...(attachment !== undefined && { attachment }) // Only update if explicitly set
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Expense update failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update expense' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Soft delete (set status to 0)
    const expense = await prisma.expense.update({
      where: { id: Number(id) },
      data: { status: 0 }
    })

    return NextResponse.json({
      message: 'Expense deactivated successfully',
      expense
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate expense' }, { status: 400 })
  }
}
