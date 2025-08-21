// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import Userinfo from './user'


const NavbarContent = () => {
  // Get user data from auth context


  return (
    <div className={classnames(
      verticalLayoutClasses.navbarContent,
      'flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm'
    )}>
      <div className='flex items-center gap-8'>
        <NavToggle />
        {/* <div className="text-xl font-semibold text-blue-800">YourLogo</div> */}
      </div>
      <Userinfo />
    </div>
  )
}

export default NavbarContent
