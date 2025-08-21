'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function DailyBookingDetails({ date, onClose }) {
  const [todayCheckin, setTodayCheckin] = useState([])
  const [staying, setStaying] = useState([])
  const [overstay, setOverstay] = useState([])
  const [checkout, setCheckout] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('checkin')
  const [available, setavailable] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  useEffect(() => {
    fetchDailyDetails()
  }, [date])

  const fetchDailyDetails = async () => {
    try {
      setLoading(true)
      const formattedDate = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/booking-details?date=${formattedDate}`)
      if (!response.ok) throw new Error('Failed to fetch daily booking details')
      const data = await response.json()
      setTodayCheckin(data.todayCheckin)
      setStaying(data.staying)
      setavailable(data.availableRooms)
      setOverstay(data.overstay)
      setCheckout(data.checkout)
      setPendingRequests(data.pendingRequests)
      setStats(data.stats)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // Helper function to determine if a booking is truly overstayed
  const isOverstayed = booking => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return booking.bookedRooms?.some(room => {
      // Apply the same timezone correction as the API
      const checkOutUTC = new Date(room.checkOut)
      const checkOutIST = new Date(checkOutUTC.getTime() + 5.5 * 60 * 60 * 1000)
      checkOutIST.setHours(0, 0, 0, 0)
      return !room.isCheckedOut && checkOutIST < today
    })
  }

  const getStatusBadge = (tabType, booking) => {
    switch (tabType) {
      case 'checkin':
        return <span className='bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs'>Check-in Today</span>
      case 'checkout':
        return <span className='bg-green-200 text-green-800 px-2 py-1 rounded text-xs'>Checked Out</span>
      default:
        return null
    }
  }

  const renderBookingTable = (bookings, tabType) => {
    if (bookings.length === 0) {
      const emptyMessages = {
        checkin: 'No check-ins for this day.',
        staying: 'No guests currently staying.',
        checkout: 'No checkouts for this day.'
      }
      return <p className='text-gray-500'>{emptyMessages[tabType]}</p>
    }

    return (
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Guest</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Room(s)</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                {tabType === 'checkin'
                  ? 'Check-in Date'
                  : tabType === 'staying'
                    ? 'Expected Checkout'
                    : 'Checkout Date'}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Status</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {bookings.map((booking, index) => {
              // For staying tab, determine if it's overstayed or normally staying
              const isTrueOverstay = tabType === 'staying' && isOverstayed(booking)

              return (
                <tr key={booking.bookingref || index}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='font-medium text-gray-900'>{booking.customer.name}</div>
                    <div className='text-sm text-gray-500'>{booking.customer.phoneNumber}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {booking.bookedRooms?.map((room, roomIndex) => (
                      <span key={roomIndex} className='inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1'>
                        {room.room.roomNumber}
                      </span>
                    )) || booking.rooms}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {tabType === 'checkin' && booking.bookedRooms?.[0]?.checkIn && (
                      <div>
                        {format(
                          new Date(new Date(booking.bookedRooms[0].checkIn).getTime() + 5.5 * 60 * 60 * 1000),
                          'MMM d, yyyy'
                        )}
                      </div>
                    )}
                    {(tabType === 'staying' || tabType === 'checkout') && booking.bookedRooms?.[0]?.checkOut && (
                      <div>
                        {format(
                          new Date(new Date(booking.bookedRooms[0].checkOut).getTime() + 5.5 * 60 * 60 * 1000),
                          'MMM d, yyyy'
                        )}
                      </div>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {tabType === 'staying' ? (
                      isTrueOverstay ? (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                          🚨 Overstay
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          🏠 Staying
                        </span>
                      )
                    ) : (
                      getStatusBadge(tabType, booking)
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Combine staying and overstay guests for the staying tab
  const combinedStayingGuests = [...staying, ...overstay]
  const totalStayingCount = (stats?.staying || 0) + (stats?.overstay || 0)

  const tabs = [
    { id: 'checkin', label: 'Today Check-in', count: stats?.todayCheckin || 0 },
    { id: 'staying', label: 'Currently Staying', count: totalStayingCount },
    { id: 'checkout', label: 'Checkout', count: stats?.checkout || 0 },
    { id: 'pending', label: 'Reserved', count: stats?.requested || 0 },
    { id: 'rooms', label: 'Available Rooms', count: stats?.available || 0 }
  ]

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-bold'>Bookings for {format(date, 'MMMM d, yyyy')}</h2>
          <button onClick={onClose} className='text-gray-600 hover:text-gray-900 text-xl font-bold'>
            ×
          </button>
        </div>

        {loading ? (
          <div className='flex justify-center p-8'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
          </div>
        ) : error ? (
          <div className='bg-red-100 text-red-700 p-4 rounded mb-4'>Error: {error}</div>
        ) : (
          <div className='space-y-6'>
            {/* Tabs */}
            <div className='border-b border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 rounded-t-lg'>
              <nav className='flex space-x-1 px-1'>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative py-3 px-4 font-medium text-sm transition-all duration-200
                      ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}
                    `}
                  >
                    <span className='relative z-10 flex items-center'>
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className={`
                            ml-2 px-2 py-1 text-xs rounded-full transition-all duration-200
                            ${activeTab === tab.id ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 text-gray-600'}
                          `}
                        >
                          {tab.count}
                        </span>
                      )}
                    </span>

                    {/* Animated underline */}
                    {activeTab === tab.id && (
                      <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full'>
                        <div className='absolute top-0 left-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2'></div>
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className='mt-6'>
              {activeTab === 'checkin' && (
                <div>
                  <h3 className='text-lg font-semibold mb-3'>Today Check-in</h3>
                  {renderBookingTable(todayCheckin, 'checkin')}
                </div>
              )}

              {activeTab === 'staying' && (
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold'>Currently Staying Guests</h3>
                    <div className='flex space-x-4 text-sm'>
                      <div className='flex items-center'>
                        <span className='inline-block w-3 h-3 bg-blue-100 rounded-full mr-2'></span>
                        <span className='text-gray-600'>Normal Stay ({staying.length})</span>
                      </div>
                      <div className='flex items-center'>
                        <span className='inline-block w-3 h-3 bg-red-100 rounded-full mr-2'></span>
                        <span className='text-gray-600'>Overstay ({overstay.length})</span>
                      </div>
                    </div>
                  </div>
                  {renderBookingTable(combinedStayingGuests, 'staying')}
                </div>
              )}

              {activeTab === 'checkout' && (
                <div>
                  <h3 className='text-lg font-semibold mb-3'>Checked Out Today</h3>
                  {renderBookingTable(checkout, 'checkout')}
                </div>
              )}

              {activeTab === 'pending' && (
                <div>
                  <h3 className='text-lg font-semibold mb-3'>Reserved</h3>
                  {pendingRequests.length === 0 ? (
                    <p className='text-gray-500'>No pending reservations for this day.</p>
                  ) : (
                    <div className='space-y-3'>
                      {pendingRequests.map((request, index) => (
                        <div
                          key={request.bookingref || index}
                          className='p-4 bg-gray-50 rounded-lg border border-gray-200'
                        >
                          <div className='flex justify-between items-start'>
                            <div>
                              <div className='font-medium text-gray-800'>{request.customer.name}</div>
                              <div className='text-sm text-gray-600 mt-1'>
                                <span className='font-medium'>Phone:</span> {request.customer.phoneNumber}
                              </div>
                              <div className='text-sm text-gray-600'>
                                <span className='font-medium'>Rooms:</span> {request.rooms}
                              </div>
                              <div className='text-sm text-gray-600'>
                                <span className='font-medium'>Requested Date:</span>{' '}
                                {format(new Date(request.date), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                              📋 Reserved
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rooms' && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-800'>Available Rooms ({available.length})</h3>

                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                    {available.map(room => (
                      <div
                        key={room.id}
                        className={`
            relative rounded-lg p-4 text-center cursor-pointer transition-all duration-300
            border border-gray-200 hover:border-blue-400 
            hover:shadow-lg hover:scale-[1.02]
            bg-white hover:bg-gradient-to-b hover:from-white hover:to-blue-50
          `}
                      >
                        {/* Room Type Label */}
                        <span
                          className={`absolute -top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full 
              shadow-sm ${room.isAc ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {room.type.name}
                          {room.isAc && ' (AC)'}
                        </span>

                        {/* Capacity Badge */}
                        <span className='absolute -top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 shadow-sm'>
                          {room.occupancy} {room.occupancy > 1 ? 'persons' : 'person'}
                        </span>

                        {/* Room Number */}
                        <div className='flex flex-col items-center justify-center mt-2'>
                          <span className='text-2xl font-bold text-gray-800'>{room.roomNumber}</span>
                          <span className='text-xs text-gray-500'>{room.floor.name}</span>
                        </div>

                        {/* Price Table */}
                        <div className='mt-3 text-xs border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
                          {/* Table Header */}
                          <div className='grid grid-cols-3 bg-gray-100 px-2 py-1 border-b border-gray-200'>
                            <span className='text-gray-700 font-medium text-left'>Type</span>
                            <span className='text-gray-700 font-medium text-center'>Walk-in</span>
                            <span className='text-blue-600 font-medium text-center'>Online</span>
                          </div>

                          {/* AC Row */}
                          <div className={`grid grid-cols-3 px-2 py-1 ${room.isAc ? 'bg-blue-50' : 'bg-white'}`}>
                            <span className='text-gray-600 text-left'>AC</span>
                            <span className='text-gray-800 font-medium text-center'>₹{room.acPrice}</span>
                            <span className='text-blue-600 text-center'>₹{room.online_acPrice}</span>
                          </div>

                          {/* Non-AC Row */}
                          <div className='grid grid-cols-3 px-2 py-1 bg-white'>
                            <span className='text-gray-600 text-left'>Non-AC</span>
                            <span className='text-gray-800 font-medium text-center'>₹{room.nonAcPrice}</span>
                            <span className='text-blue-600 text-center'>₹{room.online_nonAcPrice}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
