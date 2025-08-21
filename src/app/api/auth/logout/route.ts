import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getTokenFromRequest } from '@/utils/auth' // util you'll define

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payloadBase64 = token.split('.')[1]
    const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf8')
    const payload = JSON.parse(decodedPayload)
    const userId = payload.id

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastLogout: new Date() }
    })

    await prisma.userActivityLog.create({
      data: {
        userId,
        type: 0
      }
    })

    return NextResponse.json({ message: 'Logout successful' })
  } catch (err: any) {
    console.error('Logout error:', err.message)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
