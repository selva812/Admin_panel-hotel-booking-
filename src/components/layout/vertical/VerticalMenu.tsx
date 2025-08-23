import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { TransparentLoader } from '@/components/transparent'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const { user } = useAuth();
  const verticalNavOptions = useVerticalNav()
  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showLoader, setShowLoader] = useState(false)


  const handleNavigation = async (path: string) => {
    router.push(path)

  }
  const handleLogout = async () => {
    try {
      setShowLoader(true)
      const token = localStorage.getItem('token');

      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        localStorage.clear();
        window.location.href = '/auth/login';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLoader(false)
    }
  };

  return (
    <>
      <ScrollWrapper
        {...(isBreakpointReached
          ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden ',
            onScroll: container => scrollMenu(container, false)
          }
          : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
      >
        {showLoader && <TransparentLoader />}
        <Menu
          popoutMenuOffset={{ mainAxis: 17 }}
          menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
          renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
          renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
          menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
        >
          <MenuSection label={'Dashboard'}>
            <MenuItem
              href={`/dashboards/home`}
              icon={<i className='ri-home-line' />}
              onClick={(e) => {
                e.preventDefault()
                handleNavigation('/dashboards/home')
              }}
            >
              Home
            </MenuItem>
          </MenuSection>
          <MenuSection label="Booking">
            <MenuItem
              href="/dashboards/booking-calender"
              icon={<i className="ri-calendar-check-line" />}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/dashboards/booking-calender');
              }}
            >
              Booking Calender
            </MenuItem>
            <SubMenu label={'Booking'} icon={<i className='ri-calendar-event-line' />}>
              <MenuItem
                href="/dashboards/booking"
                icon={<i className="ri-calendar-check-line" />}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/dashboards/booking');
                }}
              >
                Bookings Master
              </MenuItem>
              <MenuItem
                href="/dashboards/booking/request-booking"
                icon={<i className="ri-calendar-todo-line" />}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/dashboards/booking/request-booking');
                }}
              >
                Advance Bookings
              </MenuItem>
            </SubMenu>

            <SubMenu label={'Rooms'} icon={<i className='ri-hotel-bed-line' />}>
              <MenuItem
                href="/dashboards/checkout"
                icon={<i className="ri-logout-circle-line" />}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/dashboards/checkout');
                }}>
                Check Out
              </MenuItem>
              {user?.role !== 'STAFF' &&
                <MenuItem
                  href="/dashboards/rooms/edit"
                  icon={<i className="ri-edit-box-line" />}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/dashboards/rooms/edit');
                  }}>
                  Edit Rooms
                </MenuItem>}
              <MenuItem
                href="/dashboards/rooms"
                icon={<i className="ri-hotel-line" />}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/dashboards/rooms');
                }}
              >
                Availability
              </MenuItem>
            </SubMenu>
            <MenuItem
              href="/dashboards/service"
              icon={<i className="ri-service-line" />}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/dashboards/service');
              }}
            >
              Manage Services
            </MenuItem>

            <MenuItem
              href="/dashboards/customers"
              icon={<i className="ri-user-line" />}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/dashboards/customers');
              }}
            >
              Customers
            </MenuItem>

            <MenuItem
              href="/dashboards/invoices"
              icon={<i className="ri-file-text-line" />}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/dashboards/invoices');
              }}
            >
              Invoices
            </MenuItem>

            <MenuItem
              href="/dashboards/report"
              icon={<i className="ri-funds-line" />}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/dashboards/report');
              }}
            >
              Report
            </MenuItem>
            <MenuItem
              href="/dashboards/expenses"
              icon={<i className="ri-wallet-3-line" />}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/dashboards/expenses');
              }}
            >
              Add payments
            </MenuItem>

          </MenuSection>

          {user?.role !== 'STAFF' &&
            <MenuSection label={'Staff'}>
              <SubMenu label={'Staff Management'} icon={<i className='ri-team-line' />}>
                <MenuItem
                  href="/dashboards/staff"
                  icon={<i className="ri-dashboard-line" />}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/dashboards/staff');
                  }}
                >
                  Staff Dashboard
                </MenuItem>
                <MenuItem
                  href="/dashboards/staff/manage"
                  icon={<i className="ri-user-settings-line" />}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/dashboards/staff/manage');
                  }}>
                  Manage Staff
                </MenuItem>
              </SubMenu>
              <MenuItem
                href="/dashboards/settings"
                icon={<i className="ri-settings-line" />}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/dashboards/settings');
                }}
              >
                Settings
              </MenuItem>
            </MenuSection>}
          <div className='bg-red-500 mt-8'>
            <MenuItem
              icon={<i className="ri-logout-box-line text-white" />}
              onClick={() => {
                const confirmLogout = window.confirm('Are you sure you want to logout?');
                if (confirmLogout) {
                  handleLogout();
                }
              }}
            >
              <p className='text-white'>Logout</p>
            </MenuItem>
          </div>
        </Menu>
      </ScrollWrapper>


    </>
  )
}
export default VerticalMenu
