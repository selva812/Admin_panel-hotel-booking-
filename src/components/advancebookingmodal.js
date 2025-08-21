'use client'
import { X, User, Phone, Calendar, Home, CreditCard, FileText, Clock, XCircle } from 'lucide-react'
import { CheckCircle, AlertCircle, Wallet } from 'lucide-react'
const BookingDetailsModal = ({ booking, onClose }) => {
  const statusInfo = {
    0: {
      text: 'Checked Out',
      icon: <CheckCircle className='w-4 h-4' />,
      color: 'bg-green-100 text-green-800'
    },
    1: {
      text: 'Checked In',
      icon: <AlertCircle className='w-4 h-4' />,
      color: 'bg-blue-100 text-blue-800'
    },
    2: {
      text: 'Advance',
      icon: <Wallet className='w-4 h-4' />,
      color: 'bg-yellow-100 text-yellow-800'
    },
    3: {
      text: 'Cancelled',
      icon: <XCircle className='w-4 h-4' />, // Using XCircle for cancelled status
      color: 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        {/* Modal Header */}
        <div className='border-b border-gray-200 p-6 sticky top-0 bg-white z-10'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
              <FileText className='text-blue-600' />
              Booking Details: {booking.bookingref}
            </h2>
            <button onClick={onClose} className='p-1 rounded-full hover:bg-gray-100 transition-colors'>
              <X className='w-5 h-5 text-gray-500' />
            </button>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo[booking.bookingstatus]?.color || 'bg-gray-100 text-gray-800'}`}
            >
              {statusInfo[booking.bookingstatus]?.icon}
              {statusInfo[booking.bookingstatus]?.text || 'Unknown Status'}
            </span>
            <span className='text-sm text-gray-500'>
              Created: {new Date(booking.createdAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className='p-6 space-y-6'>
          {/* Customer Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='font-medium text-gray-700 mb-3 flex items-center gap-2'>
                <User className='text-blue-600' />
                Customer Information
              </h3>
              <div className='space-y-2'>
                <p>
                  <span className='font-medium'>Name:</span> {booking.customerName}
                </p>
                <p>
                  <span className='font-medium'>Phone:</span> {booking.customerPhone}
                </p>
                <p>
                  <span className='font-medium'>Booked By:</span> {booking.bookedBy || 'N/A'}
                </p>
              </div>
            </div>

            {/* Booking Details */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='font-medium text-gray-700 mb-3 flex items-center gap-2'>
                <Calendar className='text-blue-600' />
                Booking Details
              </h3>
              <div className='space-y-2'>
                <p>
                  <span className='font-medium'>Booking Date:</span> {new Date(booking.date).toLocaleString('en-IN')}
                </p>
                <p>
                  <span className='font-medium'>Rooms:</span> {booking.rooms}
                </p>
                {booking.roomNumbers && (
                  <p>
                    <span className='font-medium'>Room Numbers:</span> {booking.roomNumbers.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium text-gray-700 mb-3 flex items-center gap-2'>
              <CreditCard className='text-blue-600' />
              Payment Information
            </h3>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='font-medium'>Total Paid:</span>
                <span className='font-bold'>₹{booking.paymentTotal?.toLocaleString('en-IN') || 0}</span>
              </div>

              {booking.payments?.length > 0 && (
                <div className='border-t border-gray-200 pt-3'>
                  <h4 className='text-sm font-medium mb-2'>Payment History</h4>
                  <div className='space-y-2'>
                    {booking.payments.map((payment, index) => (
                      <div key={index} className='flex justify-between text-sm'>
                        <span>Payment #{index + 1}</span>
                        <span>₹{Number(payment.amount).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium text-gray-700 mb-3 flex items-center gap-2'>
              <Clock className='text-blue-600' />
              Booking Timeline
            </h3>
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-blue-100 p-1.5 rounded-full mt-1'>
                  <Calendar className='w-4 h-4 text-blue-600' />
                </div>
                <div>
                  <p className='font-medium'>Booking Created</p>
                  <p className='text-sm text-gray-500'>{new Date(booking.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Add more timeline items as needed */}
              {/* Example for check-in/check-out events */}
              {booking.status === 1 && (
                <div className='flex items-start gap-3'>
                  <div className='bg-green-100 p-1.5 rounded-full mt-1'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                  </div>
                  <div>
                    <p className='font-medium'>Checked In</p>
                    <p className='text-sm text-gray-500'>
                      {new Date().toLocaleString()} {/* Replace with actual check-in time */}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className='border-t border-gray-200 p-4 sticky bottom-0 bg-white flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
          >
            Close
          </button>
          {/* {booking.status === 0 && (
            <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
              Check In
            </button>
          )}
          {booking.status === 1 && (
            <button className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'>
              Check Out
            </button>
          )} */}
        </div>
      </div>
    </div>
  )
}
export default BookingDetailsModal
