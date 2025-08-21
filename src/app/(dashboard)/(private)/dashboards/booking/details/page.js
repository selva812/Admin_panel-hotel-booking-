'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TransparentLoader } from '@/components/transparent'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Building,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  DoorOpen,
  MessageSquare
} from 'lucide-react'
import { User, Phone, Building2, IdCard, History, MapPin } from 'lucide-react'
// export const dynamic = 'force-dynamic'
export default function BookingDetails() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const id = searchParams.get('id')
        if (!id) return

        const response = await fetch(`/api/booking/details?id=${id}`)
        if (!response.ok) throw new Error('Failed to fetch booking')
        const data = await response.json()
        console.log('data', data)
        setBooking(data)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [searchParams])
  if (loading) return <TransparentLoader />
  if (error) return <div className='p-6 text-center text-red-500'>{error}</div>
  if (!booking) return <div className='p-6 text-center'>Booking not found</div>

  // Helper function to safely format dates
  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-IN')
    } catch {
      return 'Invalid Date'
    }
  }

  // Helper function to safely format times
  const formatTime = dateString => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return isNaN(date) ? 'Invalid Time' : date.toLocaleTimeString('en-IN')
    } catch {
      return 'Invalid Time'
    }
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8'>
        <button
          onClick={() => router.back()}
          className='p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105'
        >
          <ArrowLeft size={24} className='text-gray-600' />
        </button>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold text-gray-800'>Booking #{booking?.bookingref}</h1>
          <div className='flex items-center gap-2 mt-2'>
            {booking?.activated !== undefined && (
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  booking.activated ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {booking.activated ? 'Active' : 'Upcoming'}
              </span>
            )}
            {booking?.createdAt && (
              <span className='text-sm text-gray-500'>Created {formatDate(booking.createdAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Customer Card */}
      {booking?.customer && (
        <div className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100'>
          <div className='flex flex-col md:flex-row items-center gap-6'>
            {/* Customer Avatar */}
            <div className='relative group'>
              {booking.customer?.picture ? (
                <img
                  src={`/uploads/${booking.customer.picture}`}
                  alt='Customer'
                  className='w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105'
                />
              ) : (
                <div className='w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-4xl font-bold text-gray-600 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105'>
                  {booking.customer?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className='space-y-3 flex-1'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
                    <User className='text-blue-500' size={20} />
                    {booking.customer?.name || 'Unknown Customer'}
                  </h2>

                  <div className='flex flex-wrap items-center gap-4 mt-3'>
                    {booking.customer?.phone && (
                      <div className='flex items-center gap-2 text-gray-700'>
                        <div className='flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md'>
                          <Phone className='text-blue-500' size={16} />
                          <span className='text-md font-medium text-gray-500'>Phone:</span>
                          <span className='font-medium'>{booking.customer.phone}</span>
                        </div>
                      </div>
                    )}

                    {booking.customer?.companyName && (
                      <div className='flex items-center gap-2 text-gray-700'>
                        <div className='flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md'>
                          <Building2 className='text-purple-500' size={16} />
                          <span className='text-md font-medium text-gray-500'>Company:</span>
                          <span className='font-medium'>{booking.customer.companyName}</span>
                        </div>
                      </div>
                    )}

                    {booking.customer?.idNumber && (
                      <div className='flex items-center gap-2 text-gray-700'>
                        <div className='flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md'>
                          <IdCard className='text-green-500' size={16} />
                          <span className='text-md font-medium text-gray-500'>ID:</span>
                          <span className='font-medium'>{booking.customer.idNumber}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                {/* <div className='flex gap-2'>
                  <button
                    className='p-2 rounded-full bg-white shadow-sm hover:bg-blue-50 transition-colors flex flex-col items-center group'
                    title='View booking history'
                  >
                    <History className='text-blue-600' size={18} />
                    <span className='text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      History
                    </span>
                  </button>
                  <button
                    className='p-2 rounded-full bg-white shadow-sm hover:bg-green-50 transition-colors flex flex-col items-center group'
                    title='Send message'
                  >
                    <MessageSquare className='text-green-600' size={18} />
                    <span className='text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      Message
                    </span>
                  </button>
                </div> */}
              </div>

              {/* Additional Info */}
              {booking.customer?.address && (
                <div className='flex items-start gap-2 text-gray-600 mt-2'>
                  <div className='flex items-start gap-1 bg-rose-50 px-2 py-1 rounded-md'>
                    <MapPin className='flex-shrink-0 mt-0.5 text-rose-500' size={16} />
                    <div>
                      <span className='text-xs font-medium text-gray-500 block'>Address:</span>
                      <span className='text-sm'>{booking.customer.address}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Main Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Timeline Section */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Dates Card */}
          {(booking?.checkIn || booking?.checkOut) && (
            <div className='bg-white rounded-2xl shadow-md p-6 border border-gray-100'>
              <h3 className='text-lg font-semibold mb-6 flex items-center gap-2 text-gray-700'>
                <CalendarDays size={20} />
                Booking Timeline
              </h3>

              <div className='flex items-center justify-between gap-4'>
                {/* Check-in Section */}
                <div className='flex items-center gap-4 flex-1'>
                  <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0'>
                    <ArrowDownLeft size={24} className='text-green-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Check-in</p>
                    <p className='font-semibold'>{formatDate(booking?.checkIn)}</p>
                    <p className='text-xs text-gray-500'>{formatTime(booking?.checkIn)}</p>
                  </div>
                </div>

                {/* Timeline Divider */}
                {booking.bookingstatus === 0 ? (
                  <>
                    <div className='flex flex-col items-center justify-center mx-4'>
                      <div className='w-8 border-t-2 border-dashed border-gray-200'></div>
                      <span className='text-gray-400 text-sm mx-2'>→</span>
                      <div className='w-8 border-t-2 border-dashed border-gray-200'></div>
                    </div>
                    <div className='flex items-center gap-4 flex-1'>
                      <div className='w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0'>
                        <ArrowUpRight size={24} className='text-red-600' />
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Check-out</p>
                        <p className='font-semibold'>{formatDate(booking?.checkOut)}</p>
                        <p className='text-xs text-gray-500'>{formatTime(booking?.checkOut)}</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Rooms Section */}
          {booking?.bookedRooms?.length > 0 && (
            <div className='bg-white rounded-2xl shadow-md p-6 border border-gray-100'>
              <h3 className='text-lg font-semibold mb-6 flex items-center gap-2 text-gray-700'>
                <DoorOpen size={20} />
                Booked Rooms ({booking.bookedRooms.length})
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {booking.bookedRooms.map((room, index) => (
                  <div
                    key={index}
                    className='border rounded-xl p-4 hover:shadow-lg transition-all duration-200 group relative'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='w-16 h-16 bg-gray-100 rounded-lg overflow-hidden'>
                        {room?.image && (
                          <img
                            src={`/rooms/${room.image}`}
                            className='w-full h-full object-cover'
                            alt={room?.roomName || 'Room'}
                          />
                        )}
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-bold text-gray-800 group-hover:text-blue-600 transition'>
                          {room?.roomName || 'Room'} ({room?.roomNumber || 'N/A'})
                        </h4>
                        <p className='text-sm text-gray-500 mb-2'>
                          {room?.floor || 'Floor N/A'} • Max {room?.maxOccupancy || 0} guests
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${room?.acSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {room?.acSelected ? 'AC' : 'Non-AC'}
                          </span>
                          <span className='px-2 py-1 rounded-full text-xs bg-green-100 text-green-700'>
                            Adults: {room?.adults || 0}
                          </span>
                          <span className='px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700'>
                            Children: {room?.children || 0}
                          </span>
                          {(room?.extraBed || 0) !== 0 && (
                            <span className='px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700'>
                              Extra Bed (+₹{room?.extraBedPrice || 0})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='mt-3 pt-3 border-t border-gray-100'>
                      <div className='flex justify-between items-center text-sm'>
                        <span className='text-gray-500'>Total Price</span>
                        <span className='font-semibold'>₹{room?.price || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Booking Summary */}
          <div className='bg-white rounded-2xl shadow-md p-6 border border-gray-100'>
            <h3 className='text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700'>
              <ClipboardList size={20} />
              Booking Summary
            </h3>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Booking Type:</span>
                <span className='font-medium'>{booking?.bookingType?.name || 'N/A'}</span>
              </div>
              {booking?.purposeOfVisit && (
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Purpose:</span>
                  <span className='font-medium'>{booking.purposeOfVisit.name}</span>
                </div>
              )}
              {/* <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Total Guests:</span>
                <span className='font-medium'>{booking?.occupancy || 0}</span>
              </div> */}
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Arrival From:</span>
                <span className='font-medium'>{booking?.arriveFrom || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className='bg-white rounded-2xl shadow-md p-6 border border-gray-100'>
            <h3 className='text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700'>
              <CreditCard size={20} />
              Payment Summary
            </h3>
            <div className='space-y-4'>
              {/* Current Amount Paid Summary */}
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Amount Paid:</span>
                  <span className={`font-medium ${(booking?.advance || 0) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    ₹{booking?.advance || 0}
                  </span>
                </div>
              </div>

              {/* Payment History Section */}
              {booking?.payments?.length > 0 && (
                <div className='mt-4 border rounded-lg overflow-hidden'>
                  <div className='bg-gray-50 p-3 border-b'>
                    <h3 className='font-medium text-gray-700'>Payment History</h3>
                  </div>

                  <div className='divide-y'>
                    {booking.payments.map(payment => (
                      <div key={payment.id} className='p-3'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='font-medium'>₹{payment.amount}</p>
                            <p className='text-sm text-gray-500 mt-1'>
                              {payment.method === 0 ? '💵 Cash' : payment.method === 1 ? '💳 Card' : '🌐 Online'}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-sm text-gray-500'>{formatDate(payment.date)}</p>
                            {payment.transactionid && (
                              <p className='text-xs text-gray-400 mt-1'>Ref: {payment.transactionid}</p>
                            )}
                          </div>
                        </div>
                        {payment.note && <p className='text-sm text-gray-600 mt-2'>Note: {payment.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Confirmation (kept from original) */}
              {(booking?.advance || 0) > 0 && booking?.createdAt && (
                <div className='mt-4 bg-blue-50 p-3 rounded-lg flex items-center gap-3'>
                  <CheckCircle2 size={18} className='text-blue-600' />
                  <span className='text-sm text-blue-700'>Amount paid on {formatDate(booking.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
