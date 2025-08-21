import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/libs/services/bookingservice'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, newCheckoutDate } = body

    if (!bookingId || !newCheckoutDate) {
      return NextResponse.json({ message: 'Booking ID and new checkout date are required' }, { status: 400 })
    }

    const date = new Date(newCheckoutDate)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ message: 'Invalid date format. Please use ISO format (YYYY-MM-DD)' }, { status: 400 })
    }

    const updatedBooking = await BookingService.extendBooking(bookingId, date)

    return NextResponse.json({
      message: 'Booking extended successfully',
      booking: updatedBooking
    })
  } catch (error: any) {
    console.error('Error extending booking:', error)
    return NextResponse.json({ message: 'Failed to extend booking', error: error.message }, { status: 500 })
  }
}
