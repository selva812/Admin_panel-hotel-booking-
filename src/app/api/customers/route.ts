import { NextRequest, NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
import path from 'path'
import { writeFile } from 'fs/promises'
import fs from 'fs'
import { randomBytes } from 'crypto'
const prisma = new PrismaClient()
const uploadDir = path.join(process.cwd(), 'public/uploads')

// Ensure upload dir exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Helper: Save file and return filename

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
// GET: Fetch all customers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Validate pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))
    const skip = (page - 1) * limit
    const searchTerm = searchParams.get('phone')?.trim() || ''

    // Build safe where clause
    const where: Prisma.customerWhereInput = {}

    if (searchTerm) {
      where.OR = [
        {
          phoneNumber: {
            contains: searchTerm
          }
        },
        {
          name: {
            contains: searchTerm.toLowerCase() // Convert to lowercase for case-insensitive
          }
        }
      ]
    }

    // Transaction with error handling
    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          picture: true,
          address: true,
          companyName: true,
          createdAt: true,
          status: true
        }
      }),
      prisma.customer.count({ where })
    ])

    return NextResponse.json(
      {
        data: customers || [],
        pagination: {
          total: total || 0,
          currentPage: page,
          totalPages: Math.ceil((total || 0) / limit)
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      {
        message: 'Error fetching customers',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
// POST: Create new customer
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const phoneNumber = formData.get('phone') as string
    const address = formData.get('address') as string | null
    const companyName = formData.get('company') as string | null
    const gst_no = formData.get('gstno') as string | null
    const idNumber = formData.get('idProofNumber') as string | null

    if (!name || !phoneNumber) {
      return NextResponse.json({ message: 'Name and phone are required' }, { status: 400 })
    }

    const idPicture = await saveFile(formData.get('adhaarPicture') as File | null)
    const picture = await saveFile(formData.get('profilePicture') as File | null)
    const oldcustomer = await prisma.customer.findUnique({ where: { phoneNumber: phoneNumber } })
    if (oldcustomer) {
      console.log('customer already exist')
      return NextResponse.json({ message: 'Customer already exist' }, { status: 409 })
    }
    const newCustomer = await prisma.customer.create({
      data: { name, phoneNumber, address, companyName, idPicture, picture, idNumber, gst_no }
    })

    return NextResponse.json({ message: 'Customer added', customer: newCustomer }, { status: 200 })
  } catch (error) {
    console.error('Create Error:', error)
    return NextResponse.json({ message: 'Error creating customer', error }, { status: 500 })
  }
}

// PUT: Update customer
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData()
    const id = Number(formData.get('id'))
    const name = formData.get('name') as string
    const phoneNumber = formData.get('phone') as string // Changed from 'phone' to match POST
    const address = formData.get('address') as string | null
    const companyName = formData.get('company') as string | null // Changed from 'company'
    const idNumber = formData.get('idProofNumber') as string | null // Added missing field
    const gst_no = formData.get('gstno') as string | null
    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 })
    }

    // Check if customer exists first
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    // Handle file uploads - use same field names as POST
    const idPictureFile = formData.get('adhaarPicture') as File | null
    const pictureFile = formData.get('profilePicture') as File | null

    const updateData: any = {
      name,
      phoneNumber, // Match POST field name
      address,
      companyName, // Match POST field name
      idNumber, // Added missing field
      gst_no
    }

    // Only update files if new ones are provided
    if (idPictureFile) {
      updateData.idPicture = await saveFile(idPictureFile)
      // TODO: Consider deleting old file
    }

    if (pictureFile) {
      updateData.picture = await saveFile(pictureFile)
      // TODO: Consider deleting old file
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(
      {
        message: 'Customer updated successfully',
        customer: updatedCustomer
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update Error:', error)
    return NextResponse.json({ message: 'Error updating customer', error }, { status: 500 })
  }
}

// DELETE: Delete customer
// export async function DELETE(req: Request) {
//   try {
//     const { id } = await req.json()
//     await prisma.customer.delete({ where: { id: Number(id) } })
//     return NextResponse.json({ message: 'Customer deleted' }, { status: 200 })
//   } catch (error) {
//     return NextResponse.json({ message: 'Error deleting customer', error }, { status: 500 })
//   }
// }
