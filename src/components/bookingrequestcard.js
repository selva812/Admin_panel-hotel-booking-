// BookingRequestCard.jsx
function BookingRequestCard({ booking, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(booking)}
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className='flex justify-between items-start'>
        <div>
          <p className='font-medium text-gray-800'>{booking.customerName}</p>
          <p className='text-sm text-gray-600'>{booking.phoneNumber}</p>
        </div>
        <span className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
          {booking.rooms.length} {booking.rooms.length > 1 ? 'rooms' : 'room'}
        </span>
      </div>

      <div className='mt-2'>
        <div className='flex flex-wrap gap-1'>
          {booking.rooms.slice(0, 3).map(roomNumber => (
            <span key={roomNumber} className='bg-white border text-xs px-2 py-1 rounded'>
              {roomNumber}
            </span>
          ))}
          {booking.rooms.length > 3 && <span className='text-xs text-gray-500'>+{booking.rooms.length - 3} more</span>}
        </div>

        <p className='text-xs text-gray-500 mt-1'>
          {new Date(booking.date).toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  )
}
