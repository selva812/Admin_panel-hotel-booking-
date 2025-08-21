'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { Save, Edit3, Plus, X } from 'lucide-react'
export const dynamic = 'force-dynamic'
const HotelSettingsPage = () => {
  const [data, setData] = useState({
    purposes: [],
    bookingTypes: [],
    extraBeds: [],
    taxes: [],
    hotelInfo: null,
    bookingPrefixes: [],
    invoicePrefixes: []
  })

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [editingSections, setEditingSections] = useState({})

  // Fetch initial data
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setInitialLoading(true)
      const response = await fetch('/api/settings')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setEditingSections({})
        // Optionally show success message
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEditing = section => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateArrayItem = (section, index, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => (i === index ? { ...item, [field]: value } : item))
    }))
  }

  const addArrayItem = (section, newItem) => {
    setData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }))
  }

  const updateHotelInfo = (field, value) => {
    setData(prev => ({
      ...prev,
      hotelInfo: { ...prev.hotelInfo, [field]: value }
    }))
  }

  if (initialLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-xl text-gray-600'>Loading settings...</div>
      </div>
    )
  }

  return (
    <Suspense fallback={<p>Loading search params...</p>}>
      <div className='min-h-screen bg-gray-50 relative'>
        {/* Transparent Loading Overlay */}
        {loading && (
          <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 flex items-center space-x-3'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
              <span className='text-gray-700'>Saving changes...</span>
            </div>
          </div>
        )}

        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-6xl mx-auto'>
            {/* Header */}
            <div className='flex justify-between items-center mb-8'>
              <h1 className='text-3xl font-bold text-gray-900'>Hotel Settings</h1>
              <button
                onClick={handleSave}
                className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors'
              >
                <Save size={20} />
                <span>Save All Changes</span>
              </button>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Hotel Information */}
              <div className='lg:col-span-2 bg-white rounded-lg shadow-sm border'>
                <div className='p-6 border-b'>
                  <div className='flex justify-between items-center'>
                    <h2 className='text-xl font-semibold text-gray-900'>Hotel Information</h2>
                    <button
                      onClick={() => toggleEditing('hotelInfo')}
                      className='text-blue-600 hover:text-blue-700 flex items-center space-x-1'
                    >
                      <Edit3 size={16} />
                      <span>{editingSections.hotelInfo ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>
                </div>
                <div className='p-6'>
                  {data.hotelInfo && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Hotel Name</label>
                        {editingSections.hotelInfo ? (
                          <input
                            type='text'
                            value={data.hotelInfo.name || ''}
                            onChange={e => updateHotelInfo('name', e.target.value)}
                            className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        ) : (
                          <p className='text-gray-900 py-2'>{data.hotelInfo.name || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Contact</label>
                        {editingSections.hotelInfo ? (
                          <input
                            type='text'
                            value={data.hotelInfo.contact || ''}
                            onChange={e => updateHotelInfo('contact', e.target.value)}
                            className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        ) : (
                          <p className='text-gray-900 py-2'>{data.hotelInfo.contact || 'Not set'}</p>
                        )}
                      </div>
                      <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
                        {editingSections.hotelInfo ? (
                          <textarea
                            value={data.hotelInfo.address || ''}
                            onChange={e => updateHotelInfo('address', e.target.value)}
                            rows='3'
                            className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        ) : (
                          <p className='text-gray-900 py-2'>{data.hotelInfo.address || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>GST Number</label>
                        {editingSections.hotelInfo ? (
                          <input
                            type='text'
                            value={data.hotelInfo.gst || ''}
                            onChange={e => updateHotelInfo('gst', e.target.value)}
                            className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        ) : (
                          <p className='text-gray-900 py-2'>{data.hotelInfo.gst || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Logo URL</label>
                        {editingSections.hotelInfo ? (
                          <input
                            type='text'
                            value={data.hotelInfo.logo || ''}
                            onChange={e => updateHotelInfo('logo', e.target.value)}
                            className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        ) : (
                          <p className='text-gray-900 py-2'>{data.hotelInfo.logo || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose of Visit */}
              <SettingsSection
                title='Purpose of Visit'
                data={data.purposes}
                editing={editingSections.purposes}
                onToggleEdit={() => toggleEditing('purposes')}
                onUpdate={(index, field, value) => updateArrayItem('purposes', index, field, value)}
                onAdd={() => addArrayItem('purposes', { name: '' })}
                fields={[{ key: 'name', label: 'Purpose', type: 'text' }]}
              />

              {/* Booking Types */}
              <SettingsSection
                title='Booking Types'
                data={data.bookingTypes}
                editing={editingSections.bookingTypes}
                onToggleEdit={() => toggleEditing('bookingTypes')}
                onUpdate={(index, field, value) => updateArrayItem('bookingTypes', index, field, value)}
                onAdd={() => addArrayItem('bookingTypes', { name: '' })}
                fields={[{ key: 'name', label: 'Type', type: 'text' }]}
              />

              {/* Extra Beds */}
              <SettingsSection
                title='Extra Bed Pricing'
                data={data.extraBeds}
                editing={editingSections.extraBeds}
                onToggleEdit={() => toggleEditing('extraBeds')}
                onUpdate={(index, field, value) => updateArrayItem('extraBeds', index, field, value)}
                onAdd={() => addArrayItem('extraBeds', { price: 0 })}
                fields={[{ key: 'price', label: 'Price (₹)', type: 'number' }]}
              />

              {/* Taxes */}
              <SettingsSection
                title='Tax Configuration'
                data={data.taxes}
                editing={editingSections.taxes}
                onToggleEdit={() => toggleEditing('taxes')}
                onUpdate={(index, field, value) => updateArrayItem('taxes', index, field, value)}
                onAdd={() => addArrayItem('taxes', { name: '', percentage: 0 })}
                fields={[
                  { key: 'name', label: 'Tax Name', type: 'text' },
                  { key: 'percentage', label: 'Percentage (%)', type: 'number' }
                ]}
              />

              {/* Booking Prefixes */}
              <PrefixSection
                title='Booking Prefixes'
                data={data.bookingPrefixes}
                editing={editingSections.bookingPrefixes}
                onToggleEdit={() => toggleEditing('bookingPrefixes')}
                onUpdate={(index, field, value) => updateArrayItem('bookingPrefixes', index, field, value)}
                onAdd={() => addArrayItem('bookingPrefixes', { prefix: '', number: 1, status: true })}
              />

              {/* Invoice Prefixes */}
              <PrefixSection
                title='Invoice Prefixes'
                data={data.invoicePrefixes}
                editing={editingSections.invoicePrefixes}
                onToggleEdit={() => toggleEditing('invoicePrefixes')}
                onUpdate={(index, field, value) => updateArrayItem('invoicePrefixes', index, field, value)}
                onAdd={() => addArrayItem('invoicePrefixes', { prefix: '', number: 1, status: true })}
              />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

// Reusable Settings Section Component
const SettingsSection = ({ title, data, editing, onToggleEdit, onUpdate, onAdd, fields }) => {
  return (
    <div className='bg-white rounded-lg shadow-sm border'>
      <div className='p-4 border-b'>
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
          <div className='flex space-x-2'>
            {editing && (
              <button onClick={onAdd} className='text-green-600 hover:text-green-700 flex items-center space-x-1'>
                <Plus size={16} />
                <span>Add</span>
              </button>
            )}
            <button onClick={onToggleEdit} className='text-blue-600 hover:text-blue-700 flex items-center space-x-1'>
              <Edit3 size={16} />
              <span>{editing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>
        </div>
      </div>
      <div className='p-4'>
        <div className='space-y-3'>
          {data.map((item, index) => (
            <div key={index} className='flex items-center space-x-3'>
              {fields.map(field => (
                <div key={field.key} className='flex-1'>
                  <label className='block text-xs text-gray-500 mb-1'>{field.label}</label>
                  {editing ? (
                    <input
                      type={field.type}
                      value={item[field.key] || ''}
                      onChange={e =>
                        onUpdate(index, field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  ) : (
                    <p className='text-gray-900 py-2 text-sm'>{item[field.key] || 'Not set'}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
          {data.length === 0 && <p className='text-gray-500 text-center py-4'>No items configured</p>}
        </div>
      </div>
    </div>
  )
}

// Prefix Section Component
const PrefixSection = ({ title, data, editing, onToggleEdit, onUpdate, onAdd }) => {
  return (
    <div className='bg-white rounded-lg shadow-sm border'>
      <div className='p-4 border-b'>
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
          <div className='flex space-x-2'>
            {editing && (
              <button onClick={onAdd} className='text-green-600 hover:text-green-700 flex items-center space-x-1'>
                <Plus size={16} />
                <span>Add</span>
              </button>
            )}
            <button onClick={onToggleEdit} className='text-blue-600 hover:text-blue-700 flex items-center space-x-1'>
              <Edit3 size={16} />
              <span>{editing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>
        </div>
      </div>
      <div className='p-4'>
        <div className='space-y-3'>
          {data.map((item, index) => (
            <div key={index} className='grid grid-cols-3 gap-3 items-end'>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Prefix</label>
                {editing ? (
                  <input
                    type='text'
                    value={item.prefix || ''}
                    onChange={e => onUpdate(index, 'prefix', e.target.value)}
                    className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                ) : (
                  <p className='text-gray-900 py-2 text-sm'>{item.prefix || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Current Number</label>
                {editing ? (
                  <input
                    type='number'
                    value={item.number || 0}
                    onChange={e => onUpdate(index, 'number', Number(e.target.value))}
                    className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                ) : (
                  <p className='text-gray-900 py-2 text-sm'>{item.number || 0}</p>
                )}
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Status</label>
                {editing ? (
                  <select
                    value={item.status ? 'active' : 'inactive'}
                    onChange={e => onUpdate(index, 'status', e.target.value === 'active')}
                    className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='active'>Active</option>
                    <option value='inactive'>Inactive</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      item.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.status ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          ))}
          {data.length === 0 && <p className='text-gray-500 text-center py-4'>No prefixes configured</p>}
        </div>
      </div>
    </div>
  )
}

export default HotelSettingsPage
