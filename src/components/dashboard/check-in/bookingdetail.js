'use client'
import { useEffect } from 'react'

export default function BookingDetails({ bookingDetails }) {
  // ✅ Check if bookingDetails exists first
  if (!bookingDetails || !bookingDetails.booking) {
    console.log('bookingdetails', bookingDetails)
    return <div>Loading booking details...</div>
  }

  // ✅ Safe destructuring after validation
  const { booking } = bookingDetails
  const { customer, bookedRooms, checkIn, checkOut, purposeOfVisit, bookingType } = booking || {}
  // const { booking } = bookingDetails;
  // const { customer, bookedRooms, checkIn, checkOut, purposeOfVisit, bookingType } = booking;
  function formatDate(dateString) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('en-US', options)
  }
  useEffect(() => {
    console.log('booking details', bookingDetails)
  }, [])
  return (
    <div className='bg-white shadow rounded-lg p-6'>
      <h2 className='text-xl font-bold mb-4'>Booking Information</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <h3 className='text-lg font-semibold mb-2'>Customer Details</h3>
          <div className='space-y-2'>
            <p>
              <span className='font-medium'>Name:</span> {customer.name}
            </p>
            <p>
              <span className='font-medium'>Phone:</span> {customer.phoneNumber}
            </p>
            {customer.address && (
              <p>
                <span className='font-medium'>Address:</span> {customer.address}
              </p>
            )}
            {customer.companyName && (
              <p>
                <span className='font-medium'>Company:</span> {customer.companyName}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-2'>Stay Information</h3>
          <div className='space-y-2'>
            <p>
              <span className='font-medium'>Check-in:</span> {formatDate(checkIn)}
            </p>
            <p>
              <span className='font-medium'>Check-out:</span> {formatDate(checkOut)}
            </p>
            <p>
              <span className='font-medium'>Booking Type:</span> {bookingType.name}
            </p>
            {purposeOfVisit && (
              <p>
                <span className='font-medium'>Purpose of Visit:</span> {purposeOfVisit.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className='mt-6'>
        <h3 className='text-lg font-semibold mb-2'>Booked Rooms</h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white'>
            <thead>
              <tr className='bg-gray-100'>
                <th className='py-2 px-4 text-left'>Room Number</th>
                <th className='py-2 px-4 text-left'>Room Type</th>
                <th className='py-2 px-4 text-left'>Price</th>
                <th className='py-2 px-4 text-left'>Adults</th>
                <th className='py-2 px-4 text-left'>Children</th>
                <th className='py-2 px-4 text-left'>Extra Beds</th>
              </tr>
            </thead>
            <tbody>
              {bookedRooms.map(bookingRoom => (
                <tr key={bookingRoom.id} className='border-t'>
                  <td className='py-2 px-4'>{bookingRoom.room.roomNumber}</td>
                  <td className='py-2 px-4'>{bookingRoom.room.type?.name || 'N/A'}</td>
                  <td className='py-2 px-4'>${bookingRoom.bookedPrice}</td>
                  <td className='py-2 px-4'>{bookingRoom.adults}</td>
                  <td className='py-2 px-4'>{bookingRoom.children}</td>
                  <td className='py-2 px-4'>{bookingRoom.extraBeds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
