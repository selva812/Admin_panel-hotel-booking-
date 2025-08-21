// pages/booking-calendar.jsx
'use client'
import { useState, useEffect } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  startOfWeek,
  addDays,
  isLeapYear
} from 'date-fns'
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from '@heroicons/react/24/outline'
import DailyBookingDetails from '@/components/dailybooking'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { TransparentLoader } from '@/components/transparent'
export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState(null)
  const [selectedDate, setselectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showmodal, setShowmodal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  useEffect(() => {
    fetchCalendarData()
  }, [currentDate])

  const [screenSize, setScreenSize] = useState('desktop')

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')
      const response = await fetch(`/api/booking-calender?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data')
      }
      const data = await response.json()
      setCalendarData(data)
      setLoading(false)
    } catch (err) {
      console.log('error', err)
      setError(err.message)
      setLoading(false)
    }
  }
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }
  const closeDetails = () => {
    setShowDetails(false)
    setSelectedDate(null)
  }
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart) // Get the first day of the week containing the first day of month

    // Create array of days for calendar display (including days from prev/next months to fill weeks)
    const calendarDays = []
    let day = startDate

    // Fill 6 weeks (42 days) to ensure we have enough days for any month
    for (let i = 0; i < 42; i++) {
      calendarDays.push(day)
      day = addDays(day, 1)
    }
    // Get day headers (Sun, Mon, Tue, etc.)
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className='bg-white rounded-xl shadow-lg ring-1 ring-gray-100/5 overflow-hidden'>
        {/* Header Section */}
        <div className='flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white'>
          <div className='flex items-center gap-4'>
            <button onClick={goToPreviousMonth} className='p-2 rounded-lg hover:bg-white/10 transition-colors'>
              <ArrowLeftIcon className='w-5 h-5' />
            </button>
            <h2 className='text-2xl font-bold'>
              {format(currentDate, 'MMMM yyyy')}
              {currentDate.getMonth() === 1 && isLeapYear(currentDate) && ' (Leap Year)'}
            </h2>
          </div>

          <div className='flex items-center gap-3'>
            <button
              onClick={goToToday}
              className='flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg hover:bg-white/20 transition-colors'
            >
              <CalendarIcon className='w-5 h-5' />
              <span>Today</span>
            </button>
            <button onClick={goToNextMonth} className='p-2 rounded-lg hover:bg-white/10 transition-colors'>
              <ArrowRightIcon className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className='grid grid-cols-7 bg-gray-50/50 border-b border-gray-100'>
          {dayHeaders.map(day => (
            <div key={day} className='p-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider'>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className='grid grid-cols-7 auto-rows-min gap-px bg-gray-100'>
          {calendarDays.map((day, index) => {
            const dateString = format(day, 'yyyy-MM-dd')
            const dayData = calendarData?.days[dateString] || {
              booked: 0,
              available: 0,
              requested: 0,
              totalRooms: 0
            }

            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <div
                key={index}
                className={`
                                        relative bg-gray-200 min-h-[120px] p-3 group
                                        ${!isCurrentMonth ? 'bg-gray-50/50' : ''}
                                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                                        hover:bg-gray-50 transition-colors
                                    `}
                onClick={() => {
                  setselectedDate(day)
                  setShowmodal(true)
                }}
              >
                {/* Date Number */}
                <div className='flex items-center justify-between mb-2'>
                  <span
                    className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}
                                        ${!isCurrentMonth ? 'text-gray-300' : ''}`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Occupancy Indicator */}
                  {!loading && (
                    <div className='flex items-center gap-1 text-xs'>
                      <div className='w-2 h-2 rounded-full bg-red-600' />
                      <span>{dayData.booked}</span>
                      <div className='w-2 h-2 rounded-full bg-green-600' />
                      <span>{dayData.available}</span>
                    </div>
                  )}
                </div>

                {/* Visual Availability Bar */}
                {!loading && calendarData && (
                  <div className='mb-2'>
                    <div className='relative h-2 bg-gray-200 rounded-full overflow-hidden'>
                      <div
                        className='absolute left-0 h-full bg-red-600'
                        style={{ width: `${(dayData.booked / dayData.totalRooms) * 100}%` }}
                      />
                      <div
                        className='absolute h-full bg-green-600'
                        style={{
                          left: `${(dayData.booked / dayData.totalRooms) * 100}%`,
                          width: `${(dayData.available / dayData.totalRooms) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Requested Rooms */}
                {!loading && dayData.requested > 0 && (
                  <div className='flex items-center gap-1 text-xs text-amber-700'>
                    <span className='w-2 h-2 rounded-full bg-amber-400' />
                    <span>{dayData.requested} Reserved</span>
                  </div>
                )}

                {/* Total Rooms Indicator */}
                {!loading && <div className='mt-1 text-xs text-gray-500 text-center'>{dayData.totalRooms} rooms</div>}

                {/* Loading State */}
                {loading && (
                  <div className='animate-pulse space-y-2'>
                    <div className='h-2 bg-gray-200 rounded' />
                    <div className='h-2 bg-gray-200 rounded' />
                  </div>
                )}
                {/* Hover Overlay */}
                {isCurrentMonth && (
                  <div className='absolute inset-0 pointer-events-none border-2 border-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity' />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  const MobileBookingCalendar = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showDateDetails, setShowDateDetails] = useState(false)
    const [pendingRequests, setPendingRequests] = useState([])
    const [stats, setStats] = useState(null)
    const [todayCheckin, setTodayCheckin] = useState([])
    const [overstay, setOverstay] = useState([])
    const [checkout, setCheckout] = useState([])
    const [activeTab, setActiveTab] = useState('checkin')
    const [available, setavailable] = useState([])
    useEffect(() => {
      console.log('Selected date changed:', selectedDate)
      console.log('Show details:', showDateDetails)
    }, [selectedDate, showDateDetails])

    useEffect(() => {
      setShowDateDetails(true)
      fetchDailyDetails()
    }, [selectedDate])

    const fetchDailyDetails = async () => {
      try {
        setLoading(true)
        const formattedDate = format(selectedDate, 'yyyy-MM-dd')
        const response = await fetch(`/api/booking-details?date=${formattedDate}`)
        if (!response.ok) throw new Error('Failed to fetch daily booking details')
        const data = await response.json()
        setTodayCheckin(data.todayCheckin)
        setOverstay(data.overstay)
        setCheckout(data.checkout)
        setavailable(data.availableRooms)
        setPendingRequests(data.pendingRequests)
        setStats(data.stats)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    const getStatusBadge = (tabType, booking) => {
      switch (tabType) {
        case 'checkin':
          return <span className='bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs'>Check-in Today</span>
        case 'overstay':
          return <span className='bg-red-200 text-red-800 px-2 py-1 rounded text-xs'>Overstayed</span>
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
          overstay: 'No overstayed guests.',
          checkout: 'No checkouts for this day.',
          pending: 'No pending requests.'
        }
        return <p className='text-gray-500'>{emptyMessages[tabType]}</p>
      }

      // Helper function to determine status for overstay tab
      const getOverstayStatus = booking => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const checkOutDate = booking.bookedRooms?.[0]?.checkOut
        if (!checkOutDate) return 'unknown'

        const checkOut = new Date(checkOutDate)
        checkOut.setHours(0, 0, 0, 0)

        return checkOut < today ? 'overstay' : 'staying'
      }

      // Custom status badge for overstay tab
      const getOverstayBadge = status => {
        switch (status) {
          case 'overstay':
            return (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                Overstay
              </span>
            )
          case 'staying':
            return (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                Staying
              </span>
            )
          default:
            return (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                Unknown
              </span>
            )
        }
      }

      // Mobile view (card-based)
      const renderMobileView = () => (
        <div className='space-y-3 sm:hidden'>
          {bookings.map(booking => (
            <div key={booking.id} className='border rounded-lg p-4 bg-white shadow-sm'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='font-medium text-gray-900'>{booking.customer.name}</h3>
                  <p className='text-sm text-gray-500 mt-1'>{booking.customer.phoneNumber}</p>
                </div>

                {/* Status badge - special handling for overstay tab */}
                {tabType === 'overstay'
                  ? getOverstayBadge(getOverstayStatus(booking))
                  : getStatusBadge(tabType, booking)}
              </div>

              <div className='mt-3'>
                <div className='flex items-center text-sm text-gray-600'>
                  <span className='font-medium mr-2'>Room(s):</span>
                  {booking.bookedRooms?.map(room => (
                    <span key={room.id} className='bg-gray-100 px-2 py-1 rounded mr-1 mb-1 text-xs'>
                      {room.room.roomNumber}
                    </span>
                  )) || booking.rooms}
                </div>

                <div className='mt-2 text-sm text-gray-600'>
                  <span className='font-medium'>
                    {tabType === 'checkin'
                      ? 'Check-in:'
                      : tabType === 'pending'
                        ? 'Requested:'
                        : tabType === 'overstay'
                          ? 'Expected:'
                          : 'Checkout:'}
                  </span>{' '}
                  {tabType === 'checkin' &&
                    booking.bookedRooms?.[0]?.checkIn &&
                    format(new Date(booking.bookedRooms[0].checkIn), 'MMM d, yyyy')}
                  {tabType === 'overstay' &&
                    booking.bookedRooms?.[0]?.checkOut &&
                    format(new Date(booking.bookedRooms[0].checkOut), 'MMM d, yyyy')}
                  {tabType === 'checkout' &&
                    booking.bookedRooms?.[0]?.actualCheckOut &&
                    format(new Date(booking.bookedRooms[0].actualCheckOut), 'MMM d, yyyy')}
                  {tabType === 'pending' && booking.date && format(new Date(booking.date), 'MMM d, yyyy')}
                </div>
              </div>

              {/* Only show action buttons for non-pending tabs */}
            </div>
          ))}
        </div>
      )

      return <>{renderMobileView()}</>
    }

    const tabs = [
      { id: 'checkin', label: 'Today Check-in', count: stats?.todayCheckin || 0 },
      { id: 'overstay', label: 'Overstay', count: stats?.overstay || 0 },
      { id: 'checkout', label: 'Checkout', count: stats?.checkout || 0 },
      { id: 'pending', label: 'Pending Requests', count: stats?.requested || 0 },
      { id: 'rooms', label: 'Available Rooms', count: stats?.available || 0 }
    ]

    const goToPreviousMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
      if (
        selectedDate &&
        !isSameMonth(selectedDate, new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
      ) {
        setselectedDate(null)
      }
    }

    const goToNextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
      if (
        selectedDate &&
        !isSameMonth(selectedDate, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
      ) {
        setselectedDate(null)
      } // Clear selection when changing months
    }

    const goToToday = () => {
      const today = new Date()
      setCurrentDate(today)
      setselectedDate(today)
    }

    const handleDateClick = async date => {
      if (!isSameMonth(date, currentDate)) return
      setselectedDate(date)
    }

    const renderCalendar = () => {
      const monthStart = startOfMonth(currentDate)
      const startDate = startOfWeek(monthStart)

      const calendarDays = []
      let day = startDate

      for (let i = 0; i < 42; i++) {
        calendarDays.push(day)
        day = addDays(day, 1)
      }

      const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

      return (
        <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white'>
            <button
              onClick={goToPreviousMonth}
              className='p-2 rounded-lg hover:bg-white/20 active:bg-white/30 transition-colors'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>

            <div className='text-center flex-1'>
              <h2 className='text-lg font-bold'>{format(currentDate, 'MMM yyyy')}</h2>
            </div>

            <button
              onClick={goToNextMonth}
              className='p-2 rounded-lg hover:bg-white/20 active:bg-white/30 transition-colors'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>

          {/* Today Button */}
          <div className='p-3 bg-blue-50 border-b'>
            <button
              onClick={goToToday}
              className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium'
            >
              <Calendar className='w-4 h-4' />
              <span>Go to Today</span>
            </button>
          </div>

          {/* Day Headers */}
          <div className='grid grid-cols-7 bg-gray-50 border-b'>
            {dayHeaders.map((day, index) => (
              <div key={index} className='p-3 text-center text-xs font-medium text-gray-500 uppercase'>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className='grid grid-cols-7 gap-px bg-gray-100'>
            {calendarDays.map((day, index) => {
              const dateString = format(day, 'yyyy-MM-dd')
              const dayData = calendarData?.days[dateString] || {
                booked: 0,
                available: 0,
                requested: 0,
                totalRooms: 0
              }

              const isToday = isSameDay(day, new Date())
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const occupancyRate = dayData.totalRooms > 0 ? (dayData.booked / dayData.totalRooms) * 100 : 0

              return (
                <div
                  key={index}
                  className={`
                  relative bg-white min-h-[50px] p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                  ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : ''}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-100 ring-2 ring-blue-400' : ''}
                  ${isCurrentMonth ? 'hover:bg-gray-50 active:bg-blue-50' : ''}
                `}
                  onClick={() => handleDateClick(day)}
                >
                  {/* Date Number */}
                  <span
                    className={`text-sm font-medium mb-1 ${
                      isToday
                        ? 'text-blue-600 font-bold'
                        : isSelected
                          ? 'text-blue-700 font-semibold'
                          : !isCurrentMonth
                            ? 'text-gray-300'
                            : 'text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Status Indicator Dots */}
                  {!loading && isCurrentMonth && dayData.totalRooms > 0 && (
                    <div className='flex gap-1'>
                      {/* High occupancy indicator */}
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          occupancyRate >= 90
                            ? 'bg-red-500'
                            : occupancyRate >= 70
                              ? 'bg-yellow-500'
                              : occupancyRate > 0
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                        }`}
                      />

                      {/* Requested rooms indicator */}
                      {dayData.requested > 0 && <div className='w-1.5 h-1.5 rounded-full bg-amber-400' />}
                    </div>
                  )}

                  {/* Loading indicator */}
                  {loading && isCurrentMonth && <div className='w-2 h-2 bg-gray-300 rounded-full animate-pulse' />}
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    const renderDateDetails = () => {
      if (!selectedDate || loading) return null
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      const dayData = calendarData?.days[dateString]
      if (!dayData) return null
      return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto'>
            {/* Header */}
            <div className='sticky top-0 bg-white z-10 p-4 sm:p-6 border-b flex justify-between items-center'>
              <h2 className='text-lg sm:text-xl font-bold'>Bookings for {format(selectedDate, 'MMMM d, yyyy')}</h2>
              <button
                onClick={() => {
                  setShowDateDetails(false)
                }}
                className='text-gray-600 hover:text-gray-900 text-2xl font-bold'
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className='flex justify-center p-8'>
                <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
              </div>
            ) : error ? (
              <div className='bg-red-100 text-red-700 p-4 rounded m-4'>Error: {error}</div>
            ) : (
              <div className='p-2 sm:p-4 space-y-4'>
                {/* Mobile-optimized tabs */}
                <div className='border-b border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 rounded-t-lg overflow-x-auto'>
                  <nav className='flex space-x-1 px-1 w-max min-w-full'>
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                  relative py-2 px-3 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm transition-all duration-200
                  ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}
                `}
                      >
                        <span className='relative z-10 flex items-center'>
                          {tab.label}
                          {tab.count > 0 && (
                            <span
                              className={`
                        ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full transition-all duration-200
                        ${activeTab === tab.id ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 text-gray-600'}
                      `}
                            >
                              {tab.count}
                            </span>
                          )}
                        </span>

                        {/* Animated underline - smaller on mobile */}
                        {activeTab === tab.id && (
                          <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full'>
                            <div className='absolute top-0 left-1/2 w-3 sm:w-4 h-3 sm:h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2'></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className='mt-4 sm:mt-6'>
                  {activeTab === 'checkin' && (
                    <div>
                      <h3 className='text-base sm:text-lg font-semibold mb-2 sm:mb-3'>Today Check-in</h3>
                      {renderBookingTable(todayCheckin, 'checkin')}
                    </div>
                  )}

                  {activeTab === 'overstay' && (
                    <div>
                      <h3 className='text-base sm:text-lg font-semibold mb-2 sm:mb-3'>Overstayed Guests</h3>
                      {renderBookingTable(overstay, 'overstay')}
                    </div>
                  )}

                  {activeTab === 'checkout' && (
                    <div>
                      <h3 className='text-base sm:text-lg font-semibold mb-2 sm:mb-3'>Checked Out Today</h3>
                      {renderBookingTable(checkout, 'checkout')}
                    </div>
                  )}

                  {activeTab === 'pending' && (
                    <div>
                      <h3 className='text-base sm:text-lg font-semibold mb-2 sm:mb-3'>Pending Booking Requests</h3>
                      {pendingRequests.length === 0 ? (
                        <p className='text-gray-500 text-sm sm:text-base'>No pending booking requests for this day.</p>
                      ) : (
                        <div className='space-y-2 sm:space-y-3'>
                          {pendingRequests.map(request => (
                            <div key={request.id} className='p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200'>
                              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2'>
                                <div className='flex-1'>
                                  <div className='font-medium text-gray-800 text-sm sm:text-base'>
                                    {request.customer.name}
                                  </div>
                                  <div className='text-xs sm:text-sm text-gray-600 mt-1'>
                                    <span className='font-medium'>Phone:</span> {request.customer.phoneNumber}
                                  </div>
                                  <div className='text-xs sm:text-sm text-gray-600'>
                                    <span className='font-medium'>Rooms:</span> {request.rooms}
                                  </div>
                                  <div className='text-xs sm:text-sm text-gray-600'>
                                    <span className='font-medium'>Reserved Date:</span>{' '}
                                    {format(new Date(request.date), 'MMM d, yyyy')}
                                  </div>
                                </div>
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

    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 '>
        <div className='w-80  space-y-2'>
          {/* Header */}
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Booking Calendar</h1>
            <p className='text-sm text-gray-600'>Tap any date to view details</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className='p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm'>Error: {error}</div>
          )}

          {/* Calendar */}
          {renderCalendar()}
          {loading && <TransparentLoader />}
          {showDateDetails && renderDateDetails()}
        </div>
      </div>
    )
  }
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
      <div className='max-w-7xl space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-900'>Booking Calendar</h1>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-red-500 rounded-full' />
              <span className='text-sm text-gray-600'>Booked</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-green-500 rounded-full' />
              <span className='text-sm text-gray-600'>Available</span>
            </div>
          </div>
        </div>

        {error && <div className='p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl'>Error: {error}</div>}
        {screenSize === 'mobile' ? (
          <MobileBookingCalendar />
        ) : (
          <div className='bg-white rounded-2xl shadow-lg p-6'>{renderCalendar()}</div>
        )}
      </div>
      {showmodal && (
        <DailyBookingDetails
          date={selectedDate}
          onClose={() => {
            setShowmodal(false)
          }}
        />
      )}
    </div>
  )
}
