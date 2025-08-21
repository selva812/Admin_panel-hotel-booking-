'use client'
export default function CheckInForm({ roomNumber, setRoomNumber, searchBooking, loading }) {
  return (
    <div className='p-4 bg-white shadow rounded-lg'>
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-grow'>
          <label htmlFor='roomNumber' className='block text-sm font-medium text-gray-700 mb-1'>
            Room Number
          </label>
          <input
            type='text'
            id='roomNumber'
            value={roomNumber}
            onChange={e => setRoomNumber(e.target.value)}
            placeholder='Enter room number'
            className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
        <div className='flex items-end'>
          <button
            onClick={searchBooking}
            disabled={loading}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300'
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  )
}
