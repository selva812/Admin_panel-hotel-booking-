'use client'
import { useState, useEffect, Suspense } from 'react'
import { Loader2, PlusCircle, Edit, Trash2, Filter } from 'lucide-react'
import { X, Check, ClipboardList, IndianRupee, Calendar } from 'lucide-react'
import { Home } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { TransparentLoader } from '@/components/transparent'
import { toast } from 'react-toastify'
export const dynamic = 'force-dynamic'
export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [bookedRooms, setBookedRooms] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalServices, setTotalServices] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    bookingId: '',
    roomNumber: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filterParams, setFilterParams] = useState({
    startDate: '',
    customer: ''
  })

  const handleFilterSubmit = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: '1', // Reset to first page when filtering
        pageSize: pageSize.toString()
      })

      // Add filters if they exist
      if (filterParams.startDate) {
        queryParams.append('startDate', filterParams.startDate)
      }
      if (customer) {
        queryParams.append('customerId', customer.id)
      }
      console.log('query', queryParams.toString())
      const servicesRes = await fetch(`/api/services?${queryParams.toString()}`)

      if (!servicesRes.ok) {
        throw new Error('Failed to fetch filtered services')
      }

      const servicesData = await servicesRes.json()
      setServices(servicesData.data)
      setTotalPages(servicesData.pagination.totalPages)
      setTotalServices(servicesData.pagination.totalItems)
      setCurrentPage(1) // Reset to first page

      toast.success('Filters applied successfully')
    } catch (error) {
      console.error('Error applying filters:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to apply filters')
    } finally {
      setLoading(false)
    }
  }
  const handlereset = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: '1', // Reset to first page when filtering
        pageSize: pageSize.toString()
      })

      const servicesRes = await fetch(`/api/services?${queryParams.toString()}`)

      if (!servicesRes.ok) {
        throw new Error('Failed to fetch filtered services')
      }

      const servicesData = await servicesRes.json()
      setServices(servicesData.data)
      setTotalPages(servicesData.pagination.totalPages)
      setTotalServices(servicesData.pagination.totalItems)
      setCurrentPage(1) // Reset to first page

      toast.success('Filters applied successfully')
    } catch (error) {
      console.error('Error applying filters:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to apply filters')
    } finally {
      setLoading(false)
    }
  }
  const [message, setMessage] = useState('')
  const [customer, setCustomer] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editService, setEditService] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasSelected, setHasSelected] = useState(false)
  const [customerSuggestions, setCustomerSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [customerName, setCustomerName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [servicesRes, roomsRes] = await Promise.all([
          fetch(`/api/services?page=${currentPage}&pageSize=${pageSize}`),
          fetch('/api/booked-rooms')
        ])
        if (!servicesRes.ok) throw new Error('Failed to fetch services')
        if (!roomsRes.ok) throw new Error('Failed to fetch booked rooms')
        const servicesData = await servicesRes.json()
        const roomsData = await roomsRes.json()
        console.log('bookedroom', roomsData)
        setServices(servicesData.data)
        setBookedRooms(roomsData.data)
        setTotalPages(servicesData.pagination.totalPages)
        setTotalServices(servicesData.pagination.totalItems)
      } catch (error) {
        console.error('Error fetching data:', error)
        setMessage('Error loading data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentPage, pageSize])

  const selectCustomer = customer => {
    setPhoneNumber(customer.phoneNumber)
    setCustomerName(customer.name)
    setCustomer(customer)
    setShowSuggestions(false)
    setCustomerSuggestions([])
    setHasSelected(true)
  }

  const handleCreate = async e => {
    e.preventDefault()
    if (!newService.name || !newService.price || !newService.bookingId || !newService.roomNumber) {
      console.log('services', newService)
      toast.error('Please fill all required fields')
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newService.name,
          price: parseFloat(newService.price),
          bookingId: parseInt(newService.bookingId),
          roomNumber: parseInt(newService.roomNumber), // Include roomNumber
          description: ''
        })
      })

      if (response.ok) {
        // Refresh the services list after successful creation
        const [servicesRes] = await Promise.all([fetch(`/api/services?page=${currentPage}&pageSize=${pageSize}`)])

        const servicesData = await servicesRes.json()
        setServices(servicesData.data)
        setTotalPages(servicesData.pagination.totalPages)
        setTotalServices(servicesData.pagination.totalItems)

        setNewService({ name: '', price: '', bookingId: '', roomNumber: '' })
        toast.success('Service added successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Error creating service')
    } finally {
      setIsCreating(false)
    }
  }

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

  const handlePhoneChange = e => {
    setPhoneNumber(e.target.value)
    setHasSelected(false)
  }

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (phoneNumber && !hasSelected) {
        // Only search if no selection made
        searchCustomerByPhone(phoneNumber)
      }
    }, 300)

    return () => clearTimeout(debounceTimeout)
  }, [phoneNumber, hasSelected])

  const handleUpdate = async e => {
    e.preventDefault()
    if (!editService?.name || !editService?.price || !editService?.bookingId) {
      setMessage('Please fill all required fields')
      return
    }

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editService.id,
          name: editService.name,
          description: editService.description || '',
          price: parseFloat(String(editService.price)),
          bookingId: Number(editService.bookingId)
        })
      })
      console.log('response ', response.json())
      if (!response.ok) throw new Error('Failed to update service')

      const updatedRes = await fetch(`/api/services?page=${currentPage}&pageSize=${pageSize}`)
      const updatedData = await updatedRes.json()
      setServices(updatedData.data)
      setTotalPages(updatedData.pagination.totalPages)
      setTotalServices(updatedData.pagination.totalItems)

      setMessage('Service updated successfully!')
      setEditService(null)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating service')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      {loading ? (
        <TransparentLoader />
      ) : (
        <div className='min-h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50 p-8'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3'>
              <PlusCircle className='h-8 w-8 text-blue-600' />
              Hotel Services Management
            </h1>

            {/* Add Service Form */}
            <div className='bg-white rounded-xl shadow-lg p-6 mb-10 border border-gray-200'>
              {/* Header with Filter/Add buttons */}
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-lg font-semibold text-gray-800'>Services Management</h2>
                <div className='flex gap-4'>
                  <button
                    onClick={() => {
                      setShowAddForm(false) // Hide add form if showing
                      setShowFilter(!showFilter) // Toggle filter
                    }}
                    className={`px-4 py-2 rounded-lg border ${
                      showFilter ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300'
                    }`}
                  >
                    <Filter className='w-4 h-4 mr-2 inline' />
                    Filter
                  </button>
                  <button
                    onClick={() => {
                      setShowFilter(false) // Hide filter if showing
                      setShowAddForm(!showAddForm) // Toggle add form
                    }}
                    className={`px-4 py-2 rounded-lg border ${
                      showAddForm ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300'
                    }`}
                  >
                    <PlusCircle className='w-4 h-4 mr-2 inline' />
                    Add Service
                  </button>
                </div>
              </div>

              {/* Filter Form (conditionally shown) */}
              {showFilter && (
                <div className='bg-gray-50 p-4 rounded-lg mb-6'>
                  <form className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Date Range</label>
                      <div className='flex gap-2'>
                        <input
                          type='date'
                          className='w-full p-2 border rounded-lg'
                          value={filterParams.startDate}
                          onChange={e => setFilterParams({ ...filterParams, startDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Customer</label>
                      <div className='relative'>
                        {hasSelected && customer ? (
                          <div className='flex items-center justify-between w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors'>
                            <div>
                              <div className='font-medium text-gray-900'>{customer.name}</div>
                              <div className='text-xs text-gray-500'>{customer.phoneNumber}</div>
                            </div>
                            <button
                              type='button'
                              onClick={() => {
                                setCustomer(null)
                                setHasSelected(false)
                                setPhoneNumber('')
                              }}
                              className='text-gray-400 hover:text-gray-600 transition-colors'
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type='text'
                              value={phoneNumber}
                              onChange={handlePhoneChange}
                              className='w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all shadow-sm'
                              placeholder='Search by phone number'
                            />
                            {showSuggestions && customerSuggestions.length > 0 && (
                              <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg divide-y divide-gray-200 max-h-60 overflow-auto'>
                                {customerSuggestions.map(customer => (
                                  <div
                                    key={customer.id}
                                    className='px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors'
                                    onClick={() => selectCustomer(customer)}
                                  >
                                    <div className='font-medium text-gray-900'>{customer.name}</div>
                                    <div className='text-xs text-gray-500'>{customer.phoneNumber}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Customer</label>
                      <input
                        type='text'
                        placeholder='Customer name'
                        className='w-full p-2 border rounded-lg'
                        value={filterParams.customer}
                        onChange={e => setFilterParams({ ...filterParams, customer: e.target.value })}
                      />
                    </div> */}

                    <div className='flex items-end'>
                      <button
                        type='button'
                        onClick={handlereset}
                        className='w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700'
                      >
                        Reset
                      </button>
                    </div>
                    <div className='flex items-end'>
                      <button
                        type='button'
                        onClick={handleFilterSubmit}
                        className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700'
                      >
                        Apply Filters
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add Service Form (conditionally shown) */}
              {showAddForm && (
                <form onSubmit={handleCreate} className='space-y-4 border-t pt-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Service Name</label>
                      <input
                        type='text'
                        placeholder='Enter service name'
                        className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        value={newService.name}
                        onChange={e => setNewService({ ...newService, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Price (₹)</label>
                      <input
                        type='number'
                        placeholder='Enter price'
                        className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        value={newService.price}
                        onChange={e => setNewService({ ...newService, price: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Select Room</label>
                      <select
                        className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        value={`${newService.bookingId}|${newService.roomNumber}`}
                        onChange={e => {
                          const [bookingIdStr, roomNumber] = e.target.value.split('|')
                          const bookingId = Number(bookingIdStr)
                          setNewService({
                            ...newService,
                            bookingId,
                            roomNumber
                          })
                        }}
                        required
                      >
                        <option value=''>Select a booking</option>
                        {bookedRooms.map(room => (
                          <option
                            key={`${room.bookingId}|${room.roomNumber}`}
                            value={`${room.bookingId}|${room.roomNumber}`}
                            className='p-2 hover:bg-blue-50'
                          >
                            Room {room.roomNumber} • {room.customerName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className='flex justify-end gap-4 pt-2'>
                    <button
                      type='button'
                      onClick={() => setShowAddForm(false)}
                      className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={isCreating}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2'
                    >
                      {isCreating ? <Loader2 className='w-4 h-4 animate-spin' /> : <PlusCircle className='w-4 h-4' />}
                      Add Service
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Services Table */}
            <div className='overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200'>
              <table className='min-w-full table-auto'>
                <thead className='bg-blue-600 text-gray-700 text-sm uppercase font-semibold'>
                  <tr>
                    <th className='px-6 py-4 text-left text-white'>Service</th>
                    <th className='px-6 py-4 text-left text-white'>Room</th>
                    <th className='px-6 py-4 text-left text-white'>Customer</th>
                    <th className='px-6 py-4 text-left text-white'>Booking Ref</th>
                    <th className='px-6 py-4 text-left text-white'>Dates</th>
                    <th className='px-6 py-4 text-left text-white'>Status</th>
                    <th className='px-6 py-4 text-left text-white'>Price</th>
                    <th className='px-6 py-4 text-left text-white'>Created</th>
                    <th className='px-6 py-4 text-right text-white'>Actions</th>
                  </tr>
                </thead>
                <tbody className='text-sm text-gray-700'>
                  {services.length > 0 ? (
                    services.map((service, index) => (
                      <tr
                        key={service.serviceId}
                        className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                      >
                        {/* Service Column */}
                        <td className='px-6 py-4'>
                          <div className='font-medium text-gray-800'>{service.serviceName}</div>
                        </td>

                        {/* Room Column */}
                        <td className='px-6 py-4 font-medium text-gray-800'>Room {service.roomNumber}</td>

                        {/* Customer Column */}
                        <td className='px-6 py-4'>
                          <div className='font-medium'>{service.bookingDetails.customer.name}</div>
                          <div className='text-gray-500 text-xs'>{service.bookingDetails.customer.phone}</div>
                        </td>

                        {/* Booking Ref Column */}
                        <td className='px-6 py-4 font-mono text-blue-600'>{service.bookingDetails.bookingref}</td>

                        {/* Dates Column */}
                        <td className='px-6 py-4'>
                          <div className='flex flex-col'>
                            <span className='text-gray-800 flex items-center'>
                              <Calendar className='w-4 h-4 mr-1 flex-shrink-0' />
                              {new Date(service.bookingDetails.dates.checkIn)
                                .toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                                .replace(/\//g, '-')}
                            </span>
                            {service.bookingDetails.dates.status === 'Checked Out' && (
                              <span className='text-gray-500 text-xs flex items-center mt-1'>
                                <ArrowRight className='w-3 h-3 mr-1' />
                                {new Date(service.bookingDetails.dates.checkOut)
                                  .toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                  .replace(/\//g, '-')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className='px-6 py-4'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              service.bookingDetails.dates.status === 'Checked In'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {service.bookingDetails.dates.status}
                          </span>
                        </td>

                        {/* Price Column */}
                        <td className='px-6 py-4'>
                          <div className='inline-flex items-baseline'>
                            <IndianRupee className='w-4 h-4 mr-1 self-center' />
                            <span className='font-semibold text-gray-800'>{service.price.toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Created At Column */}
                        <td className='px-6 py-4 text-gray-500 whitespace-nowrap'>
                          {new Date(service.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </td>

                        {/* Actions Column */}
                        <td className='px-6 py-4 text-right'>
                          <button
                            onClick={() => setEditService(service)}
                            className='text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50'
                          >
                            <Edit className='w-5 h-5' />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className='px-6 py-8 text-center text-gray-500'>
                        No services found. Start by adding a new service.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className='mt-6 flex items-center justify-between'>
            <div className='text-sm text-gray-600'>
              Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalServices)} of{' '}
              {totalServices} services
            </div>

            <div className='flex items-center gap-4'>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className='p-2 border rounded-md text-sm'
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>

              <div className='flex gap-2'>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className='px-4 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === pageNumber ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className='px-4 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          {editService && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
              <div className='bg-white p-6 rounded-lg shadow-xl max-w-md w-full'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold'>Edit Service</h2>
                  <button onClick={() => setEditService(null)} className='text-gray-500 hover:text-gray-700'>
                    <X className='w-5 h-5' />
                  </button>
                </div>

                {/* Service Summary */}
                <div className='mb-4 p-4 bg-gray-50 rounded-lg border text-sm text-gray-700 space-y-2'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <span className='font-medium'>Service:</span> {editService.serviceName}
                    </div>
                    <div>
                      <span className='font-medium'>Room:</span> {editService.roomNumber}
                    </div>
                    <div>
                      <span className='font-medium'>Customer:</span> {editService.bookingDetails.customer.name}
                    </div>
                    <div>
                      <span className='font-medium'>Phone:</span> {editService.bookingDetails.customer.phone}
                    </div>
                    <div>
                      <span className='font-medium'>Booking Ref:</span> {editService.bookingDetails.bookingref}
                    </div>
                    <div>
                      <span className='font-medium'>Status:</span>
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                          editService.bookingDetails.dates.status === 'Checked In'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {editService.bookingDetails.dates.status}
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdate} className='space-y-4'>
                  <div className='space-y-4'>
                    {/* Service Name */}
                    <div className='relative'>
                      <input
                        type='text'
                        className='w-full border p-2 rounded pl-10'
                        value={editService.serviceName}
                        onChange={e =>
                          setEditService({
                            ...editService,
                            serviceName: e.target.value
                          })
                        }
                        placeholder='Service Name'
                        required
                      />
                      <ClipboardList className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    </div>

                    {/* Price */}
                    <div className='relative'>
                      <input
                        type='number'
                        className='w-full border p-2 rounded pl-10'
                        value={editService.price}
                        onChange={e =>
                          setEditService({
                            ...editService,
                            price: parseFloat(e.target.value) || 0
                          })
                        }
                        placeholder='Price'
                        min='0'
                        step='0.01'
                        required
                      />
                      <IndianRupee className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    </div>

                    {/* Room Selection - Conditionally Disabled */}
                    <div className='relative'>
                      <select
                        className={`w-full border p-2 rounded pl-10 appearance-none ${
                          editService.bookingDetails.dates.status === 'Checked Out'
                            ? 'bg-gray-100 cursor-not-allowed'
                            : ''
                        }`}
                        value={editService.roomId || ''}
                        onChange={e => {
                          if (editService.bookingDetails.dates.status !== 'Checked Out') {
                            const roomId = Number(e.target.value)
                            const selectedRoom = bookedRooms.find(room => room.id === roomId)
                            if (selectedRoom) {
                              setEditService({
                                ...editService,
                                roomId: selectedRoom.id,
                                roomNumber: selectedRoom.roomNumber,
                                bookingId: selectedRoom.bookingId
                              })
                            }
                          }
                        }}
                        required
                        disabled={editService.bookingDetails.dates.status === 'Checked Out'}
                      >
                        <option value=''>Select a room</option>
                        {bookedRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            Room {room.roomNumber} • {room.customerName}
                          </option>
                        ))}
                      </select>
                      <Home className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                      {editService.bookingDetails.dates.status === 'Checked Out' && (
                        <p className='text-xs text-gray-500 mt-1'>Room cannot be changed for checked out bookings</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex justify-between pt-4 border-t'>
                    <button
                      type='button'
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this service?')) {
                          try {
                            const response = await fetch(`/api/services?id=${editService.serviceId}`, {
                              method: 'DELETE'
                            })
                            const data = await response.json()

                            if (response.ok) {
                              toast.success('Service deleted successfully')
                              setEditService(null)
                              // Refresh services list
                              const servicesRes = await fetch(`/api/services?page=${currentPage}&pageSize=${pageSize}`)
                              const servicesData = await servicesRes.json()
                              setServices(servicesData.data)
                            } else {
                              toast.error(data.message || 'Failed to delete service')
                            }
                          } catch (error) {
                            console.error('Failed to delete service:', error)
                            toast.error('Failed to delete service')
                          }
                        }
                      }}
                      className='flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded'
                    >
                      <Trash2 className='w-4 h-4 mr-2' />
                      Delete
                    </button>

                    <div className='flex gap-2'>
                      <button
                        type='button'
                        onClick={() => setEditService(null)}
                        className='flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50'
                      >
                        <X className='w-4 h-4 mr-2' />
                        Cancel
                      </button>
                      <button
                        type='submit'
                        className='flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50'
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        ) : (
                          <Check className='w-4 h-4 mr-2' />
                        )}
                        Update
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
