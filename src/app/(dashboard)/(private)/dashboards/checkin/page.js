// 'use client'

// import { useState, useEffect, Suspense } from 'react'
// import axios from 'axios'
// import { useRouter } from 'next/navigation'

// export default function CheckInPage() {
//   const [bookingDetails, setBookingDetails] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [occupancies, setOccupancies] = useState([])
//   const [isCustomerStaying, setIsCustomerStaying] = useState(false)
//   const router = useRouter()
//   const [showOccupancyModal, setShowOccupancyModal] = useState(false)
//   const [showCheckInModal, setShowCheckInModal] = useState(false)
//   const [bookedRooms, setBookedRooms] = useState([])
//   const [selectedRoom, setSelectedRoom] = useState(null)
//   const [currentRoomIndex, setCurrentRoomIndex] = useState(0)

//   // Format date for API call
//   const formatDate = date => {
//     const day = String(date.getUTCDate()).padStart(2, '0')
//     const month = String(date.getUTCMonth() + 1).padStart(2, '0')
//     const year = date.getUTCFullYear()
//     return `${day}-${month}-${year}`
//   }

//   useEffect(() => {
//     async function fetchBookedRooms() {
//       setLoading(true)
//       try {
//         const today = new Date()
//         const response = await fetch(`/api/room/checked?checkInDate=${formatDate(today)}`)
//         const data = await response.json()

//         // Filter only rooms that are booked
//         const bookedRoomsData = data.map(room => ({
//           id: room.id,
//           roomNumber: room.roomNumber,
//           roomName: room.roomName,
//           floorName: room.floorName,
//           bookingId: room.bookingId,
//           occupancy: room.occupancy || 1
//         }))

//         setBookedRooms(bookedRoomsData)
//       } catch (error) {
//         console.error('Error fetching booked rooms:', error)
//         setError('Failed to fetch booked rooms')
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchBookedRooms()
//   }, [])

//   const fetchBookingDetails = async roomNumber => {
//     if (!roomNumber) {
//       setError('Please select a room')
//       return
//     }
//     setLoading(true)
//     setError('')
//     try {
//       const response = await axios.get(`/api/check-in?roomNumber=${roomNumber}`)
//       const booking = response.data.booking

//       if (!booking) {
//         throw new Error('No booking data found')
//       }

//       setBookingDetails(response.data)

//       // Initialize occupancies for all rooms
//       if (booking.bookedRooms && Array.isArray(booking.bookedRooms)) {
//         const initialOccupancies = booking.bookedRooms.map(room => ({
//           bookingRoomId: room.id,
//           name: '',
//           address: '',
//           phone: '',
//           photo: '',
//           aadhaarPhoto: ''
//         }))
//         setOccupancies(initialOccupancies)
//       } else {
//         setOccupancies([])
//         setError('No rooms found in this booking')
//       }

//       // Show check-in modal after fetching details
//       setShowCheckInModal(true)
//     } catch (error) {
//       console.error('Error fetching booking:', error)
//       setError(error.response?.data?.error || 'Failed to fetch booking details')
//       setBookingDetails(null)
//       setOccupancies([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleSelectRoom = roomNumber => {
//     setSelectedRoom(roomNumber)
//     fetchBookingDetails(roomNumber)
//   }

//   const handleCustomerStayChange = checked => {
//     setIsCustomerStaying(checked)

//     if (checked && bookingDetails) {
//       // Fill first occupancy with customer details
//       const customer = bookingDetails.booking.customer
//       const updatedOccupancies = [...occupancies]
//       if (updatedOccupancies.length > 0) {
//         updatedOccupancies[currentRoomIndex] = {
//           ...updatedOccupancies[currentRoomIndex],
//           name: customer.name || '',
//           address: customer.address || '',
//           phone: customer.phoneNumber || '',
//           photo: customer.picture || '',
//           aadhaarPhoto: customer.aadhaarPicture || ''
//         }
//         setOccupancies(updatedOccupancies)
//       }
//     }
//   }

//   const handleCheckInContinue = () => {
//     if (!isCustomerStaying) {
//       // If customer is not staying, show occupancy modal
//       setShowCheckInModal(false)
//       setShowOccupancyModal(true)
//     } else {
//       // If customer is staying, proceed directly with check-in
//       handleOccupancySubmit()
//     }
//   }

