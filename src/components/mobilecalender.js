'use client'
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

// Mock date functions (replace with your actual date library)
const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0)
const startOfWeek = date => {
  const day = new Date(date)
  const diff = day.getDate() - day.getDay()
  return new Date(day.setDate(diff))
}
const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
const format = (date, formatStr) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (formatStr === 'MMMM yyyy') return `${months[date.getMonth()]} ${date.getFullYear()}`
  if (formatStr === 'MMM yyyy') return `${shortMonths[date.getMonth()]} ${date.getFullYear()}`
  if (formatStr === 'yyyy-MM-dd') return date.toISOString().split('T')[0]
  if (formatStr === 'd') return date.getDate().toString()
  if (formatStr === 'EEEE, MMMM d, yyyy')
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  return date.toString()
}
const isSameDay = (date1, date2) => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}
const isSameMonth = (date1, date2) => {
  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear()
}

// Mock data generator
const generateMockData = () => {
  const data = { days: {} }
  const today = new Date()

  for (let i = -30; i <= 60; i++) {
    const date = addDays(today, i)
    const dateString = format(date, 'yyyy-MM-dd')
    const totalRooms = 20
    const booked = Math.floor(Math.random() * totalRooms)
    const available = totalRooms - booked
    const requested = Math.floor(Math.random() * 5)

    data.days[dateString] = {
      booked,
      available,
      requested,
      totalRooms,
      // Mock booking details
      bookings: [
        { id: 1, guest: 'John Doe', room: '101', checkIn: '14:00', checkOut: '11:00' },
        { id: 2, guest: 'Jane Smith', room: '205', checkIn: '15:00', checkOut: '10:00' },
        { id: 3, guest: 'Mike Johnson', room: '301', checkIn: '16:00', checkOut: '12:00' }
      ].slice(0, booked > 3 ? 3 : booked)
    }
  }

  return data
}

const MobileBookingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setCalendarData(generateMockData())
      setLoading(false)
    }, 1000)
  }, [])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null) // Clear selection when changing months
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null) // Clear selection when changing months
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const handleDateClick = date => {
    if (isSameMonth(date, currentDate)) {
      setSelectedDate(date)
    }
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
          {dayHeaders.map(day => (
            <div key={day} className='p-3 text-center text-xs font-medium text-gray-500 uppercase'>
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

    const occupancyRate = dayData.totalRooms > 0 ? (dayData.booked / dayData.totalRooms) * 100 : 0

    return (
      <div className='bg-white rounded-xl shadow-lg overflow-hidden mt-4'>
        {/* Date Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4'>
          <h3 className='text-lg font-semibold'>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
        </div>

        {/* Stats Overview */}
        <div className='p-4 bg-gray-50 border-b'>
          <div className='grid grid-cols-3 gap-4 text-center'>
            <div>
              <div className='text-2xl font-bold text-red-600'>{dayData.booked}</div>
              <div className='text-xs text-gray-500 uppercase tracking-wide'>Booked</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-green-600'>{dayData.available}</div>
              <div className='text-xs text-gray-500 uppercase tracking-wide'>Available</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-amber-600'>{dayData.requested}</div>
              <div className='text-xs text-gray-500 uppercase tracking-wide'>Requested</div>
            </div>
          </div>

          {/* Occupancy Bar */}
          <div className='mt-4'>
            <div className='flex justify-between text-sm text-gray-600 mb-1'>
              <span>Occupancy Rate</span>
              <span>{Math.round(occupancyRate)}%</span>
            </div>
            <div className='h-3 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className={`h-full transition-all duration-500 ${
                  occupancyRate >= 90 ? 'bg-red-500' : occupancyRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {dayData.bookings && dayData.bookings.length > 0 ? (
          <div className='p-4'>
            <h4 className='font-semibold text-gray-800 mb-3'>Today's Bookings</h4>
            <div className='space-y-3'>
              {dayData.bookings.map(booking => (
                <div key={booking.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div>
                    <div className='font-medium text-gray-900'>{booking.guest}</div>
                    <div className='text-sm text-gray-500'>Room {booking.room}</div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-medium text-gray-700'>
                      {booking.checkIn} - {booking.checkOut}
                    </div>
                    <div className='text-xs text-gray-500'>Check-in / Check-out</div>
                  </div>
                </div>
              ))}
            </div>

            {dayData.booked > dayData.bookings.length && (
              <div className='mt-3 text-center'>
                <button className='text-blue-600 text-sm font-medium hover:text-blue-700'>
                  View all {dayData.booked} bookings
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className='p-4 text-center text-gray-500'>
            <div className='text-gray-400 mb-2'>📅</div>
            <div>No bookings for this date</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4'>
      <div className='max-w-md mx-auto space-y-4'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Booking Calendar</h1>
          <p className='text-sm text-gray-600'>Tap any date to view details</p>
        </div>

        {/* Legend */}
        <div className='bg-white rounded-lg p-3 shadow-sm'>
          <div className='flex items-center justify-center gap-4 text-xs'>
            <div className='flex items-center gap-1'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <span className='text-gray-600'>Low</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
              <span className='text-gray-600'>High</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-2 h-2 bg-red-500 rounded-full'></div>
              <span className='text-gray-600'>Full</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
              <span className='text-gray-600'>Requests</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm'>Error: {error}</div>
        )}

        {/* Calendar */}
        {renderCalendar()}

        {/* Date Details */}
        {renderDateDetails()}
      </div>
    </div>
  )
}

export default MobileBookingCalendar
