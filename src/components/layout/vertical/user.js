'use client'
import { useAuth } from '@/contexts/AuthContext'

const Userinfo = () => {
  const { user } = useAuth()

  // Role configuration
  const roleConfig = {
    STAFF: {
      label: 'Staff',
      color: 'bg-indigo-50 text-indigo-700',
      icon: '👔'
    },
    MANAGER: {
      label: 'Manager',
      color: 'bg-blue-50 text-blue-700',
      icon: '📊'
    },
    ADMIN: {
      label: 'Administrator',
      color: 'bg-purple-50 text-purple-700',
      icon: '🔑'
    }
  }

  const currentRole = user?.role || 'STAFF'
  const role = roleConfig[currentRole] || roleConfig['STAFF']

  return (
    <div className='flex items-center gap-3 group relative'>
      {/* Professional avatar with subtle shadow */}
      <div className='relative'>
        <div className='w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:shadow-md'>
          {user && <span className='text-blue-600 font-medium text-lg'>{user.name.charAt(0).toUpperCase()}</span>}
        </div>
        {/* Online status indicator */}
        <div className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-white'></div>
      </div>

      {user && (
        <>
          <div className='flex flex-col items-start'>
            {/* Name with subtle hover effect */}
            <span className='font-medium text-gray-800 group-hover:text-gray-900 transition-colors'>{user.name}</span>

            {/* Role badge with icon */}
            <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${role.color} mt-0.5`}>
              <span className='text-xs'>{role.icon}</span>
              <span>{role.label}</span>
            </div>
          </div>

          {/* Tooltip */}
          <div className='absolute left-0 top-full mt-2 w-max px-3 py-2 text-sm bg-gray-800 text-white rounded-md shadow-lg opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:mt-3 pointer-events-none'>
            <div className='flex flex-col'>
              <span className='font-medium'>{user.name}</span>
              <span className='text-gray-300 text-xs'>{user.email}</span>
              <div className='mt-1 pt-1 border-t border-gray-700 flex items-center gap-1'>
                <span className='text-xs'>{role.icon}</span>
                <span className='text-xs'>{role.label}</span>
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className='absolute -top-1 left-4 w-3 h-3 bg-gray-800 transform rotate-45'></div>
          </div>
        </>
      )}
    </div>
  )
}

export default Userinfo