//   const handleOccupancyChange = (index, field, value) => {
//     const updatedOccupancies = [...occupancies]
//     updatedOccupancies[index] = {
//       ...updatedOccupancies[index],
//       [field]: value
//     }
//     setOccupancies(updatedOccupancies)
//   }

//   const handleFileUpload = async (index, fileType, file) => {
//     if (!file) return

//     const formData = new FormData()
//     formData.append('file', file)
//     formData.append('type', fileType)

//     try {
//       const response = await axios.post('/api/upload', formData)
//       handleOccupancyChange(index, fileType === 'photo' ? 'photo' : 'aadhaarPhoto', response.data.filePath)
//     } catch (error) {
//       console.error(`Error uploading ${fileType}:`, error)
//       setError(`Failed to upload ${fileType}`)
//     }
//   }

//   // Handle check-in for a single room
//   const handleOccupancySubmit = async () => {
//     if (!bookingDetails) return

//     try {
//       setLoading(true)

//       // Get the current room being checked in
//       const currentRoom = bookingDetails.booking.bookedRooms[currentRoomIndex]
//       const validOccupancy = occupancies[currentRoomIndex]

//       // Only check in this specific room
//       await axios.post('/api/check-in', {
//         bookingId: bookingDetails.booking.bookingId,
//         roomId: currentRoom.roomId, // Send the specific room ID
//         occupancies: [validOccupancy], // Only send the occupancy for this room
//         isCustomerStaying
//       })

//       alert(`Room ${currentRoom.room.roomNumber} checked in successfully!`)

//       // Reset UI state
//       setShowOccupancyModal(false)
//       setShowCheckInModal(false)
//       setSelectedRoom(null)

//       // Remove the checked-in room from the list
//       const updatedBookedRooms = bookedRooms.filter(room => room.roomNumber !== currentRoom.room.roomNumber)
//       setBookedRooms(updatedBookedRooms)

//       // If all rooms are checked in, redirect to dashboard
//       if (updatedBookedRooms.length === 0) {
//         router.push('/dashboards/home')
//       }
//     } catch (error) {
//       console.error('Error during check-in:', error)
//       setError(error.response?.data?.error || 'Check-in failed')
//     } finally {
//       setLoading(false)
//     }
//   }
//   return (
//     <Suspense fallback={<p>Loading search params...</p>}>
//       <div className='container mx-auto px-4 py-8'>
//         <h1 className='text-3xl font-bold mb-8 text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
//           Room Check-In
//         </h1>

//         {error && (
//           <div className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-sm'>{error}</div>
//         )}

//         {/* Room Selection Grid */}
//         <div className='mb-8'>
//           <h2 className='text-xl font-semibold mb-6 text-gray-700 flex items-center'>
//             <svg className='w-6 h-6 mr-2 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
//               <path
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//                 strokeWidth={2}
//                 d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 5h1m4-5h1m-1 5h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
//               />
//             </svg>
//             Select Room for Check-In
//           </h2>

//           {loading && (
//             <div className='flex items-center justify-center py-8'>
//               <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
//             </div>
//           )}

//           {!loading && bookedRooms.length === 0 && (
//             <div className='text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
//               <p className='text-gray-500 italic'>No pending check-ins found</p>
//             </div>
//           )}

//           <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
//             {bookedRooms.map(room => (
//               <div
//                 key={room.id}
//                 className={`relative p-6 rounded-xl transition-all transform duration-300 cursor-pointer
//                 ${
//                   selectedRoom === room.roomNumber
//                     ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-[1.02]'
//                     : 'bg-white hover:shadow-xl border border-gray-200 hover:border-blue-200'
//                 }`}
//                 onClick={() => handleSelectRoom(room.roomNumber)}
//               >
//                 {selectedRoom === room.roomNumber && (
//                   <div className='absolute top-2 right-2 text-blue-600'>
//                     <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
//                       <path
//                         fillRule='evenodd'
//                         d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
//                         clipRule='evenodd'
//                       />
//                     </svg>
//                   </div>
//                 )}

