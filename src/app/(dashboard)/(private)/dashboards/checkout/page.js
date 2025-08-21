'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TransparentLoader } from '@/components/transparent'
//export const dynamic = 'force-dynamic'
export default function CheckoutPage() {
  const [activeBookings, setActiveBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const router = useRouter()
  useEffect(() => {
    async function fetchActiveBookings() {
      try {
        const response = await fetch('/api/checkout/active-bookings')
        const result = await response.json()

        if (result.success) {
          setActiveBookings(result.data)
          console.log('result', result.data)
        } else {
          setError(result.error || 'Failed to load active bookings')
        }
      } catch (err) {
        setError('An error occurred while fetching active bookings')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchActiveBookings()
  }, [])

  const refreshBookings = async () => {
    try {
      // Refresh active bookings list
      const bookingsResponse = await fetch('/api/checkout/active-bookings')
      const bookingsResult = await bookingsResponse.json()

      if (bookingsResult.success) {
        setActiveBookings(bookingsResult.data)

        // Refresh billing data if a booking is currently selected
        if (selectedBookingId) {
          try {
            setBillingLoading(true)
            const billingResponse = await fetch(`/api/checkout/billing?bookingId=${selectedBookingId}`)
            const billingResult = await billingResponse.json()

            if (billingResult.success) {
              setBillingData(billingResult.data)
            } else {
              setBillingError(billingResult.error || 'Failed to refresh billing details')
            }
          } catch (billingErr) {
            setBillingError('Error refreshing billing data')
            console.error(billingErr)
          } finally {
            setBillingLoading(false)
          }
        }
      } else {
        setError(bookingsResult.error || 'Failed to refresh bookings')
      }
    } catch (err) {
      setError('Error refreshing bookings')
      console.error(err)
    }
  }

  if (loading) {
    return <TransparentLoader />
  }

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-red-500 text-xl'>{error}</div>
      </div>
    )
  }

  const formatCurrency = amount => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value)
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    // <Suspense fallback={<p>Loading search params...</p>}>
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Active Rooms</h1>

      {activeBookings.length === 0 ? (
        <div className='text-center text-gray-500 text-sm py-10'>🚫 There are no room checkin at the moment.</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {activeBookings.map(booking => (
            <div
              key={booking.id}
              className='bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer p-5 relative'
              onClick={() => {
                setLoading(true)
                router.push(`/dashboards/checkout/details?id=${booking.id}`)
                setSelectedBookingId(booking.id)
              }}
            >
              {/* Header */}
              <div className='flex justify-between items-center mb-3'>
                <h2 className='text-lg font-semibold text-gray-800'>{booking.customer.name}</h2>
                <span className='bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full'>
                  {booking.bookedRooms.length} Room{booking.bookedRooms.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Contact */}
              <p className='text-sm text-gray-500 mb-2 flex items-center'>
                📞 <span className='ml-1'>{booking.customer.phoneNumber}</span>
              </p>

              {/* Dates */}
              <div className='flex justify-between items-center text-xs text-gray-600 mb-4'>
                <div className='flex flex-col'>
                  <span className='font-medium text-gray-700'>Check-in</span>
                  <span>{formatDate(booking.bookedRooms[0].checkIn)}</span>
                </div>
                <div className='border-l border-gray-300 h-6 mx-2' />
                <div className='flex flex-col'>
                  <span className='font-medium text-gray-700'>Check-out</span>
                  <span>{formatDate(booking.bookedRooms[0].checkOut)}</span>
                </div>
              </div>

              {/* Rooms */}
              <div className='space-y-2 border-t border-dashed pt-3 mt-2'>
                {booking.bookedRooms.map(room => (
                  <div key={room.id} className='flex justify-between text-sm text-gray-700'>
                    <div>
                      <span className='font-medium'>Room {room.room.roomNumber}</span>{' '}
                      <span className='text-gray-500 text-xs'>({room.room.type.name})</span>
                    </div>
                    <span className='text-green-600 font-medium'>{formatCurrency(room.bookedPrice)}/night</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    //</Suspense>
  )
}
