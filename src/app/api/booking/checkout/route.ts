import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/libs/services/bookingservice'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 })
    }

    // Process checkout
    const updatedBooking = await BookingService.checkoutBooking(bookingId)

    return NextResponse.json({
      message: 'Checkout processed successfully',
      booking: updatedBooking
    })
  } catch (error: any) {
    console.error('Error during checkout:', error)
    return NextResponse.json({ message: 'Failed to process checkout', error: error.message }, { status: 500 })
  }
}
