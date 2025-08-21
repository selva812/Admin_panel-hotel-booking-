'use client'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TransparentLoader } from '@/components/transparent'
import { toast } from 'react-toastify'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'
export default function CheckoutPage() {
  const [billingData, setBillingData] = useState(null)
  const [billingError, setBillingError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState(0)
  const [paymentNote, setPaymentNote] = useState('Final payment at checkout')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [amount, setamount] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [originalCheckoutDate, setOriginalCheckoutDate] = useState('')
  const [originalCheckoutTime, setOriginalCheckoutTime] = useState('')
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [checkoutDate, setCheckoutDate] = useState('')
  const [checkoutTime, setCheckoutTime] = useState('')
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [checkoutDateTime, setCheckoutDateTime] = useState('')
  const [isEditingCheckout, setIsEditingCheckout] = useState(false)
  const [issave, setissave] = useState(false)
  const router = useRouter()
  const combinedDateTime = `${checkoutDate}T${checkoutTime}:00`
  const paymentMethodMap = {
    0: 'Cash',
    1: 'Card',
    2: 'Online'
  }

  async function fetchBillingData(checkout) {
    if (id) {
      try {
        setLoading(true)
        setBillingError(null)
        const utcCheckout = new Date(checkout).toISOString()
        console.log('this is fetchbilling checkout ', utcCheckout)
        const response = await fetch(`/api/checkout/billing?bookingId=${id}&checkout=${utcCheckout}`)
        const result = await response.json()
        console.log('booking checkout', result.data)
        if (result.success) {
          setBillingData(result.data)
        } else {
          setBillingError(result.error || 'Failed to load billing details')
        }
      } catch (err) {
        setBillingError('An error occurred while fetching billing details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }
  useEffect(() => {
    fetchBillingData(currentDateTime)
  }, [id])

  const handlePayment = async () => {
    if (!billingData) return
    if (paymentMethod == null || amount == null || amount <= 0) {
      toast.error('Payment field is empty')
      return
    }
    setIsPaying(true)
    setPaymentError(null)
    setPaymentSuccess(false)
    const finalNote =
      paymentMethod === 'ONLINE' ? `${paymentNote}${paymentNote ? ' | ' : ''}Ref: ${referenceNumber}` : paymentNote
    const combinedDateTime = `${checkoutDate}T${checkoutTime}:00`
    try {
      const response = await fetch(`/api/checkout/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: parseInt(id),
          amount: parseFloat(amount),
          method: paymentMethod,
          note: finalNote,
          transact: referenceNumber,
          totalAmount: billingData.grandTotal,
          paid: billingData.totalPayments,
          balance: billingData.balanceDue,
          checkout: true,
          checkoutDate: billingData.checkOut
        })
      })

      const result = await response.json()

      if (result.success) {
        setPaymentSuccess(true)
        toast.success('Amount paid successfully and checkout the room')
        router.back()
      } else {
        setPaymentError(result.error || 'Payment failed')
      }
    } catch (err) {
      setPaymentError('An error occurred during payment processing')
      toast.error('An error occurred during payment processing')
      console.error(err)
    } finally {
      setIsPaying(false)
    }
  }
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date()
      // Create a proper Indian timezone date object
      const indianTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      const indianTime = new Date(indianTimeString)
      setCurrentDateTime(indianTime)
    }

    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const getDateTimeComponents = dateString => {
    const dateObj = new Date(dateString)
    const date = dateObj.toISOString().split('T')[0]
    const time = dateObj.toISOString().split('T')[1].slice(0, 5) // "HH:mm"
    return { date, time }
  }

  useEffect(() => {
    if (billingData?.checkOut) {
      const { date, time } = getDateTimeComponents(billingData.checkOut)
      console.log('date, time:', { date, time }) // "HH:mm" format

      setCheckoutDate(date)
      setCheckoutTime(time) // Store in "HH:mm" format

      if (!originalCheckoutDate && !originalCheckoutTime) {
        setOriginalCheckoutDate(date)
        setOriginalCheckoutTime(time) // Store original in "HH:mm"
      }
    }
  }, [billingData?.checkOut, originalCheckoutDate, originalCheckoutTime])

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-red-500 text-xl'>{error}</div>
      </div>
    )
  }

  const formatCurrency = amount => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value)
  }
  const formatDate = date => {
    const d = new Date(date)
    return isNaN(d.getTime())
      ? 'Invalid date'
      : d.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
  }

  const handleSaveCheckout = async () => {
    setissave(true)
    if (!checkoutDate || !checkoutTime) {
      alert('Please select both date and time')
      return
    }
    const combinedDateTime = new Date(checkoutDateTime).toISOString()
    try {
      setLoading(true)
      setBillingError(null)
      const response = await fetch(`/api/checkout/billing?bookingId=${id}&checkout=${combinedDateTime}`)
      const result = await response.json()
      console.log('booking checkout', result.data)
      if (result.success) {
        setBillingData(result.data)
        setOriginalCheckoutDate(checkoutDate)
        setOriginalCheckoutTime(checkoutTime)
        setIsEditingCheckout(false)
      } else {
        setBillingError(result.error || 'Failed to load billing details')
      }
    } catch (err) {
      setBillingError('An error occurred while fetching billing details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/checkout-only`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: parseInt(id),
          totalamount: billingData.grandTotal,
          date: billingData.checkOut
        })
      })

      if (response.ok) {
        toast.success('Guest checked out successfully!', 'success')
        router.back()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to checkout guest', 'error')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Error during checkout process', 'error')
    } finally {
      setIsCheckingOut(false)
    }
  }
  const toLocalDateTimeString = (date, timeZone = 'Asia/Kolkata') => {
    const zonedDate = toZonedTime(new Date(date), timeZone)
    return formatInTimeZone(zonedDate, timeZone, "yyyy-MM-dd'T'HH:mm")
  }
  return (
    <div className=''>
      {loading ? (
        <TransparentLoader />
      ) : (
        <>
          <div className='min-h-screen bg-gray-100'>
            {/* Header with Back Arrow */}
            <div className='bg-white shadow-sm sticky top-0  px-4 py-3 flex flex-col gap-3 border-b'>
              <div className='flex items-center pb-4 mb-6'>
                <button
                  onClick={() => {
                    router.push('/dashboards/checkout')
                  }}
                  className='text-gray-600 hover:text-gray-800 p-2 rounded-full bg-gray-100'
                >
                  <ArrowLeft className='h-5 w-5' />
                </button>

                <div className='ml-16'>
                  <h2 className='text-2xl font-bold text-gray-800'>Checkout Summary</h2>
                  <div className='text-sm text-gray-500 mt-1'>
                    Booking ID: <span className='font-medium'>#{billingData.bookingref}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className='mb-6 bg-white border rounded-xl shadow-sm overflow-hidden'>
                <div className='bg-gray-50 px-6 py-4 border-b'>
                  <h3 className='text-lg font-semibold text-blue-600 flex items-center gap-2'>👤 Guest Summary</h3>
                </div>

                <div className='overflow-x-auto'>
                  <table className='min-w-full table-auto divide-y divide-gray-200'>
                    <thead className='bg-blue-200'>
                      <tr>
                        <th className='px-6 py-3 text-left text-sm font-semibold text-gray-600'>Name</th>
                        <th className='px-6 py-3 text-left text-sm font-semibold text-gray-600'>Nights</th>
                        <th className='px-6 py-3 text-left text-sm font-semibold text-gray-600'>Check-In</th>
                        <th className='px-6 py-3 text-left text-sm font-semibold text-gray-600'>Check-Out</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-100'>
                      <tr>
                        <td className='px-6 py-4 text-sm font-medium text-gray-900'>{billingData.customer.name}</td>
                        <td className='px-6 py-4 text-sm text-gray-700'>{billingData.stayDuration}</td>
                        <td className='px-6 py-4 text-sm text-gray-700'>{formatDate(billingData.checkIn)}</td>
                        <td className='px-6 py-4 text-sm text-gray-700'>
                          {!isEditingCheckout ? (
                            <div className='flex items-center gap-2 h-[42px]'>
                              <span className='py-2'>
                                {issave ? formatDate(checkoutDateTime) : formatDate(currentDateTime)}
                              </span>
                              <button
                                onClick={() => {
                                  setIsEditingCheckout(true)
                                  setCheckoutDateTime(toLocalDateTimeString(billingData.checkOut))
                                }}
                                className='text-blue-500 hover:text-blue-700 text-sm underline'
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <div className='flex items-center gap-2 flex-wrap'>
                              <div className='flex gap-2'>
                                <input
                                  type='datetime-local'
                                  value={checkoutDateTime}
                                  defaultValue={new Date(billingData.checkOut).toISOString().slice(0, 16)} // e.g., '2025-07-16T14:36'
                                  onChange={e => setCheckoutDateTime(e.target.value)}
                                  className='border rounded p-1 text-sm w-56'
                                  min={new Date(billingData.checkIn).toISOString().slice(0, 16)}
                                />
                              </div>

                              <div className='flex gap-2'>
                                <button
                                  onClick={handleSaveCheckout}
                                  className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm'
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditingCheckout(false)
                                    setissave(false)
                                    setCheckoutDate(originalCheckoutDate)
                                    setCheckoutTime(originalCheckoutTime)
                                  }}
                                  className='text-gray-500 hover:text-gray-700 text-sm underline py-1'
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              {(billingData.payments.length > 0 || billingData.billPayments.length > 0) && (
                <div className='bg-white rounded-xl border mb-6 overflow-hidden'>
                  <div className='bg-gray-50 p-4 border-b'>
                    <h3 className='text-lg font-semibold flex items-center'>
                      <span className='text-blue-600 mr-2'>💳</span>
                      Payment History
                    </h3>
                  </div>
                  <div className='p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* Bill Payments */}
                      {billingData.payments.length > 0 && (
                        <div>
                          <h4 className='font-medium text-gray-700 mb-2'>Bill Payments</h4>
                          <div className='space-y-3'>
                            {billingData.payments.map((payment, index) => (
                              <div
                                key={`bill-${index}`}
                                className='flex justify-between items-center p-3 bg-green-50 rounded-lg'
                              >
                                <div>
                                  <div className='font-medium'>
                                    {formatDate(payment.date)}
                                    {/* {new Date(payment.date).toLocaleDateString('en-IN')} */}
                                  </div>
                                  <div className='text-sm text-gray-600 capitalize'>
                                    {paymentMethodMap[payment.method] || 'Unknown'}
                                  </div>
                                </div>
                                <div className='text-right'>
                                  <div className='font-medium text-green-600'>{formatCurrency(payment.amount)}</div>
                                  {payment.note && <div className='text-xs text-gray-500'>{payment.note}</div>}
                                </div>
                              </div>
                            ))}
                            <div className='flex justify-between pt-2 mt-2 border-t border-green-100 font-medium'>
                              <div>Total Bill Payments:</div>
                              <div className='text-green-600'>{formatCurrency(billingData.paymentsTotal)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Final Bill Summary */}
              <div className='bg-white rounded-xl border mb-6 overflow-hidden'>
                <div className='bg-gray-50 p-4 border-b'>
                  <h3 className='text-lg font-semibold flex items-center'>
                    <span className='text-blue-600 mr-2'>📝</span>
                    Bill Summary
                  </h3>
                </div>

                <div className='p-4'>
                  <div className='space-y-2'>
                    {billingData.roomCharges.map(room => (
                      <div key={room.id}>
                        {/* Room charge display */}
                        <div className='flex justify-between py-2'>
                          <span className='text-gray-600'>
                            Room {room.roomNumber} ({room.nights} night{room.nights !== 1 ? 's' : ''})
                          </span>
                          <span className='font-medium'>
                            {formatCurrency(Number(room.pricePerNight) * room.nights)}
                          </span>
                        </div>

                        {/* Extra beds for this specific room */}
                        {room.extraBeds.count > 0 && (
                          <div className='flex justify-between py-2 pl-4'>
                            <span className='text-gray-600'>
                              Extra Beds (Room {room.roomNumber} × {room.extraBeds.count}):
                            </span>
                            <span className='font-medium'>{formatCurrency(room.extraBeds.price)}</span>
                          </div>
                        )}

                        {/* Room tax if applicable */}
                        {room.tax && room.tax > 0 && (
                          <div className='flex justify-between py-2 pl-4'>
                            <span className='text-gray-600'>Tax (Room {room.roomNumber}):</span>
                            <span className='font-medium'>{formatCurrency(room.tax)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {billingData.serviceCharges.length > 0 && (
                      <div className='mt-4'>
                        {billingData.serviceCharges.map((service, index) => (
                          <div key={index} className='flex justify-between py-2'>
                            <span className='text-gray-600'>{service.name}</span>
                            <span className='font-medium'>{formatCurrency(service.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className='flex justify-between py-2 border-t border-gray-200 mt-2'>
                      <span className='text-lg font-bold'>Grand Total:</span>
                      <span className='text-lg font-bold'>{formatCurrency(billingData.grandTotal)}</span>
                    </div>

                    <div className='flex justify-between py-2 text-green-600'>
                      <span>Total Payments:</span>
                      <span>-{formatCurrency(billingData.totalPayments)}</span>
                    </div>

                    {/* Refund section */}
                    {billingData.balanceDue < 0 && (
                      <div className='bg-yellow-50 p-3 rounded-lg mt-3 border border-yellow-200'>
                        <div className='flex items-center text-yellow-700'>
                          <svg className='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                              clipRule='evenodd'
                            />
                          </svg>
                          <span className='font-medium'>Refund Required</span>
                        </div>
                        <div className='flex justify-between mt-2 font-medium'>
                          <span>Refund Amount:</span>
                          <span className='text-red-600'>{formatCurrency(Math.abs(billingData.balanceDue))}</span>
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex justify-between py-2 border-t border-gray-200 mt-2 ${billingData.balanceDue < 0 ? 'text-red-600' : 'text-blue-600'}`}
                    >
                      <span className='text-xl font-bold'>
                        {billingData.balanceDue < 0 ? 'Refund Due:' : 'Balance Due:'}
                      </span>
                      <span className='text-xl font-bold'>{formatCurrency(Math.abs(billingData.balanceDue))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className='space-y-6 mt-8'>
                <div className='bg-white rounded-xl border overflow-hidden'>
                  <div className='bg-gray-50 p-4 border-b'>
                    <h3 className='text-lg font-semibold flex items-center'>
                      <span className='text-blue-600 mr-2'>💳</span>
                      {billingData.balanceDue < 0 ? 'Process Refund' : 'Complete Payment'}
                    </h3>
                  </div>

                  <div className='p-6'>
                    {/* Payment status messages */}
                    {billingData.balanceDue <= 0 && (
                      <div
                        className={`p-3 rounded-lg mb-4 flex items-center ${billingData.balanceDue < 0 ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}
                      >
                        {billingData.balanceDue < 0 ? (
                          <>
                            <span className='mr-2'>💰</span>
                            Customer has overpaid! Refund of {formatCurrency(Math.abs(billingData.balanceDue))}{' '}
                            required.
                          </>
                        ) : (
                          <>
                            <span className='mr-2'>✅</span>
                            Booking is fully paid. No payment required.
                          </>
                        )}
                      </div>
                    )}

                    {billingData.balanceDue > 0 && (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                        {/* Payment method selection */}
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-gray-700'>Payment Method</label>
                          <select
                            className='w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-200 bg-white'
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(Number(e.target.value))}
                          >
                            <option value={0}>💵 Cash</option>
                            <option value={2}>🌐 Online Payment</option>
                            <option value={1}>💳 Card</option>
                          </select>
                        </div>

                        {/* Conditional Reference Number Input - Now properly conditional */}
                        {(paymentMethod === 2 || paymentMethod === 1) && (
                          <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>Transaction Reference</label>
                            <input
                              type='text'
                              className='w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-200'
                              placeholder='Enter transaction ID/reference'
                              value={referenceNumber}
                              onChange={e => setReferenceNumber(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Notes */}
                    {billingData.balanceDue !== 0 && (
                      <div className='space-y-2 mb-6'>
                        <label className='block text-sm font-medium text-gray-700'>
                          {billingData.balanceDue > 0 ? 'Payment Notes' : 'Refund Notes'}
                        </label>
                        <textarea
                          className='w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-200'
                          rows={2}
                          value={paymentNote}
                          onChange={e => setPaymentNote(e.target.value)}
                          placeholder={
                            billingData.balanceDue > 0 ? 'Add any payment notes...' : 'Add any refund notes...'
                          }
                        />
                        <div>
                          <label className='block text-sm font-medium text-gray-700 my-2'>
                            {billingData.balanceDue > 0 ? 'Amount paid now' : 'Refund amount'}
                          </label>
                          <input
                            className='w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-200'
                            value={amount}
                            onChange={e => {
                              // Remove non-numeric characters except decimal point
                              let value = e.target.value.replace(/[^0-9.]/g, '')

                              // Ensure only one decimal point
                              const decimalCount = (value.match(/\./g) || []).length
                              if (decimalCount > 1) {
                                value = value.slice(0, value.lastIndexOf('.'))
                              }

                              // Ensure maximum of 2 decimal places
                              if (value.includes('.')) {
                                const parts = value.split('.')
                                if (parts[1].length > 2) {
                                  value = parts[0] + '.' + parts[1].slice(0, 2)
                                }
                              }

                              // Convert to number and check against balance
                              const numValue = parseFloat(value || 0)
                              if (!isNaN(numValue)) {
                                if (numValue > Math.abs(billingData.balanceDue)) {
                                  setamount(Math.abs(billingData.balanceDue).toFixed(2))
                                } else {
                                  setamount(value)
                                }
                              } else {
                                setamount('')
                              }
                            }}
                            onBlur={() => {
                              // Format to 2 decimal places on blur
                              if (amount) {
                                const numValue = parseFloat(amount)
                                if (!isNaN(numValue)) {
                                  setamount(numValue.toFixed(2))
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Success/Error Messages */}
                    {paymentSuccess && (
                      <div className='bg-green-50 text-green-800 p-3 rounded-lg mb-4 flex items-center'>
                        <span className='mr-2'>✅</span>
                        {billingData.balanceDue > 0
                          ? 'Payment processed successfully!'
                          : 'Refund processed successfully!'}
                      </div>
                    )}

                    {paymentError && (
                      <div className='bg-red-50 text-red-800 p-3 rounded-lg mb-4 flex items-center'>
                        <span className='mr-2'>❌</span> {paymentError}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className='flex justify-end gap-4 mt-6'>
                      <button
                        onClick={() => {}}
                        className='px-6 py-2.5 border rounded-xl hover:bg-gray-50 transition-colors'
                      >
                        Close
                      </button>

                      <button
                        onClick={handlePayment}
                        disabled={
                          isPaying ||
                          (billingData.balanceDue !== 0 &&
                            ['ONLINE', 'CARD'].includes(paymentMethod) &&
                            !referenceNumber)
                        }
                        className={`px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors ${
                          isPaying || billingData.balanceDue === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : billingData.balanceDue > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {isPaying ? (
                          <>
                            <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            Processing...
                          </>
                        ) : billingData.balanceDue === 0 ? (
                          'Completed'
                        ) : billingData.balanceDue > 0 ? (
                          <>
                            <span>Confirm Payment and checkout</span>
                            <span>→</span>
                          </>
                        ) : (
                          <>
                            <span>Process Refund</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                      {/* 
                      <button
                        onClick={handleCheckout}
                        className={`px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors ${
                          isCheckingOut
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isCheckingOut ? (
                          <>
                            <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            Processing...
                          </>
                        ) : (
                          <>
                            <span>Checkout without payment</span>
                            <span>✓</span>
                          </>
                        )}
                      </button> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
