import { NextRequest, NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'
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
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')
    console.log(id, typeof id)
    if (!id || isNaN(id)) {
      return NextResponse.json({ message: 'Valid ID is required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: true
      }
    })

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking, { status: 200 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: 'Error fetching booking details', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[DEBUG] Starting refund processing')

    // Verify user authentication
    const user = verifyToken(req)
    if (!user) {
      console.log('[DEBUG] Unauthorized - no valid user token')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }
    console.log(`[DEBUG] Authorized user ID: ${user.id}`)

    // Parse request body
    const body = await req.json()
    console.log('[DEBUG] Request body:', JSON.stringify(body, null, 2))

    const { bookingId, refundAmount, refundMethod, transaction } = body

    // Validate required fields
    if (!bookingId || refundAmount === undefined || refundMethod === undefined) {
      console.log('[DEBUG] Missing required fields:', {
        bookingId,
        refundAmount,
        refundMethod,
        transaction
      })
      return NextResponse.json(
        { message: 'Missing required fields (bookingId, refundAmount, refundMethod)' },
        { status: 400 }
      )
    }

    // Validate refund amount is positive
    if (Number(refundAmount) <= 0) {
      console.log('[DEBUG] Invalid refund amount:', refundAmount)
      return NextResponse.json({ message: 'Refund amount must be greater than 0' }, { status: 400 })
    }

    console.log('[DEBUG] Starting database transaction')
    const result = await prisma.$transaction(async tx => {
      // 1. Verify booking exists and belongs to user
      console.log(`[DEBUG] Looking up booking with ID: ${bookingId}`)
      const booking = await tx.booking.findUnique({
        where: { id: Number(bookingId) },
        include: {
          payments: {
            where: {
              status: true, // Only active payments
              amount: { gt: 0 } // Only positive payments (not refunds)
            },
            orderBy: {
              date: 'desc' // Process most recent payments first
            }
          }
        }
      })

      if (!booking) {
        console.log('[DEBUG] Booking not found')
        throw new Error('Booking not found')
      }

      if (booking.userId !== user.id) {
        console.log('[DEBUG] Unauthorized - booking user ID does not match token user ID')
        throw new Error('Unauthorized to process refund for this booking')
      }

      // 2. Check if there are any payments to refund
      if (!booking.payments || booking.payments.length === 0) {
        console.log('[DEBUG] No active payments found for booking')
        throw new Error('No active payments found for this booking')
      }

      // 3. Calculate total available amount for refund
      const totalPayableAmount = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

      if (Number(refundAmount) > totalPayableAmount) {
        console.log('[DEBUG] Refund amount exceeds total payment amount', {
          refundAmount,
          totalPayableAmount
        })
        throw new Error('Refund amount cannot exceed total payments for this booking')
      }

      // 4. Process refund by creating negative payment record
      console.log('[DEBUG] Creating refund payment record')
      const refundPayment = await tx.payment.create({
        data: {
          bookingId: Number(bookingId),
          amount: new Prisma.Decimal(-Number(refundAmount)),
          method: Number(refundMethod),
          note: `Refund processed.`,
          isadvance: false,
          status: false,
          transactionid: `${transaction}`
        }
      })
      console.log('[DEBUG] Refund payment created:', refundPayment)

      // 5. Optionally mark original payments as refunded (if doing full refund)
      // This part is optional depending on your business logic
      let remainingRefund = Number(refundAmount)
      const updatedPayments = []

      for (const payment of booking.payments) {
        if (remainingRefund <= 0) break

        const paymentAmount = Number(payment.amount)
        const refundedAmount = Math.min(paymentAmount, remainingRefund)

        // Update payment note to indicate partial/full refund
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            note: `${payment.note || ''}\nRefunded ${refundedAmount} on ${new Date().toISOString()}`.trim(),
            // Optionally set status to false if fully refunded
            ...(refundedAmount >= paymentAmount ? { status: false } : {})
          }
        })

        updatedPayments.push(updatedPayment)
        remainingRefund -= refundedAmount
      }

      console.log('[DEBUG] Original payments updated:', updatedPayments)

      return {
        bookingId,
        refundPayment,
        updatedPayments,
        refundedAmount: refundAmount
      }
    })

    console.log('[DEBUG] Refund processed successfully')
    return NextResponse.json(
      {
        message: 'Refund processed successfully',
        data: result,
        status: 'REFUNDED'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DEBUG] Refund processing error:', error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Error processing refund',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
    console.log('[DEBUG] Prisma connection disconnected')
  }
}
