'use client'
export default function OccupancyForm({ occupancy, onChange, onFileUpload }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
        <input
          type='text'
          value={occupancy.name}
          onChange={e => onChange('name', e.target.value)}
          className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Enter occupant name'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Phone Number</label>
        <input
          type='text'
          value={occupancy.phone}
          onChange={e => onChange('phone', e.target.value)}
          className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Enter phone number'
        />
      </div>

      <div className='md:col-span-2'>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
        <textarea
          value={occupancy.address}
          onChange={e => onChange('address', e.target.value)}
          className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Enter address'
          rows='2'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Photo</label>
        <div className='flex items-center'>
          <input
            type='file'
            accept='image/*'
            onChange={e => onFileUpload('photo', e.target.files[0])}
            className='w-full p-2'
          />
          {occupancy.photo && (
            <div className='ml-2 flex-shrink-0'>
              <img src={occupancy.photo} alt='Preview' className='h-12 w-12 object-cover rounded' />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Aadhaar Photo</label>
        <div className='flex items-center'>
          <input
            type='file'
            accept='image/*'
            onChange={e => onFileUpload('aadhaar', e.target.files[0])}
            className='w-full p-2'
          />
          {occupancy.aadhaarPhoto && (
            <div className='ml-2 flex-shrink-0'>
              <img src={occupancy.aadhaarPhoto} alt='Preview' className='h-12 w-12 object-cover rounded' />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