//                 <div className='space-y-3'>
//                   <div className='flex items-center justify-between'>
//                     <h3 className='text-xl font-bold text-gray-800'>{room.roomNumber}</h3>
//                     <span className='px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800'>
//                       {room.occupancy} Guests
//                     </span>
//                   </div>

//                   <div className='space-y-1'>
//                     <p className='text-gray-600 font-medium flex items-center'>
//                       <svg className='w-4 h-4 mr-2 text-purple-500' fill='currentColor' viewBox='0 0 20 20'>
//                         <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
//                       </svg>
//                       {room.roomName}
//                     </p>
//                     <p className='text-sm text-gray-500 flex items-center'>
//                       <svg className='w-4 h-4 mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 5h1m4-5h1m-1 5h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
//                         />
//                       </svg>
//                       {room.floorName}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Check-In Modal */}
//         {showCheckInModal && bookingDetails && (
//           <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
//             <div className='bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
//               <h2 className='text-xl font-bold mb-4'>
//                 Confirm Check-In for Room {bookingDetails.booking.bookedRooms[currentRoomIndex]?.room.roomNumber}
//               </h2>

//               <BookingDetails bookingDetails={bookingDetails} />

//               <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
//                 <div className='mb-4'>
//                   <label className='flex items-center'>
//                     <input
//                       type='checkbox'
//                       checked={isCustomerStaying}
//                       onChange={e => handleCustomerStayChange(e.target.checked)}
//                       className='mr-2'
//                     />
//                     <span>Booking customer is staying</span>
//                   </label>
//                   {isCustomerStaying && (
//                     <p className='text-sm text-gray-600 mt-2 ml-6'>Customer details will be used for occupancy</p>
//                   )}
//                 </div>
//               </div>

//               <div className='flex justify-end gap-4 mt-6'>
//                 <button
//                   onClick={() => setShowCheckInModal(false)}
//                   className='px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleCheckInContinue}
//                   className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
//                   disabled={loading}
//                 >
//                   {loading ? 'Processing...' : 'Continue'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Occupancy Modal */}
//         {showOccupancyModal && bookingDetails && (
//           <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
//             <div className='bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
//               <h2 className='text-xl font-bold mb-4'>
//                 Occupancy Details for Room {bookingDetails.booking.bookedRooms[currentRoomIndex]?.room.roomNumber}
//               </h2>

//               {/* This is the critical part - using currentRoomIndex to show only relevant room */}
//               <div className='mb-6 p-4 border rounded'>
//                 <h4 className='font-medium mb-2'>
//                   Room{' '}
//                   {bookingDetails.booking.bookedRooms[currentRoomIndex]?.room.roomNumber ||
//                     `#${bookingDetails.booking.bookedRooms[currentRoomIndex]?.roomId}`}
//                 </h4>

//                 <OccupancyForm
//                   occupancy={occupancies[currentRoomIndex]}
//                   onChange={(field, value) => handleOccupancyChange(currentRoomIndex, field, value)}
//                   onFileUpload={(fileType, file) => handleFileUpload(currentRoomIndex, fileType, file)}
//                 />
//               </div>

//               <div className='flex justify-end gap-4 mt-6'>
//                 <button
//                   onClick={() => {
//                     setShowOccupancyModal(false)
//                     setShowCheckInModal(true)
//                   }}
//                   className='px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
//                 >
//                   Back
//                 </button>
//                 <button
//                   onClick={handleOccupancySubmit}
//                   className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
//                   disabled={loading}
//                 >
//                   {loading ? 'Submitting...' : 'Complete Check-In'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </Suspense>
//   )
// }
// function BookingDetails({ bookingDetails }) {
//   if (!bookingDetails) return null

