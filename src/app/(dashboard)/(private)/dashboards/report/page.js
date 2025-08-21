'use client'
import { useState, useEffect, Suspense } from 'react'
import RevenueExport from '@/components/revenurexport'
import { BarChart3, Building, DollarSign, LineChart, PieChart, TrendingDown, TrendingUp, Users } from 'lucide-react'
import CategoryDetailsModal from '@/components/categorymodal'
export default function RevenueReportPage() {
  const [roomid, setroomid] = useState('')
  const [customerid, setcustomerid] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerSuggestions, setCustomerSuggestions] = useState([])
  const [room, setroom] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasSelected, setHasSelected] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [revenueData, setRevenueData] = useState(null)
  const [loading, setLoading] = useState(false)
  const handlePhoneChange = e => {
    setPhoneNumber(e.target.value)
    setHasSelected(false) // Reset selection state on new input
  }

  useEffect(() => {
    const fetchroom = async () => {
      const resp = await fetch(`/api/room/list`)
      const data = await resp.json()
      setroom(data)
    }
    fetchroom()
  }, [])
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (phoneNumber && !hasSelected) {
        // Only search if no selection made
        searchCustomerByPhone(phoneNumber)
      }
    }, 300)

    return () => clearTimeout(debounceTimeout)
  }, [phoneNumber, hasSelected])

  const searchCustomerByPhone = async phone => {
    if (phone.length < 3 || hasSelected) {
      setCustomerSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const res = await fetch(`/api/customers/search?phone=${phone}`)
      const data = await res.json()
      setCustomerSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch (error) {
      console.error('Failed to fetch customers', error)
    }
  }

  const [reportData, setReportData] = useState({
    bookings: { bookings: [], summary: {} },
    revenue: { revenueData: [], summary: {} },
    expenses: { expenses: [], summary: {} },
    occupancy: { occupancyData: [], summary: {} }
  })

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true)
    try {
      const [bookingsRes, revenueRes, expensesRes, occupancyRes] = await Promise.all([
        fetch(`/api/reports/bookings?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/reports/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/reports/expenses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/reports/occupancy?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ])

      const [bookings, revenue, expenses, occupancy] = await Promise.all([
        bookingsRes.json(),
        revenueRes.json(),
        expensesRes.json(),
        occupancyRes.json()
      ])

      setReportData({ bookings, revenue, expenses, occupancy })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  // Overview Cards Component
  const OverviewCards = () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
      {/* Total Bookings Card */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-500 dark:text-gray-300 text-sm font-medium'>Total Bookings</p>
            <p className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
              {reportData.bookings.summary.totalBookings || 0}
            </p>
          </div>
          <div className='p-3 rounded-full bg-blue-50 dark:bg-blue-900/30'>
            <Users className='w-6 h-6 text-blue-600 dark:text-blue-400' />
          </div>
        </div>
        <div className='mt-4 flex items-center text-sm'>
          <div className='flex items-center text-green-500 dark:text-green-400'>
            <TrendingUp className='w-4 h-4 mr-1' />
            <span>+12% from last month</span>
          </div>
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-500 dark:text-gray-300 text-sm font-medium'>Total Revenue</p>
            <p className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
              ₹{reportData.revenue.summary.totalRevenue?.toLocaleString() || 0}
            </p>
          </div>
          <div className='p-3 rounded-full bg-green-50 dark:bg-green-900/30'>
            <DollarSign className='w-6 h-6 text-green-600 dark:text-green-400' />
          </div>
        </div>
        <div className='mt-4 flex items-center text-sm'>
          <div className='flex items-center text-green-500 dark:text-green-400'>
            <TrendingUp className='w-4 h-4 mr-1' />
            <span>+8% from last month</span>
          </div>
        </div>
      </div>

      {/* Occupancy Rate Card */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-500 dark:text-gray-300 text-sm font-medium'>Occupancy Rate</p>
            <p className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
              {reportData.occupancy.summary.averageOccupancyRate?.toFixed(1) || 0}%
            </p>
          </div>
          <div className='p-3 rounded-full bg-purple-50 dark:bg-purple-900/30'>
            <Building className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          </div>
        </div>
        <div className='mt-4 flex items-center text-sm'>
          <div className='flex items-center text-green-500 dark:text-green-400'>
            <TrendingUp className='w-4 h-4 mr-1' />
            <span>+5% from last month</span>
          </div>
        </div>
      </div>

      {/* Total Expenses Card */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-gray-500 dark:text-gray-300 text-sm font-medium'>Total Expenses</p>
            <p className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
              ₹{reportData.expenses.summary.totalExpenses?.toLocaleString() || 0}
            </p>
          </div>
          <div className='p-3 rounded-full bg-red-50 dark:bg-red-900/30'>
            <BarChart3 className='w-6 h-6 text-red-600 dark:text-red-400' />
          </div>
        </div>
        <div className='mt-4 flex items-center text-sm'>
          <div className='flex items-center text-red-500 dark:text-red-400'>
            <TrendingDown className='w-4 h-4 mr-1' />
            <span>+3% from last month</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Bookings Report Component
  const BookingsReport = () => (
    <div className='space-y-6'>
      <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
        <h3 className='text-lg font-semibold mb-4'>Booking Summary</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Summary cards with subtle hover effects */}
          {[
            { value: reportData.bookings.summary.totalBookings || 0, label: 'Total Bookings', color: 'blue-600' },
            // {
            //   value: `₹${reportData.bookings.summary.averageBookingValue?.toLocaleString() || 0}`,
            //   label: 'Avg Booking Value',
            //   color: 'green-600'
            // },
            {
              value: `₹${reportData.bookings.summary.totalPaidAmount?.toLocaleString() || 0}`,
              label: 'Total Paid',
              color: 'purple-600'
            },
            {
              value: `₹${reportData.bookings.summary.totalDueAmount?.toLocaleString() || 0}`,
              label: 'Total Due',
              color: 'orange-600'
            }
          ].map((item, index) => (
            <div
              key={index}
              className='text-center p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200'
            >
              <p className={`text-2xl font-bold text-${item.color}`}>{item.value}</p>
              <p className='text-gray-600'>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
        <h3 className='text-lg font-semibold mb-4'>Recent Bookings</h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                {['Booking Ref', 'Customer', 'Date', 'Rooms', 'Total Amount', 'Paid Amount', 'Status'].map(header => (
                  <th
                    key={header}
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200'
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {reportData.bookings.bookings?.slice(0, 10).map((booking, index) => (
                <tr key={booking.bookingRef || index} className='hover:bg-gray-50 transition-colors duration-150'>
                  <td className='px-4 py-3 text-sm border-b border-gray-200'>{booking.bookingRef}</td>
                  <td className='px-4 py-3 text-sm border-b border-gray-200'>{booking.customerName || 'N/A'}</td>
                  <td className='px-4 py-3 text-sm border-b border-gray-200'>
                    {new Date(booking.bookingDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className='px-4 py-3 text-sm border-b border-gray-200'>
                    {booking.roomNumbers?.join(', ') || 'N/A'}
                  </td>
                  <td className='px-4 py-3 text-sm border-b border-gray-200'>
                    {booking.totalAmount ? `₹${booking.totalAmount.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className='px-4 py-3 text-sm border-b border-gray-200'>
                    {booking.paidAmount ? `₹${booking.paidAmount.toLocaleString()}` : '0'}
                  </td>
                  <td className='px-4 py-3 text-sm border-b border-gray-200'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.paidAmount === booking.totalAmount
                          ? 'bg-green-100 text-green-800'
                          : booking.paidAmount > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {booking.paidAmount === booking.totalAmount
                        ? 'Paid'
                        : booking.paidAmount > 0
                          ? 'Partial'
                          : 'Unpaid'}
                    </span>
                  </td>
                </tr>
              )) || []}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // Revenue Report Component
  const RevenueReport = () => (
    <div className='space-y-6'>
      <div className='bg-white rounded-xl shadow-sm p-6'>
        <h3 className='text-lg font-semibold mb-4'>Revenue Summary</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-green-600'>
              ₹{reportData.revenue.summary.totalRevenue?.toLocaleString() || 0}
            </p>
            <p className='text-gray-600'>Total Revenue</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-blue-600'>{reportData.revenue.summary.totalPayments || 0}</p>
            <p className='text-gray-600'>Total Payments</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-purple-600'>
              ₹{reportData.revenue.summary.averagePayment?.toLocaleString() || 0}
            </p>
            <p className='text-gray-600'>Average Payment</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-orange-600'>Mixed</p>
            <p className='text-gray-600'>Payment Methods</p>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm p-6'>
        <h3 className='text-lg font-semibold mb-4'>Payment Methods Breakdown</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-green-50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-green-800 font-medium'>Cash</span>
              <span className='text-green-600 font-bold'>
                ₹{reportData.revenue.summary.paymentMethods?.cash?.toLocaleString() || 0}
              </span>
            </div>
          </div>
          <div className='bg-blue-50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-blue-800 font-medium'>Card</span>
              <span className='text-blue-600 font-bold'>
                ₹{reportData.revenue.summary.paymentMethods?.card?.toLocaleString() || 0}
              </span>
            </div>
          </div>
          <div className='bg-purple-50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-purple-800 font-medium'>Online</span>
              <span className='text-purple-600 font-bold'>
                ₹{reportData.revenue.summary.paymentMethods?.online?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Expenses Report Component
  const ExpensesReport = () => {
    return (
      <div className='space-y-6'>
        {/* Summary Cards with Enhanced Styling */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold mb-4'>Expenses Summary</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Total Expenses Card */}
            <div className='bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-100 hover:shadow-md transition-all duration-200'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-red-600'>
                  ₹{reportData.expenses.summary.totalExpenses?.toLocaleString('en-IN') || 0}
                </p>
                <p className='text-gray-600 mt-1'>Total Expenses</p>
              </div>
            </div>

            {/* Total Transactions Card */}
            <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-200'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-blue-600'>{reportData.expenses.summary.totalTransactions || 0}</p>
                <p className='text-gray-600 mt-1'>Total Transactions</p>
              </div>
            </div>

            {/* Average Expense Card */}
            <div className='bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-200'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-purple-600'>
                  ₹{reportData.expenses.summary.averageExpense?.toLocaleString('en-IN') || 0}
                </p>
                <p className='text-gray-600 mt-1'>Average Expense</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown with Enhanced UI */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold'>Category Breakdown</h3>
            <span className='text-sm text-gray-500'>
              {reportData.expenses.summary.categoryBreakdown?.length || 0} categories
            </span>
          </div>

          <div className='space-y-2'>
            {reportData.expenses.summary.categoryBreakdown?.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                w-full flex items-center justify-between p-4 rounded-lg
                border border-gray-100 hover:border-blue-200
                transition-all duration-200 hover:shadow-sm
                ${category.count > 0 ? 'bg-white' : 'bg-gray-50'}
              `}
              >
                <div className='flex items-center'>
                  <div className={`w-3 h-3 rounded-full mr-3 ${category.count > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span className={`font-medium ${category.count > 0 ? 'text-gray-800' : 'text-gray-500'}`}>
                    {category.name}
                  </span>
                </div>

                <div className='text-right'>
                  <p className={`font-bold ${category.total > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                    ₹{category.total?.toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs ${category.count > 0 ? 'text-gray-600' : 'text-gray-400'}`}>
                    {category.count} {category.count === 1 ? 'transaction' : 'transactions'}
                  </p>
                </div>
              </button>
            )) || <div className='text-center py-8 text-gray-500'>No expense categories found</div>}
          </div>
        </div>
      </div>
    )
  }
  const selectCustomer = customer => {
    setPhoneNumber(customer.phoneNumber)
    setCustomerName(customer.name)
    setcustomerid(customer.id)
    setShowSuggestions(false)
    setCustomerSuggestions([])
    setHasSelected(true)
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Revenue Report</h1>
        <RevenueExport
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          roomid={selectedRoom}
          customerid={customerid}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div>
          <label htmlFor='startDate' className='block text-sm font-medium mb-2'>
            Start Date
          </label>
          <input
            id='startDate'
            type='date'
            value={dateRange.startDate}
            onChange={e =>
              setDateRange(prev => ({
                ...prev,
                startDate: e.target.value
              }))
            }
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div>
          <label htmlFor='endDate' className='block text-sm font-medium mb-2'>
            End Date
          </label>
          <input
            id='endDate'
            type='date'
            value={dateRange.endDate}
            onChange={e =>
              setDateRange(prev => ({
                ...prev,
                endDate: e.target.value
              }))
            }
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
        <div className='relative'>
          <label className='block text-gray-700 font-semibold mb-1'>Cutomer</label>
          <input
            type='text'
            value={phoneNumber}
            onChange={handlePhoneChange}
            className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400'
            required
          />
          {showSuggestions && (
            <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto'>
              {customerSuggestions.map(customer => (
                <div
                  key={customer.id}
                  className='px-4 py-2 hover:bg-indigo-50 cursor-pointer'
                  onClick={() => selectCustomer(customer)}
                >
                  <div className='font-medium'>{customer.name}</div>
                  <div className='text-sm text-gray-600'>{customer.phoneNumber}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className=''>
          <label htmlFor='room-select' className='block text-sm font-medium text-gray-700'>
            Select Room
          </label>
          <select
            id='room-select'
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
            className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
          >
            <option value=''>-- Select a room --</option>
            {room.map(room => (
              <option key={room.id} value={room.id}>
                {room.roomNumber} - {room.type.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <OverviewCards />
      <div className='bg-white rounded-xl shadow-sm mb-8 border border-gray-100'>
        <div className='border-b border-gray-200'>
          <nav className='flex'>
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'bookings', label: 'Bookings', icon: Users },
              { id: 'revenue', label: 'Revenue', icon: DollarSign },
              { id: 'expenses', label: 'Expenses', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center py-4 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <tab.icon
                    className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`}
                  />
                  <span>{tab.label}</span>
                </div>
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transition-all duration-300 ${
                    activeTab === tab.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div
                  className={`absolute inset-0 bg-blue-50/30 rounded-t-lg transition-opacity duration-200 ${
                    activeTab === tab.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Based on Active Tab */}
      <div className='min-h-96'>
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-xl shadow-sm p-6'>
                  <h3 className='text-lg font-semibold mb-4'>Revenue Trend</h3>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded-lg'>
                    <LineChart className='w-12 h-12 text-gray-400' />
                    <span className='ml-2 text-gray-500'>Revenue chart will be displayed here</span>
                  </div>
                </div>
                <div className='bg-white rounded-xl shadow-sm p-6'>
                  <h3 className='text-lg font-semibold mb-4'>Booking Distribution</h3>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded-lg'>
                    <PieChart className='w-12 h-12 text-gray-400' />
                    <span className='ml-2 text-gray-500'>Booking chart will be displayed here</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'bookings' && <BookingsReport />}
            {activeTab === 'revenue' && <RevenueReport />}
            {activeTab === 'expenses' && <ExpensesReport />}
          </>
        )}
      </div>
      <CategoryDetailsModal
        categoryId={selectedCategory}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onClose={() => setSelectedCategory(null)}
      />
      {revenueData && (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='bg-white p-4 rounded-lg shadow'>
              <h3 className='text-sm font-medium text-gray-500'>Total Revenue</h3>
              <p className='text-2xl font-bold'>₹{revenueData.summary.totalRevenue.toFixed(2)}</p>
            </div>
            {/* Navigation Tabs */}
          </div>
        </div>
      )}
    </div>
  )
}
