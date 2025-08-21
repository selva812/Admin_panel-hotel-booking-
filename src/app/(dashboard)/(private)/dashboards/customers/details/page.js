'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeftIcon,
  User,
  Phone,
  Building,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  BadgeInfo,
  FileImage
} from 'lucide-react'
import { X, Bed, Snowflake, Users, DollarSign, Activity, Key, Info } from 'lucide-react'
import { Suspense } from 'react'
import { TransparentLoader } from '@/components/transparent'
export default function CustomerDetailClient() {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState([])
  const [activebooking, setActivebooking] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const paymentMethodMap = {
    0: 'Cash',
    1: 'Card',
    2: 'Online'
  }
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)

        // Corrected URLs: changed "cutomers" to "customers"
        const res = await fetch('/api/customers/detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })

        const res1 = await fetch(`/api/customers/detail?id=${id}`)
        const res2 = await fetch(`/api/customers/detail/active?id=${id}`)

        if (!res.ok) throw new Error('Customer not found')
        if (!res1.ok) throw new Error('Booking data error')
        if (!res2.ok) throw new Error('Active Booking data error')

        const data = await res.json()
        const data1 = await res1.json()
        const data2 = await res2.json()

        console.log('Active booking data:', data1)
        setCustomer(data)
        setBooking(data1.data)
        setActivebooking(data2)
        setTotalPages(data1.meta.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer')
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchCustomer()
  }, [id])

  const formatDate = date => {
    const d = new Date(date)
    return isNaN(d.getTime())
      ? 'Invalid date'
      : d.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
  }

  const openModal = room => {
    setSelectedRoom(room)
    console.log('room', room)
    setIsModalOpen(true)
  }
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedRoom(null)
  }

  if (loading) return <TransparentLoader />
  if (error) return <div className='text-red-500 p-8'>Error: {error}</div>
  if (!customer) return <div className='p-8'>Customer not found</div>

  return (
    <Suspense fallback={<TransparentLoader />}>
      <div className=' p-6'>
        <button
          onClick={() => router.back()}
          className='mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800'
        >
          <ArrowLeftIcon className='h-5 w-5' />
          Back to Customers
        </button>

        <div className='bg-white rounded-xl shadow-lg p-6 space-y-8'>
          <div className='max-w-6xl mx-auto px-4 py-8'>
            {/* Header Section */}
            <div className='text-center mb-10'>
              <div className='relative inline-block mb-4'>
                {customer.picture ? (
                  <div className='w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden mx-auto'>
                    <img
                      src={`/uploads/${customer.picture}`}
                      alt={customer.name}
                      className='w-full h-full object-cover'
                      // onError={e => {
                      //   e.currentTarget.style.display = 'none'
                      //   e.currentTarget.nextElementSibling?.style.display = 'flex'
                      // }}
                    />
                    <div className='w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center '>
                      <User className='w-12 h-12 text-blue-600' />
                    </div>
                  </div>
                ) : (
                  <div className='w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center mx-auto'>
                    <User className='w-12 h-12 text-blue-600' />
                  </div>
                )}
              </div>
              <h1 className='text-3xl font-bold text-gray-800 mb-1'>{customer.name}</h1>
              <p className='text-gray-500'>Customer ID: #{customer.id}</p>
            </div>

            {/* Main Content */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Left Column - Documents */}
              <div className='space-y-6'>
                {/* ID Card Section */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md'>
                  <div className='p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100'>
                    <h2 className='font-semibold text-gray-700 flex items-center gap-2'>
                      <CreditCard className='w-5 h-5 text-blue-600' />
                      ID Card
                    </h2>
                  </div>
                  <div className='p-5'>
                    {customer.idPicture ? (
                      <div className='relative aspect-video bg-gray-50 rounded-lg overflow-hidden border border-gray-200'>
                        <img
                          src={`/uploads/${customer.idPicture}`}
                          alt='ID Card'
                          className='w-full h-full object-contain'
                          // onError={e => {
                          //   e.currentTarget.style.display = 'none'
                          //   e.currentTarget.nextElementSibling?.style.display = 'flex'
                          // }}
                        />
                        <div className='w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50 '>
                          <FileImage className='w-10 h-10 text-gray-400' />
                          <p className='text-gray-500 text-sm'>ID image failed to load</p>
                        </div>
                      </div>
                    ) : (
                      <div className='aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3'>
                        <BadgeInfo className='w-10 h-10 text-gray-400' />
                        <p className='text-gray-500'>No ID card uploaded</p>
                      </div>
                    )}
                    {customer.idNumber && (
                      <div className='mt-4 bg-gray-50 rounded-lg p-3 flex items-center gap-3'>
                        <FileText className='w-5 h-5 text-gray-600' />
                        <p className='font-mono text-gray-700'>{customer.idNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* GST Section (if exists) */}
                {customer.gst_no && (
                  <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md'>
                    <div className='p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100'>
                      <h2 className='font-semibold text-gray-700 flex items-center gap-2'>
                        <FileText className='w-5 h-5 text-green-600' />
                        GST Information
                      </h2>
                    </div>
                    <div className='p-5'>
                      <div className='bg-gray-50 rounded-lg p-4'>
                        <p className='font-mono text-gray-700 break-all'>{customer.gst_no}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className='space-y-6'>
                {/* Contact Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md'>
                  <div className='p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100'>
                    <h2 className='font-semibold text-gray-700 flex items-center gap-2'>
                      <Phone className='w-5 h-5 text-purple-600' />
                      Contact Information
                    </h2>
                  </div>
                  <div className='p-5 space-y-4'>
                    <div className='flex items-start gap-4'>
                      <div className='p-2 bg-purple-100 rounded-lg text-purple-600'>
                        <Phone className='w-5 h-5' />
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Phone</p>
                        <p className='font-medium text-gray-800'>
                          {customer.phoneNumber || <span className='text-gray-400 italic'>Not provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md'>
                  <div className='p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100'>
                    <h2 className='font-semibold text-gray-700 flex items-center gap-2'>
                      <Building className='w-5 h-5 text-blue-600' />
                      Company Information
                    </h2>
                  </div>
                  <div className='p-5 space-y-4'>
                    {customer.companyName ? (
                      <div className='flex items-start gap-4'>
                        <div className='p-2 bg-blue-100 rounded-lg text-blue-600'>
                          <Building className='w-5 h-5' />
                        </div>
                        <div>
                          <p className='text-sm text-gray-500'>Company Name</p>
                          <p className='font-medium text-gray-800'>{customer.companyName}</p>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center justify-center gap-2 text-gray-400 py-4'>
                        <Building className='w-5 h-5' />
                        <p>No company information</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md'>
                  <div className='p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-orange-100'>
                    <h2 className='font-semibold text-gray-700 flex items-center gap-2'>
                      <MapPin className='w-5 h-5 text-orange-600' />
                      Address
                    </h2>
                  </div>
                  <div className='p-5'>
                    {customer.address ? (
                      <div className='flex items-start gap-4'>
                        <div className='p-2 bg-orange-100 rounded-lg text-orange-600'>
                          <MapPin className='w-5 h-5' />
                        </div>
                        <p className='text-gray-700 whitespace-pre-line'>{customer.address}</p>
                      </div>
                    ) : (
                      <div className='flex items-center justify-center gap-2 text-gray-400 py-4'>
                        <MapPin className='w-5 h-5' />
                        <p>No address provided</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Member Since Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md'>
                  <div className='p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100'>
                    <h2 className='font-semibold text-gray-700 flex items-center gap-2'>
                      <Calendar className='w-5 h-5 text-green-600' />
                      Member Since
                    </h2>
                  </div>
                  <div className='p-5'>
                    <div className='flex items-center gap-4'>
                      <div className='p-2 bg-green-100 rounded-lg text-green-600'>
                        <Calendar className='w-5 h-5' />
                      </div>
                      <p className='text-gray-700'>
                        {new Date(customer.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking History */}
          <section className='space-y-6'>
            <h2 className='text-2xl font-semibold text-gray-800'>Booking History</h2>

            {booking.length > 0 ? (
              booking.map(booking => {
                const room = booking.roomDetails[0] || {}
                const status = booking.bookingStatus
                const isConfirmed = status === 0
                const isCheckin = status === 1
                const isAdvance = status === 2
                const isCancelled = status === 3

                const statusMap = {
                  0: { text: 'Checkout', color: 'bg-blue-100 text-blue-600' },
                  1: { text: 'Checkin', color: 'bg-green-100 text-green-600' },
                  2: { text: 'Advance', color: 'bg-yellow-100 text-yellow-600' },
                  3: { text: 'Cancelled', color: 'bg-gray-100 text-gray-500 line-through' }
                }

                const statusClass = statusMap[status]?.color || 'bg-gray-100 text-gray-600'
                const statusText = statusMap[status]?.text || 'Unknown'

                return (
                  <div
                    key={booking.id}
                    className={`p-4 bg-white border rounded-lg shadow-sm hover:shadow-md 
          ${isConfirmed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => {
                      if (isConfirmed) {
                        openModal(booking)
                      }
                    }}
                  >
                    <div className='flex justify-between items-center'>
                      <div>
                        {isConfirmed && booking.roomDetails.length > 0 ? (
                          <>
                            <p className='font-medium text-gray-800'>
                              {room.roomType || 'Room Type'} – Room {room.roomNumber || 'N/A'}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {new Date(booking.checkIn).toLocaleDateString('en-IN')} –{' '}
                              {new Date(booking.checkOut).toLocaleDateString('en-IN')}
                            </p>
                          </>
                        ) : (
                          <p className={`font-medium ${isCancelled ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            Booking #{booking.id}
                          </p>
                        )}

                        {/* Subtext for cancelled or pending */}
                        {(isCancelled || isAdvance || isCheckin) && (
                          <p className='text-sm text-gray-500'>
                            {statusText} on {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-sm ${statusClass}`}>{statusText}</span>
                    </div>

                    {/* Payment status for confirmed only */}
                    {isConfirmed && (
                      <div className='mt-2 text-sm'>
                        <span className={booking.pendingAmount > 0 ? 'text-orange-600' : 'text-green-600'}>
                          {booking.pendingAmount > 0 ? `Pending: ₹${booking.pendingAmount}` : 'Fully Paid'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className='p-4 text-center text-gray-500'>No bookings found</div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className='flex justify-center gap-2 mt-4'>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={`px-4 py-2 rounded border ${currentPage === 1 ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded border ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={`px-4 py-2 rounded border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Next
                </button>
              </div>
            )}
          </section>

          {/* Checked-In Rooms */}
          <section className='space-y-6'>
            <h2 className='text-2xl font-semibold text-gray-800'>Active Check-Ins</h2>
            <div className='grid gap-4 md:grid-cols-2'>
              {activebooking.length > 0 ? (
                activebooking.map(booking => {
                  const bookedRoom = booking.bookedRooms[0]?.room
                  const roomType = bookedRoom?.type?.name || 'Unknown'
                  const roomNumber = bookedRoom?.roomNumber || 'N/A'

                  return (
                    <div key={booking.id} className='p-4 bg-white border rounded-lg shadow-sm hover:shadow-md'>
                      <div className='flex justify-between items-center'>
                        <div>
                          <p className='font-medium text-gray-800'>
                            {roomType} - Room {roomNumber}
                          </p>
                          <p className='text-sm text-gray-500'>
                            Checked In:{' '}
                            {new Date(booking.checkIn).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                        <span className='px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm'>Active</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className='p-6 text-center text-gray-500 bg-gray-50 rounded-xl'>No active check-ins</div>
              )}
            </div>
          </section>
          {isModalOpen && selectedRoom && (
            <div className='fixed inset-0 -top-10 bg-black bg-opacity-60 flex items-center justify-center -right-16 z-50 p-4'>
              <div className='bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl'>
                <div className='p-8'>
                  {/* Modal Header */}
                  <div className='flex justify-between items-center pb-6 mb-6 border-b border-gray-200'>
                    <div>
                      <h2 className='text-3xl font-bold flex items-center gap-3'>
                        <div className='bg-blue-100 p-3 rounded-full'>
                          <Bed className='text-blue-600' size={28} />
                        </div>
                        <div>
                          Room {selectedRoom.roomDetails.roomNumber}
                          <div className='text-lg font-normal text-gray-500 mt-1'>
                            {selectedRoom.roomDetails[0].roomType} Room
                          </div>
                        </div>
                      </h2>
                    </div>
                    <button onClick={closeModal} className='p-2 rounded-full hover:bg-gray-100 transition-colors'>
                      <X size={28} className='text-gray-500' />
                    </button>
                  </div>

                  {/* Main Content Grid */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    {/* Left Column - Room Details */}
                    <div className='space-y-8'>
                      {/* Room Type Card */}
                      <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                        <div className='flex items-center gap-4 mb-4'>
                          <div className='bg-blue-100 p-3 rounded-xl'>
                            <Bed className='text-blue-600' size={24} />
                          </div>
                          <h3 className='text-xl font-semibold'>Room Details</h3>
                        </div>

                        <div className='space-y-4'>
                          <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                            <span className='text-gray-600'>Room Type</span>
                            <span className='font-medium'>{selectedRoom.roomDetails[0].roomType}</span>
                          </div>

                          <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                            <span className='text-gray-600'>AC Status</span>
                            <span className='font-medium flex items-center gap-2'>
                              {selectedRoom.roomDetails[0].isAc ? (
                                <>
                                  <Snowflake className='text-blue-500' size={18} />
                                  Air Conditioned
                                </>
                              ) : (
                                'Non Air Conditioned'
                              )}
                            </span>
                          </div>

                          <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                            <span className='text-gray-600'>Max Capacity</span>
                            <span className='font-medium flex items-center gap-2'>
                              <Users className='text-blue-500' size={18} />
                              {selectedRoom.roomDetails[0].maxoccupancy}
                              Persons
                            </span>
                          </div>

                          <div className='flex justify-between items-center py-2'>
                            <span className='text-gray-600'>Current Occupancy</span>
                            <span className='font-medium'>
                              {selectedRoom.roomDetails[0].adults + selectedRoom.roomDetails[0].children} Persons
                              <span className='text-sm text-gray-500 block text-right'>
                                ({selectedRoom.roomDetails[0].adults} Adults, {selectedRoom.roomDetails[0].children}{' '}
                                Children)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Card */}
                      <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                        <div className='flex items-center gap-4 mb-4'>
                          <div className='bg-blue-100 p-3 rounded-xl'>
                            <DollarSign className='text-blue-600' size={24} />
                          </div>
                          <h3 className='text-xl font-semibold'>Pricing Details</h3>
                        </div>

                        <div className='space-y-3'>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>Room rate per night</span>
                            <span className='font-medium'>{formatCurrency(selectedRoom.baseAmount)}</span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>Duration</span>
                            <span className='font-medium'>{selectedRoom.nights} nights</span>
                          </div>
                          {selectedRoom.roomDetails.extraBeds > 0 && (
                            <div className='flex justify-between items-center'>
                              <span className='text-gray-600'>Extra beds ({selectedRoom.roomDetails.extraBeds})</span>
                              <span className='font-medium'>
                                {formatCurrency(selectedRoom.roomDetails.extraBedPrice)} each
                              </span>
                            </div>
                          )}{' '}
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>Tax</span>
                            <span className='font-medium'>{formatCurrency(selectedRoom.taxTotal)}</span>
                          </div>
                          <div className='pt-4 mt-4 border-t border-gray-200'>
                            <div className='flex justify-between items-center font-bold text-lg'>
                              <span>Total for room</span>
                              <span>{formatCurrency(selectedRoom.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Payment History */}
                      {selectedRoom.paymentHistory?.length > 0 && (
                        <div className='bg-white rounded-xl p-6 border border-gray-200'>
                          <div className='flex items-center gap-4 mb-4'>
                            <div className='bg-green-100 p-3 rounded-xl'>
                              <DollarSign className='text-green-600' size={24} />
                            </div>
                            <h3 className='text-xl font-semibold'>Payment History</h3>
                          </div>

                          <div className='space-y-3'>
                            {selectedRoom.paymentHistory.map((payment, index) => (
                              <div key={index} className='flex justify-between p-3 bg-gray-50 rounded-lg'>
                                <div>
                                  <div className='font-medium'>{formatDate(payment.date)}</div>
                                  <div className='text-sm text-gray-600 capitalize'>
                                    {paymentMethodMap[payment.method] || 'Unknown'} – {payment.type}
                                  </div>
                                  {payment.note && <div className='text-xs text-gray-500'>{payment.note}</div>}
                                </div>
                                <div className='text-right text-green-700 font-semibold'>
                                  ₹{payment.amount.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Dates & Status */}
                    <div className='space-y-8'>
                      <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                        <div className='flex items-center gap-4 mb-4'>
                          <div className='bg-blue-100 p-3 rounded-xl'>
                            <Calendar className='text-blue-600' size={24} />
                          </div>
                          <h3 className='text-xl font-semibold'>Booking Dates</h3>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='bg-blue-50 p-4 rounded-lg border border-blue-100'>
                            <div className='text-blue-600 font-medium mb-1'>Check-in</div>

                            <div className='text-sm text-blue-500 mt-1'>{formatDate(selectedRoom.checkIn)}</div>
                          </div>

                          <div className='bg-purple-50 p-4 rounded-lg border border-purple-100'>
                            <div className='text-purple-600 font-medium mb-1'>Check-out</div>
                            <div className='text-sm text-purple-500 mt-1'>{formatDate(selectedRoom.checkOut)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Status Card */}
                      <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                        <div className='flex items-center gap-4 mb-4'>
                          <div className='bg-blue-100 p-3 rounded-xl'>
                            <Activity className='text-blue-600' size={24} />
                          </div>
                          <h3 className='text-xl font-semibold'>Room Status</h3>
                        </div>

                        <div className='space-y-4'>
                          <div className='flex items-center justify-between p-4 bg-white rounded-lg border'>
                            <div className='flex items-center gap-3'>
                              <div className='bg-green-100 p-2 rounded-full'>
                                <Key className='text-green-600' size={18} />
                              </div>
                              <span>Booking Status</span>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                selectedRoom.bookingStatus === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {selectedRoom.bookingStatus}
                            </span>
                          </div>
                          <div className='flex items-center justify-between p-4 bg-white rounded-lg border'>
                            <div className='flex items-center gap-3'>
                              <div className='bg-red-100 p-2 rounded-full'>
                                <User className='text-red-600' size={18} />
                              </div>
                              <span>Booked By</span>
                            </div>
                            <span className='font-medium'>{selectedRoom.bookedBy.name || 'Staff Member'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Extra Information */}
                      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100'>
                        <div className='flex items-center gap-4 mb-4'>
                          <div className='bg-blue-100 p-3 rounded-xl'>
                            <Info className='text-blue-600' size={24} />
                          </div>
                          <h3 className='text-xl font-semibold'>Additional Information</h3>
                        </div>

                        <div className='space-y-3'>
                          <div>
                            <div className='text-gray-600 mb-1'>Arriving From</div>
                            <div className='font-medium'>{selectedRoom.arrive || 'Not specified'}</div>
                          </div>

                          <div>
                            <div className='text-gray-600 mb-1'>Purpose of Visit</div>
                            <div className='font-medium'>{selectedRoom.purposeOfVisit.name || 'Not specified'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className='mt-10 flex justify-end gap-4'>
                    <button
                      onClick={closeModal}
                      className='px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors'
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  )
}