//   return (
//     <div className='bg-white shadow rounded-lg p-4 mb-4'>
//       <h3 className='text-lg font-semibold mb-3'>Booking Information</h3>
//       <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
//         <div>
//           <p className='text-sm text-gray-600'>Customer</p>
//           <p className='font-medium'>{bookingDetails.booking.customer.name}</p>
//         </div>
//         <div>
//           <p className='text-sm text-gray-600'>Contact</p>
//           <p className='font-medium'>{bookingDetails.booking.customer.phoneNumber}</p>
//         </div>
//         <div>
//           <p className='text-sm text-gray-600'>Check-In</p>
//           <p className='font-medium'>{new Date(bookingDetails.booking.checkIn).toLocaleString()}</p>
//         </div>
//         <div>
//           <p className='text-sm text-gray-600'>Check-Out</p>
//           <p className='font-medium'>{new Date(bookingDetails.booking.checkOut).toLocaleString()}</p>
//         </div>
//         <div>
//           <p className='text-sm text-gray-600'>Purpose</p>
//           <p className='font-medium'>{bookingDetails.booking.purposeOfVisit.name}</p>
//         </div>
//         <div>
//           <p className='text-sm text-gray-600'>Booking Type</p>
//           <p className='font-medium'>{bookingDetails.booking.bookingType.name}</p>
//         </div>
//       </div>
//     </div>
//   )
// }

// function OccupancyForm({ occupancy, onChange, onFileUpload }) {
//   return (
//     <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
//       <div>
//         <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
//         <input
//           type='text'
//           value={occupancy.name}
//           onChange={e => onChange('name', e.target.value)}
//           className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
//           placeholder='Enter occupant name'
//         />
//       </div>

//       <div>
//         <label className='block text-sm font-medium text-gray-700 mb-1'>Phone Number</label>
//         <input
//           type='text'
//           value={occupancy.phone}
//           onChange={e => onChange('phone', e.target.value)}
//           className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
//           placeholder='Enter phone number'
//         />
//       </div>

//       <div className='md:col-span-2'>
//         <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
//         <textarea
//           value={occupancy.address}
//           onChange={e => onChange('address', e.target.value)}
//           className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
//           placeholder='Enter address'
//           // rows="2"
//         />
//       </div>

//       <div>
//         <label className='block text-sm font-medium text-gray-700 mb-1'>Photo</label>
//         <div className='flex items-center'>
//           <input
//             type='file'
//             accept='image/*'
//             onChange={e => onFileUpload('photo', e.target.files[0])}
//             className='w-full p-2'
//           />
//           {occupancy.photo && (
//             <div className='ml-2 flex-shrink-0'>
//               <img src={occupancy.photo} alt='Preview' className='h-12 w-12 object-cover rounded' />
//             </div>
//           )}
//         </div>
//       </div>

//       <div>
//         <label className='block text-sm font-medium text-gray-700 mb-1'>Aadhaar Photo</label>
//         <div className='flex items-center'>
//           <input
//             type='file'
//             accept='image/*'
//             onChange={e => onFileUpload('aadhaar', e.target.files[0])}
//             className='w-full p-2'
//           />
//           {occupancy.aadhaarPhoto && (
//             <div className='ml-2 flex-shrink-0'>
//               <img src={occupancy.aadhaarPhoto} alt='Preview' className='h-12 w-12 object-cover rounded' />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// app/page.tsx

import React from 'react'

