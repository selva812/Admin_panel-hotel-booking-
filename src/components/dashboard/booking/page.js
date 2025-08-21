'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Suspense } from 'react'
import { TransparentLoader } from '@/components/transparent'
import 'react-day-picker/dist/style.css'
import { useSearchParams } from 'next/navigation'
import AddCustomerModal from './customermodal'
import CameraModal from '@/components/camero'
import { Users, ChevronUp, ChevronDown, Camera, X } from 'lucide-react'
export default function BookingPage() {
  const searchParams = useSearchParams()
  const bookingData = searchParams.get('bookingData')
  const [taxper, settaxper] = useState('')
  const router = useRouter()
  const [stay, setstay] = useState(1)
  const now = new Date()
  const [advancePaymentReference, setAdvancePaymentReference] = useState('')
  const [checkInDate, setCheckInDate] = useState(() => {
    now.setHours(now.getHours(), now.getMinutes(), 0, 0)
    return new Date(now)
  })
  const paymentMethod = [
    { id: 0, name: 'Cash' },
    { id: 1, name: 'Card' },
    { id: 2, name: 'Online' }
  ]
  const [checkInTime, setCheckInTime] = useState(() => {
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })

  const [checkOut, setCheckOut] = useState(() => {
    const checkout = new Date(now)
    checkout.setDate(checkout.getDate() + 1)
    return checkout
  })

  const isToday = checkInDate.toDateString() === new Date().toDateString()
  const [rooms, setRooms] = useState([])
  const [customername, setcustomername] = useState('')
  const [customerid, setcustomerid] = useState('')
  const [requestbookid, setrequestbookid] = useState('')
  const [customerphone, setcustomerphone] = useState('')
  const [customercompany, setcustomercompany] = useState('')
  const [extrabedprice, setextrabedprice] = useState('')
  const [isLoading, setisLoading] = useState(false)
  const [numberOfRooms, setNumberOfRooms] = useState(1)
  const [selectedRooms, setSelectedRooms] = useState([])
  const [arriveFrom, setarriveFrom] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [expandedRooms, setExpandedRooms] = useState([])
  const [purposelist, setpurposelist] = useState([])
  const [bookinglist, setbookinglist] = useState([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(null)
  const [isAdvance, setIsAdvance] = useState(false)
  const [isAdvance1, setIsAdvance1] = useState(false)
  const [advanceamount1, setAdvanceAmount1] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [request, setRequest] = useState(0)
  const [requestDetail, setRequestDetail] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [inputErrors, setInputErrors] = useState([])
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('')
  const [advancePaymentMethod1, setAdvancePaymentMethod1] = useState('')
  const [ready, setReady] = useState(false)
  const [advanceamount, setAdvanceAmount] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [bookid, setbookid] = useState('')
  const [includeTax, setIncludeTax] = useState(true)
  const totalRoomPrice = selectedRooms.reduce((sum, room) => {
    const base = room.acSelected ? Number(room.acPrice) : Number(room.nonAcPrice)
    const extra = room.extraBed ? Number(room.extraBedPrice || 0) : 0
    return sum + (base + extra) * stay // Multiply by stayDays
  }, 0)

  const taxableAmount = selectedRooms.reduce((sum, room) => {
    const base = room.acSelected ? Number(room.acPrice) : Number(room.nonAcPrice)
    const extra = room.extraBed ? Number(room.extraBedPrice || 0) : 0
    return sum + (base + extra) * stay // Multiply by stayDays
  }, 0)

  const taxAmount = includeTax ? taxableAmount * (parseFloat(taxper) / 100) : 0
  const grossTotal = totalRoomPrice + taxAmount
  const grandTotal = grossTotal - (isAdvance1 ? advanceamount1 : 0)

  useEffect(() => {
    const booking = bookingData ? JSON.parse(bookingData) : null
    const fetchrequest = async () => {
      if (booking) {
        try {
          const resp = await fetch(`/api/request-booking/detail?id=${booking}`)
          if (!resp.ok) throw new Error('Failed to fetch booking')
          const data = await resp.json()
          console.log('request booking', data.id)
          setbookid(data.id)
          setrequestbookid(data.id)
          setcustomername(data.customer.name)
          setcustomerphone(data.customer.phoneNumber || '')
          setNumberOfRooms(data.rooms || 1)
          setcustomerid(data.customer.id || '')
          setcustomercompany(data.customer.companyName || '')
          setSelectedCustomer(data.customer || null)
          setAdvanceAmount1(Number(data.payments[0].amount) || 0)
          setAdvancePaymentMethod1(data.payments[0].method)
          setCheckInDate(new Date(data.date))
          setIsAdvance1(data.isadvance)
          // if (data.rooms) {
          //   setSelectedRooms(data.rooms)
          //   setExpandedRooms(new Array(data.rooms.length).fill(false))
          // }
        } catch (error) {
          console.error('Error fetching booking details:', error)
        }
      }
    }
    fetchrequest()
    setReady(true)
  }, [bookingData])

  useEffect(() => {
    setExpandedRooms(selectedRooms.map(() => true))
  }, [selectedRooms])

  useEffect(() => {
    const newCheckOut = new Date(checkInDate)
    newCheckOut.setDate(newCheckOut.getDate() + 1)
    newCheckOut.setHours(
      checkInDate.getHours(),
      checkInDate.getMinutes(),
      checkInDate.getSeconds(),
      checkInDate.getMilliseconds()
    )
    setCheckOut(newCheckOut)
  }, [checkInDate])

  useEffect(() => {
    const fetchBookingOptions = async () => {
      try {
        const response = await fetch('/api/booking-options')
        const data = await response.json()
        setbookinglist(data.bookingTypes)
        setpurposelist(data.purposes)
        const resp = await fetch(`/api/tax?name=room`)
        const da = await resp.json()
        settaxper(da)
        console.log('tex percentage', da)
      } catch (error) {
        console.error('Error loading options:', error)
        return { purposes: [], bookingTypes: [] }
      }
    }
    fetchBookingOptions()
  }, [])

  const handleStayChange = e => {
    const inputValue = e.target.value

    if (inputValue === '') {
      setstay('')
      const newCheckOut = new Date(checkInDate)
      newCheckOut.setDate(newCheckOut.getDate() + 1)
      setCheckOut(newCheckOut)
      return
    }

    if (/^[1-9]\d*$/.test(inputValue)) {
      const numericValue = parseInt(inputValue, 10)
      setstay(numericValue)
      const newCheckOut = new Date(checkInDate)
      newCheckOut.setDate(newCheckOut.getDate() + numericValue)
      setCheckOut(newCheckOut)
    }
  }

  useEffect(() => {
    if (!ready) return
    async function fetchRoomsByFloor() {
      try {
        setisLoading(true)
        const response = await fetch(`/api/room/filter?checkInDate=${formatDate(checkInDate)}`)
        const data = await response.json()

        setRooms(data)
        const res = await fetch('/api/extrabed')
        const da = await res.json()
        console.log('extrabed', da[0].price)
        setextrabedprice(da[0].price)
      } catch (error) {
        console.log('error', error)
      } finally {
        setisLoading(false)
      }
    }
    fetchRoomsByFloor()
  }, [checkInDate, ready])

  useEffect(() => {
    async function fetchreuest() {
      // Convert local date to UTC ISO string
      const localDate = new Date(checkInDate)
      const utcDate = new Date(
        Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes(),
          localDate.getSeconds()
        )
      )
      const utcISOString = utcDate.toISOString()

      // Include current booking ID in the request if available
      const url = `/api/request-booking/check?date=${encodeURIComponent(utcISOString)}${
        requestbookid ? `&exclude=${requestbookid}` : ''
      }`

      const response = await fetch(url)
      const data = await response.json()
      setRequest(data.totalRooms)
      setRequestDetail(data.bookings)
    }

    if (checkInDate) {
      console.log('checkin (UTC)', new Date(checkInDate).toISOString())
      fetchreuest()
    }
  }, [checkInDate, requestbookid])

  const toggleAccordion = index => {
    setExpandedRooms(prev => {
      const newState = [...prev]
      newState[index] = !newState[index]
      return newState
    })
  }
  const formatDateToInput = date => {
    return date.toISOString().split('T')[0]
  }

  const formatDateToDDMMYYYY = date => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }
  const formatDate = date => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const handleManualDateChange = e => {
    try {
      const newDate = new Date(e.target.value)
      if (!isNaN(newDate.getTime())) {
        setCheckInDate(newDate)
        updateCheckInAndCheckOut()
      }
    } catch (error) {
      console.error('Invalid date format')
    }
  }

  const handleManualTimeChange = e => {
    const newTime = e.target.value
    const [hours, minutes] = newTime.split(':').map(Number)

    // Validate time for today
    if (isToday) {
      const selectedTime = new Date(checkInDate)
      selectedTime.setHours(hours, minutes)
      if (selectedTime < new Date()) {
        alert('Cannot select past times for today')
        return
      }
    }

    setCheckInTime(newTime)
    updateCheckInAndCheckOut()
  }
  const updateCheckInAndCheckOut = () => {
    const [hours, minutes] = checkInTime.split(':').map(Number)
    const newCheckIn = new Date(checkInDate)
    newCheckIn.setHours(hours, minutes, 0, 0)

    // Always set checkout to next day same time
    const newCheckOut = new Date(newCheckIn)
    newCheckOut.setDate(newCheckIn.getDate() + 1)

    setCheckOut(newCheckOut)
  }

  // Toggle occupancy details for a specific room
  const toggleOccupancyDetails = roomIndex => {
    setSelectedRooms(prevRooms =>
      prevRooms.map((room, index) =>
        index === roomIndex ? { ...room, showOccupancyDetails: !room.showOccupancyDetails } : room
      )
    )
  }

  // Handle occupancy data changes
  const handleOccupancyChange = (roomIndex, field, value) => {
    setSelectedRooms(prevRooms =>
      prevRooms.map((room, index) => (index === roomIndex ? { ...room, [field]: value } : room))
    )
  }

  // Open camera for specific room
  const openCameraForRoom = roomIndex => {
    setShowCamera(true)
    setCurrentRoomIndex(roomIndex)
  }

  // Handle captured image for specific room
  const handleCapturedImageForRoom = (roomIndex, imageFile) => {
    handleOccupancyChange(roomIndex, 'capturedImage', imageFile)
    setShowCamera(false)
    setCurrentRoomIndex(null)
  }

  const handleSubmit1 = async e => {
    e.preventDefault()
    try {
      // Start loading
      setisLoading(true)
      // ==== 1. VALIDATION ====
      if (!checkInDate || !checkInTime) {
        alert('Please select a check-in date and time.')
        return
      }
      if (selectedRooms.length === 0) {
        alert('Please select at least one room.')
        return
      }
      if (!customerid || !customername || !customerphone) {
        console.log(customerid, customername, customerphone)
        alert('Please provide customer details.')
        return
      }
      if (!arriveFrom) {
        alert('Please type where the customer is arrived from')
        return
      }

      // ==== 2. BUILD CHECK-IN AND CHECK-OUT DATES ====
      const checkIn = new Date(checkInDate)
      const [hours, minutes] = checkInTime.split(':')
      checkIn.setHours(Number(hours), Number(minutes), 0, 0)

      function formatDateForAPI(date) {
        return [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0'),
          'T',
          String(date.getHours()).padStart(2, '0'),
          ':',
          String(date.getMinutes()).padStart(2, '0'),
          ':00.000'
        ].join('')
      }
      // ==== 3. CONSTRUCT PAYLOAD ====
      const constructFormDataPayload = () => {
        const formData = new FormData()

        // Basic booking details
        formData.append('checkIn', formatDateForAPI(checkIn))
        formData.append('checkOut', formatDateForAPI(checkOut))
        formData.append('stay', stay)
        formData.append('customerId', Number(customerid))
        // formData.append('occupancy', selectedRooms.length)
        formData.append('bookingTypeId', 1)
        formData.append('purposeOfVisitId', purposelist.length > 0 ? purposelist[0]?.id : null)
        formData.append('bookingReferenceId', null)
        formData.append('arriveFrom', arriveFrom)
        formData.append('bookingid', bookid)
        formData.append('extrabedprice', extrabedprice)
        formData.append('transaction', advancePaymentReference)
        formData.append('type', true)
        formData.append('taxIncluded', includeTax)
        formData.append('requestbookingid', requestbookid)
        if (parseInt(advanceamount) > 0) {
          formData.append('advance', advanceamount)
          formData.append('advancePaymentMethod', advancePaymentMethod)
        }

        // Room arrays
        selectedRooms.forEach((room, index) => {
          formData.append(`roomIds[${index}]`, room.id)
          formData.append(`extraBeds[${index}]`, room.extraBed ? 1 : 0)
          formData.append(`adults[${index}]`, room.adults)
          formData.append(`children[${index}]`, room.children)
          formData.append(`isAcs[${index}]`, room.acSelected)
        })

        // Occupancy details (only for rooms that have them)
        let occupancyCount = 0
        selectedRooms.forEach((room, index) => {
          if (
            // room.showOccupancyDetails &&
            room.occupantName ||
            room.occupantAddress ||
            room.occupantPhone ||
            room.capturedImage
          ) {
            // Basic occupancy info
            formData.append(`occupancyDetails[${occupancyCount}][roomIndex]`, index)
            formData.append(`occupancyDetails[${occupancyCount}][roomId]`, room.id)

            if (room.occupantName) {
              formData.append(`occupancyDetails[${occupancyCount}][occupantName]`, room.occupantName)
            }
            if (room.occupantAddress) {
              formData.append(`occupancyDetails[${occupancyCount}][occupantAddress]`, room.occupantAddress)
            }
            if (room.occupantPhone) {
              formData.append(`occupancyDetails[${occupancyCount}][occupantPhone]`, room.occupantPhone)
            }

            // Image file
            if (room.capturedImage) {
              formData.append(`occupancyImages[${occupancyCount}]`, room.capturedImage, `room_${room.id}_occupant.jpg`)
            }

            occupancyCount++
          }
        })

        return formData
      }

      // ==== 4. SEND API REQUEST ====
      const formData = constructFormDataPayload()
      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }
      const token = localStorage.getItem('token')
      // Send API request with FormData
      const res = await axios.post('/api/booking', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      // ==== 5. HANDLE SUCCESS ====
      alert(res.data.message || 'Booking successful')
      router.push('/dashboards/booking')
      setOpenModal(false)

      // Optional: Clear form
      setSelectedRooms([])
      setarriveFrom('')
      setcustomerid('')
      setcustomername('')
      setcustomerphone('')
      setcustomercompany('')
      setAdvanceAmount(0)
    } catch (error) {
      console.error('Booking error:', error)
      alert(error?.response?.data?.message || 'Booking failed')
    } finally {
      setisLoading(false)
    }
  }
  const handleAcChange = (index, checked) => {
    setSelectedRooms(prev => prev.map((room, i) => (i === index ? { ...room, acSelected: checked } : room)))
  }
  const handleGuestChange = (index, field, value) => {
    const updatedRooms = [...selectedRooms]
    const room = updatedRooms[index]
    const otherField = field === 'adults' ? 'children' : 'adults'
    const currentOtherValue = room[otherField] || 0
    const totalGuests = field === 'adults' ? value + currentOtherValue : value + room.adults

    // Clear existing errors for this field
    setInputErrors(prev => prev.filter(error => !(error.index === index && error.field === field)))

    if (totalGuests > room.occupancy) {
      const allowedValue = room.occupancy - currentOtherValue
      const message = `Maximum ${allowedValue} ${field} allowed (${room.occupancy} total guests)`

      // Set error state
      setInputErrors(prev => [...prev, { index, field, message }])

      // Apply the limit
      updatedRooms[index] = {
        ...room,
        [field]: Math.max(0, allowedValue)
      }
    } else {
      updatedRooms[index] = {
        ...room,
        [field]: value
      }
    }
    setSelectedRooms(updatedRooms)
  }

  const handleExtraBedChange = (index, checked) => {
    setSelectedRooms(prev => prev.map((room, i) => (i === index ? { ...room, extraBed: checked } : room)))
  }

  const handleRemoveRoom = index => {
    setSelectedRooms(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Suspense fallback={<TransparentLoader />}>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6'>
        {isLoading && <TransparentLoader />}
        <form
          onSubmit={e => {
            e.preventDefault()
          }}
          className='max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-8'
        >
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Side - Booking Details */}
            <div className='lg:col-span-2 p-4 bg-white shadow rounded-xl space-y-6'>
              {/* Date and Time Inputs */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div>
                  <label className='block mb-1 text-sm font-medium text-gray-700'>Check-in Date</label>
                  <input
                    type='date'
                    value={formatDateToInput(checkInDate)}
                    onChange={handleManualDateChange}
                    // min={formatDateToInput(new Date())} // Prevent past dates
                    className='w-full px-3 py-2 border rounded-lg'
                  />
                </div>
                <div>
                  <label className='block mb-1 text-sm font-medium text-gray-700'>Check-in Time</label>
                  <input
                    type='time'
                    value={checkInTime}
                    onChange={handleManualTimeChange}
                    className='w-full px-3 py-2 border rounded-lg'
                    // min={isToday ? currentTime : undefined}
                  />
                </div>
                <div>
                  <label className='block mb-1 text-sm font-medium text-gray-700'>Check-out (auto)</label>
                  <input
                    type='text'
                    value={checkOut ? formatDateToDDMMYYYY(checkOut) : ''}
                    disabled
                    className='w-full px-3 py-2 border bg-gray-100 rounded-lg'
                  />
                </div>
              </div>
              <div className='flex flex-col'>
                <label className='text-sm font-medium text-gray-700 mb-1'>Number of days</label>
                <input
                  type='number'
                  min='1'
                  value={stay}
                  onChange={handleStayChange}
                  className='w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
                <p className='text-xs text-gray-500 mt-1'>Check-out will be: {checkOut.toLocaleDateString()}</p>
              </div>
              {/* Number of Rooms */}
              <div className='flex flex-col sm:flex-row items-center justify-between gap-4 w-full'>
                <div className='flex items-center gap-4'>
                  <label className='text-sm font-medium'>Number of Rooms:</label>
                  <select
                    value={numberOfRooms}
                    onChange={e => {
                      const value = Number(e.target.value)
                      const totalAvailableRooms = rooms.filter(
                        r =>
                          r.status !== 'BOOKED' &&
                          !requestDetail.some(
                            reservation =>
                              reservation.rooms && reservation.rooms.some(reservedRoom => reservedRoom.id === r.id)
                          )
                      ).length

                      const selectableRooms = totalAvailableRooms - request

                      if (value > selectableRooms) {
                        alert(
                          `Only ${selectableRooms} rooms are available for selection. ${request} room(s) are reserved.`
                        )
                        return
                      }

                      setNumberOfRooms(value)
                      setSelectedRooms(selectedRooms.slice(0, value))
                    }}
                    className='px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  >
                    {(() => {
                      const availableRoomsCount = rooms.filter(
                        r =>
                          r.status !== 'BOOKED' &&
                          !requestDetail.some(
                            reservation =>
                              reservation.rooms && reservation.rooms.some(reservedRoom => reservedRoom.id === r.id)
                          )
                      ).length

                      const selectableRooms = availableRoomsCount - request
                      return Array.from({ length: Math.max(1, selectableRooms) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))
                    })()}
                  </select>

                  {/* Show available vs total rooms info */}
                  <span className='text-sm text-gray-600'>
                    (
                    {
                      rooms.filter(
                        r =>
                          r.status !== 'BOOKED' &&
                          !requestDetail.some(
                            reservation =>
                              reservation.rooms && reservation.rooms.some(reservedRoom => reservedRoom.id === r.id)
                          )
                      ).length
                    }{' '}
                    available of {rooms.length} total)
                  </span>
                </div>

                {/* Total Booking Requests Badge */}
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                    request > 0
                      ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-orange-200 animate-pulse'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <span
                    className={`text-sm font-medium flex items-center gap-1 ${
                      request > 0 ? 'text-orange-600' : 'text-gray-500'
                    }`}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4'
                      viewBox='0 0 24 24'
                      strokeWidth='2'
                      stroke='currentColor'
                      fill='none'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
                      />
                    </svg>
                    Reservations
                  </span>
                  <span
                    className={`text-xl font-bold px-3 py-1 rounded-full ${
                      request > 0 ? 'text-orange-700 bg-white ring-2 ring-orange-200' : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    {request}
                  </span>
                </div>
              </div>

              {/* Available Rooms */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
                {rooms.map(room => {
                  const isSelected = selectedRooms.find(r => r.id === room.id)
                  const isBooked = room.status === 'BOOKED'
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRooms(selectedRooms.filter(r => r.id !== room.id))
                        } else if (!isBooked) {
                          const maxSelectable = numberOfRooms

                          if (selectedRooms.length >= maxSelectable) {
                            alert(`You can only select ${maxSelectable} room(s).`)
                            return
                          }

                          setSelectedRooms([
                            ...selectedRooms,
                            {
                              ...room,
                              acSelected: true,
                              adults: 1,
                              children: 0,
                              extraBed: false
                            }
                          ])
                        }
                      }}
                      className={`flex items-center h-14 p-0 rounded-lg overflow-hidden border-2 transition-all ${
                        isBooked
                          ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-100 border-blue-500 shadow-lg'
                            : 'bg-white border-gray-200 hover:border-green-500'
                      }`}
                      disabled={isBooked}
                    >
                      {/* Vertical status indicator */}
                      <div
                        className={`w-10 h-full flex items-center justify-center text-white font-bold ${
                          isBooked ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      >
                        {isBooked ? 'B' : 'A'}
                      </div>

                      {/* Room number */}
                      <span
                        className={`flex-1 text-xl font-bold ${
                          isSelected ? 'text-blue-800' : isBooked ? 'text-yellow-900' : 'text-green-800'
                        }`}
                      >
                        {room.roomNumber}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Selected Rooms Details Accordion */}
              {selectedRooms.map((room, index) => {
                const basePrice = room.acSelected ? Number(room.acPrice) : Number(room.nonAcPrice)
                const extraBedPrice = room.extraBed ? Number(room.extraBedPrice || 0) : 0
                const totalPrice = basePrice + extraBedPrice
                const maxOccupancy = room.occupancy

                return (
                  <div key={room.id} className='border rounded-xl p-4 mt-4 shadow-lg bg-white'>
                    <div
                      className='flex items-center justify-between cursor-pointer'
                      onClick={() => toggleAccordion(index)}
                    >
                      <div>
                        <h4 className='text-lg font-semibold text-gray-800'>Room #{room.roomNumber}</h4>
                        <div className='flex gap-10'>
                          <p className='text-sm text-gray-500'>Total: ₹{totalPrice}</p>
                          <p>Maximum occupancy : {maxOccupancy}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleRemoveRoom(index)
                          }}
                          className='text-red-500 text-sm hover:underline'
                        >
                          Remove
                        </button>
                        <button className='text-sm text-blue-600 hover:underline'>
                          {expandedRooms[index] ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Body */}
                    {expandedRooms[index] && (
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4'>
                        {/* Adults */}
                        <div>
                          <label className='block text-sm font-medium mb-1'>Adults</label>
                          <input
                            type='number'
                            min='1'
                            value={room.adults}
                            onChange={e => {
                              const newAdults = Math.max(1, Number(e.target.value))
                              handleGuestChange(index, 'adults', newAdults)
                            }}
                            className={`w-full px-3 py-2 border rounded-lg ${
                              room.adults + room.children > maxOccupancy ? 'border-red-500' : ''
                            }`}
                          />
                        </div>

                        {/* Children */}
                        <div>
                          <label className='block text-sm font-medium mb-1'>Children</label>
                          <input
                            type='number'
                            min='0'
                            value={room.children}
                            onChange={e => {
                              const newChildren = Math.max(0, Number(e.target.value))
                              handleGuestChange(index, 'children', newChildren)
                            }}
                            className={`w-full px-3 py-2 border rounded-lg ${
                              room.adults + room.children > maxOccupancy ? 'border-red-500' : ''
                            }`}
                          />
                        </div>

                        {/* Occupancy Error Message */}
                        {parseInt(room.adults) + parseInt(room.children) > maxOccupancy && (
                          <div className='col-span-2'>
                            <p className='text-red-500 text-sm'>
                              Total guests exceed room capacity. Max allowed: {maxOccupancy}.
                            </p>
                          </div>
                        )}

                        {/* AC Selection */}
                        <div className='col-span-2 flex items-center gap-2 mt-2'>
                          <input
                            type='checkbox'
                            checked={room.acSelected || false}
                            onChange={e => handleAcChange(index, e.target.checked)}
                            id={`ac-${index}`}
                            className='form-checkbox'
                          />
                          <label htmlFor={`ac-${index}`} className='text-sm font-medium'>
                            AC Room (₹{room.acPrice}) / Non-AC (₹{room.nonAcPrice})
                          </label>
                        </div>

                        {/* Extra Bed */}
                        <div className='col-span-2 flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={room.extraBed || false}
                            onChange={e => handleExtraBedChange(index, e.target.checked)}
                            id={`extraBed-${index}`}
                            className='form-checkbox'
                          />
                          <label htmlFor={`extraBed-${index}`} className='text-sm font-medium'>
                            Extra Bed (+₹{room.extraBedPrice || 0})
                          </label>
                        </div>

                        {/* Auto-calculated Price */}
                        <div className='col-span-2'>
                          <label className='block text-sm font-medium mb-1'>Total Price</label>
                          <input
                            type='number'
                            value={totalPrice}
                            disabled
                            className='w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed'
                          />
                        </div>

                        {/* NEW: Occupancy Details Toggle */}
                        <div className='col-span-2 border-t pt-4 mt-4'>
                          <button
                            type='button'
                            onClick={() => toggleOccupancyDetails(index)}
                            className='flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors'
                          >
                            <Users className='w-4 h-4' />
                            <span className='text-sm font-medium'>
                              {room.showOccupancyDetails ? 'Hide Occupancy Details' : 'Add Occupancy Details'}
                            </span>
                            {room.showOccupancyDetails ? (
                              <ChevronUp className='w-4 h-4' />
                            ) : (
                              <ChevronDown className='w-4 h-4' />
                            )}
                          </button>

                          {/* Occupancy Details Form */}
                          {room.showOccupancyDetails && (
                            <div className='mt-4 space-y-4 bg-gray-50 p-4 rounded-lg'>
                              <h4 className='text-md font-medium text-gray-800'>
                                Occupancy Details for Room #{room.roomNumber}
                              </h4>

                              {/* Occupant Name */}
                              <div>
                                <label className='block text-sm font-medium mb-1'>Occupant Full Name</label>
                                <input
                                  value={room.occupantName || ''}
                                  onChange={e => handleOccupancyChange(index, 'occupantName', e.target.value)}
                                  className='w-full p-3 border rounded-lg'
                                  placeholder='Enter occupant name'
                                />
                              </div>

                              {/* Occupant Address */}
                              <div>
                                <label className='block text-sm font-medium mb-1'>Occupant Address</label>
                                <input
                                  value={room.occupantAddress || ''}
                                  onChange={e => handleOccupancyChange(index, 'occupantAddress', e.target.value)}
                                  className='w-full p-3 border rounded-lg'
                                  placeholder='Enter occupant address'
                                />
                              </div>

                              {/* Occupant Phone */}
                              <div>
                                <label className='block text-sm font-medium mb-1'>Occupant Phone</label>
                                <input
                                  value={room.occupantPhone || ''}
                                  onChange={e => handleOccupancyChange(index, 'occupantPhone', e.target.value)}
                                  className='w-full p-3 border rounded-lg'
                                  placeholder='Enter occupant phone number'
                                />
                              </div>

                              {/* Photo Capture */}
                              <div>
                                <label className='block text-sm font-medium mb-1'>Occupant Photo</label>
                                <div className='flex flex-col items-center gap-3'>
                                  {room.capturedImage ? (
                                    <div className='relative'>
                                      <img
                                        src={URL.createObjectURL(room.capturedImage)}
                                        alt='Captured occupant'
                                        className='w-32 h-32 object-cover rounded-lg border'
                                      />
                                      <button
                                        type='button'
                                        onClick={() => handleOccupancyChange(index, 'capturedImage', null)}
                                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                                      >
                                        <X className='w-4 h-4' />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      className='border-2 border-dashed rounded-lg w-full p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors'
                                      onClick={() => openCameraForRoom(index)}
                                    >
                                      <div className='flex flex-col items-center justify-center gap-2'>
                                        <Camera className='w-8 h-8 text-gray-400' />
                                        <p className='text-sm text-gray-500'>Tap to take photo</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Billing Summary Section */}
              {selectedRooms.length > 0 && (
                <div className='mt-8 border-t pt-6 bg-white shadow-lg rounded-xl p-6'>
                  <h3 className='text-xl font-semibold mb-4 text-gray-800'>Billing Summary</h3>

                  <div className='space-y-4'>
                    {selectedRooms.map((room, index) => {
                      const basePrice = room.acSelected ? Number(room.acPrice) : Number(room.nonAcPrice)
                      const extraBedPrice = room.extraBed ? Number(room.extraBedPrice || 0) : 0
                      const total = basePrice + extraBedPrice

                      return (
                        <div key={index} className='flex justify-between text-sm text-gray-700'>
                          <span>
                            Room #{room.roomNumber} ({room.acSelected ? 'AC' : 'Non-AC'}
                            {room.extraBed ? ', Extra Bed' : ''})
                          </span>
                          <span>₹{total.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Subtotal, Tax, Grand Total */}
                  <div className='mt-6 border-t pt-4 text-sm text-gray-800 space-y-2'>
                    <div className='mb-4'>
                      <label className='flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={includeTax}
                          onChange={e => setIncludeTax(e.target.checked)}
                          className='mr-2 h-4 w-4 text-indigo-600 rounded'
                        />
                        <span className='text-gray-700'>Include Tax ({taxper}%)</span>
                      </label>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span>Subtotal {stay > 1 ? `(${stay} days)` : '(1 day)'}</span>
                        <span>₹{totalRoomPrice.toFixed(2)}</span>
                      </div>

                      {includeTax && (
                        <div className='flex justify-between'>
                          <span>Tax ({taxper}%)</span>
                          <span>₹{taxAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {isAdvance1 && (
                        <div className='flex justify-between text-green-700'>
                          <span>Advance Paid ({advancePaymentMethod1})</span>
                          <span>- ₹{advanceamount1.toFixed(2)}</span>
                        </div>
                      )}

                      <div className='flex justify-between font-semibold text-base'>
                        <span>Total Amount</span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Advance Payment Checkbox */}
                    <div className='flex items-center gap-2 mt-4'>
                      <input
                        type='checkbox'
                        id='advance'
                        className='form-checkbox'
                        checked={isAdvance}
                        onChange={e => setIsAdvance(e.target.checked)}
                      />
                      <label htmlFor='advance' className='text-sm font-medium'>
                        Pay Advance
                      </label>
                    </div>

                    {/* Advance Amount if selected */}
                    {isAdvance && (
                      <div className='space-y-4'>
                        {/* Payment Method Dropdown */}
                        <div className='flex items-center justify-between text-sm text-gray-700'>
                          <label className='mb-1 font-medium'>Payment Method</label>
                          <select
                            value={advancePaymentMethod}
                            onChange={e => {
                              setAdvancePaymentMethod(e.target.value)
                            }}
                            className='w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]'
                          >
                            <option value='' disabled selected={!advancePaymentMethod}>
                              Select Method
                            </option>
                            {paymentMethod.map(method => (
                              <option key={method.id} value={method.id}>
                                {method.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Advance Amount Input */}
                        <div className='flex items-center justify-between  text-sm text-gray-700'>
                          <label className='mb-1 font-medium'>Advance Amount</label>
                          <div className='flex items-center gap-2'>
                            <span className='text-lg text-gray-700'>₹</span>
                            <input
                              type='number'
                              min={0}
                              value={advanceamount}
                              onChange={e => setAdvanceAmount(e.target.value)}
                              className='w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]'
                              placeholder='Enter amount'
                            />
                          </div>
                        </div>

                        {/* Optional Reference Field */}
                        {advancePaymentMethod && advancePaymentMethod !== '0' && (
                          <div className='flex items-center justify-between  text-sm text-gray-700'>
                            <label className='mb-1 font-medium'>
                              {advancePaymentMethod === 'CARD' ? 'Transaction number' : 'Transaction ID'}
                            </label>
                            <input
                              type='text'
                              value={advancePaymentReference}
                              onChange={e => setAdvancePaymentReference(e.target.value)}
                              className='w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]'
                              placeholder={
                                advancePaymentMethod === 'CARD' ? 'Enter Transaction number' : 'Enter transaction ID'
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className='mt-6'>
                    <button
                      onClick={e => {
                        handleSubmit1(e)
                      }}
                      className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition'
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Customer Details */}
            <div className='lg:col-span-1 space-y-5'>
              <h2 className='text-2xl font-bold text-gray-800'>Customer Details</h2>
              <p className='text-sm text-gray-500'>
                Fields marked with <span className='text-red-500'>*</span> are required
              </p>
              <div className='space-y-4'>
                {/* Phone Number Search */}
                <div>
                  <label className='block text-sm font-medium mb-1'>Phone Number</label>
                  <div className='relative'>
                    <div className='flex gap-2'>
                      <input
                        value={customerphone}
                        onChange={async e => {
                          setcustomerphone(e.target.value)
                          if (e.target.value.length >= 3) {
                            const res = await fetch(`/api/customers/search?phone=${e.target.value}`)
                            const data = await res.json()
                            setSearchResults(data)
                          }
                        }}
                        className={`w-full p-3 border rounded-lg pr-10 ${
                          customerphone && !customerid ? 'border-red-500' : ''
                        }`}
                        placeholder='Search by phone number'
                      />
                      <button
                        type='button'
                        onClick={() => {
                          if (!customerid) {
                            setOpenModal(true)
                          } else {
                            setcustomerid('')
                            setcustomername('')
                            setcustomerphone('')
                            setcustomercompany('')
                          }
                        }}
                        className={`px-4 rounded-lg ${
                          customerid ? 'bg-red-400 hover:bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {customerid ? 'x' : '+'}
                      </button>
                    </div>

                    {/* Add error message when needed */}
                    {customerphone && !customerid && (
                      <p className='text-red-500 text-xs mt-1'>
                        Customer not found. Please add a new customer by clicking the "+" button.
                      </p>
                    )}

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && customerphone && (
                      <div className='absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg'>
                        {searchResults.map(customer => (
                          <div
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setcustomerid(customer.id)
                              setcustomername(customer.name)
                              setcustomercompany(customer.companyName)
                              setcustomerphone(customer.phoneNumber)
                              setSearchResults([])
                            }}
                            className='p-2 hover:bg-gray-100 cursor-pointer'
                          >
                            {customer.name} - {customer.phoneNumber}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Show customer details if selected */}
                {customerid && (
                  <>
                    <div>
                      <label className='block text-sm font-medium mb-1'>Full Name</label>
                      <input value={customername} className='w-full p-3 border rounded-lg bg-gray-50' readOnly />
                    </div>

                    <div>
                      <label className='block text-sm font-medium mb-1'>Company Name</label>
                      <input value={customercompany} className='w-full p-3 border rounded-lg bg-gray-50' readOnly />
                    </div>
                  </>
                )}

                {/* Other Fields (keep existing code) */}
                <div className='space-y-4'>
                  {/* Helper text at the top */}

                  {/* Purpose of Visit */}
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Purpose of Visit <span className='text-red-500'>*</span>
                    </label>
                    <select
                      className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      required
                    >
                      <option value='' disabled selected>
                        Select purpose
                      </option>
                      {purposelist?.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Arrived From */}
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Arrived From <span className='text-red-500'>*</span>
                    </label>
                    <input
                      value={arriveFrom}
                      onChange={e => setarriveFrom(e.target.value)}
                      className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      required
                    />
                  </div>

                  {/* Booking Type */}
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Booking Type <span className='text-red-500'>*</span>
                    </label>
                    <select
                      className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      required
                    >
                      <option value='' disabled selected>
                        Select booking type
                      </option>
                      {bookinglist?.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        <CameraModal
          isOpen={showCamera}
          onClose={() => {
            setShowCamera(false)
            setCurrentRoomIndex(null)
          }}
          onCapture={file => {
            if (currentRoomIndex !== null) {
              handleCapturedImageForRoom(currentRoomIndex, file)
            }
          }}
        />

        <AddCustomerModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          initialPhone={customerphone}
          initialName={customername}
          onSave={newCustomer => {
            setcustomerid(newCustomer.id)
            setcustomername(newCustomer.name)
            setcustomerphone(newCustomer.phone)
            setcustomercompany(newCustomer.company)
          }}
        />
      </div>
    </Suspense>
  )
}
