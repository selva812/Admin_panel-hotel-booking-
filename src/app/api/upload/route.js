import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

// This API handles file uploads for occupant photos and Aadhaar photos
export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const type = formData.get('type') // 'photo' or 'aadhaar'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!type || (type !== 'photo' && type !== 'aadhaar')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadDir, filename)

    // Save the file
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      filePath: `/uploads/${filename}`
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
  }
}