const BillPage = () => {
  return (
    <main className='bg-gray-100 min-h-screen p-4 sm:p-8 flex items-center justify-center'>
      <div className='w-full max-w-2xl bg-white p-6 sm:p-8 border border-gray-300 shadow-lg'>
        {/* Header Section */}
        <header className='text-center mb-4'>
          <h1 className='text-3xl font-bold text-red-700'>Sankeerta </h1>
          <h2 className='text-xl font-semibold'>VEG RESTAURANT </h2>
          <p className='text-lg font-kalam'>சங்கீர்த்தா சைவ உணவகம் </p>
          <p className='text-xs mt-2'>
            NO: 61/A2, PERIAPALAYAM ROAD, JANAPANCHATRAM 'X' ROAD, AZHINJIVAKKAM, CHENNAI-600 067.
          </p>
          <p className='text-xs'>Ph: 044-27984004, 044-27984005 </p>
          <p className='text-sm font-mono mt-1'>GSTIN: 33ADVFS3315G1ZY </p>
        </header>

        <hr className='border-t-2 border-dashed border-gray-400 my-4' />

        {/* Customer and Bill Details */}
        <section className='flex justify-between text-sm mb-4'>
          <div className='w-1/2 pr-4'>
            <div className='grid grid-cols-[auto,1fr] gap-x-2'>
              <span className='font-semibold'>NAME</span>
              <span>: SHIVA. M. </span>
              <span className='font-semibold'>COMPANY NAME</span>
              <span>: AUTOMATION SOLUTIONS. </span>
              <span className='font-semibold'>ADDRESS</span>
              <span>: 51/A TPK ROAD. </span>
              <span></span>
              <span> SUBRAMANIYAPURAM </span>
              <span></span>
              <span> MADURAI-625011 </span>
              <span className='font-semibold'>GSTIN NO</span>
              <span>:</span>
              <span className='font-semibold'>Rooms</span>
              <span>: 203 </span>
            </div>
          </div>
          <div className='w-1/2 pl-4 text-right'>
            <div className='inline-grid grid-cols-[auto,1fr] gap-x-2 text-left'>
              <span className='font-semibold'>Bill NO</span>
              <span>: 1246 </span>
              <span className='font-semibold'>ARR.DATE</span>
              <span>: 07/03/2025 </span>
              <span className='font-semibold'>ARR.TIME</span>
              <span>: 7:08 am </span>
              <span className='font-semibold'>DEP.DATE</span>
              <span>: 08/03/2025 </span>
              <span className='font-semibold'>DEP.TIME</span>
              <span>: 7:01 am </span>
              <span className='font-semibold'>PERSON</span>
              <span>: 1 </span>
              <span className='font-semibold'>Days</span>
              <span>: 1 </span>
            </div>
          </div>
        </section>

        <hr className='border-t-2 border-dashed border-gray-400 my-4' />

        {/* Billing Table */}
        <section>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b-2 border-gray-500'>
                <th className='text-left font-bold pb-1'>PARTICULARS</th>
                <th className='text-right font-bold pb-1'>Amount Rs.</th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-b border-gray-300'>
                <td className='py-1'>ROOM TARIFF 203 </td>
                <td className='text-right py-1'>1607.00 </td>
              </tr>
              <tr className='border-b border-gray-300'>
                <td className='py-1'>CGST 6% </td>
                <td className='text-right py-1'>96.42 </td>
              </tr>
              <tr className='border-b border-gray-300'>
                <td className='py-1'>SGST 6% </td>
                <td className='text-right py-1'>96.42 </td>
              </tr>
              <tr className='border-b-2 border-gray-500'>
                <td className='py-1'>EXTRA BED </td>
                <td className='text-right py-1'>0.00 </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className='font-semibold'>
                <td className='py-1'>ROOM TOTAL </td>
                <td className='text-right py-1'>1799.84 </td>
              </tr>
              <tr className='font-bold text-base border-t-2 border-b-2 border-gray-500'>
                <td className='py-1'>TOTAL </td>
                <td className='text-right py-1'>1799.84 </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Total in Words and Balance */}
        <section className='flex justify-between items-center my-4 text-sm font-semibold'>
          <div>RUPEES ONE THOUSAND EIGHT HUNDRED ONLY </div>
          <div className='text-right'>
            <div className='grid grid-cols-[auto,auto gap-x-4'>
              <span>TOTAL</span>
              <span className='font-bold text-base'>1800.00 </span>
              <span>ADVANCE</span>
              <span>0.00 </span>
              <span className='font-bold'>BALANCE</span>
              <span className='font-bold'>1800.00 </span>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className='text-xs font-semibold mb-8'>
          <p>Note: </p>
          <ol className='list-decimal list-inside ml-2'>
            <li>Checkout Time 24 Hours Format </li>
            <li>GST as Applicable. </li>
            <li>Tariff Subject to Change Without notice </li>
          </ol>
        </section>

        {/* Signatures */}
        <footer className='pt-8'>
          <div className='flex justify-between text-sm font-semibold'>
            <span>GUEST SIGNATURE </span>
            <span>RECEPTIONIST SIGNATURE </span>
            <span>ADMIN </span>
          </div>
          <div className='text-center mt-8 font-bold'>
            <p>*** KINDLY RETURN YOUR ROOM KEYS *** </p>
            <p className='mt-2'>"THANK YOU VISIT AGAIN" </p>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default BillPage
