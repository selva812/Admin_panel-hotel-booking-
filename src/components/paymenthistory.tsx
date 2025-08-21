'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Clock, CheckCircle, XCircle, DollarSign, Calendar, User, X } from 'lucide-react'

interface Payment {
    id: number
    amount: number
    method: number
    date: Date
    isadvance: boolean
    transactionid?: string | null
    note?: string | null
    status: boolean
    bill?: {
        id: number
        invoiceId?: string | null
        totalAmount: number
    } | null
}

interface PaymentHistoryModalProps {
    bookingId: number
    onClose: () => void
}

const PaymentHistoryModal = ({ bookingId, onClose }: PaymentHistoryModalProps) => {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [bookingInfo, setBookingInfo] = useState({
        bookingRef: '',
        customerName: ''
    })

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/payments?bookingId=${bookingId}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch payments')
                }

                setPayments(data.data.payments)
                setBookingInfo({
                    bookingRef: data.data.bookingRef,
                    customerName: data.data.customerName
                })
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchPayments()
    }, [bookingId])

    const getMethodName = (method: number) => {
        switch (method) {
            case 0: return 'Cash'
            case 1: return 'Card'
            case 2: return 'Online'
            default: return 'Unknown'
        }
    }

    const getMethodIcon = (method: number) => {
        switch (method) {
            case 0: return <DollarSign size={16} className="text-green-500" />
            case 1: return <CreditCard size={16} className="text-blue-500" />
            case 2: return <CreditCard size={16} className="text-purple-500" />
            default: return <CreditCard size={16} />
        }
    }

    const getStatusIcon = (status: boolean) => {
        return status ? (
            <CheckCircle className="text-green-500" size={16} />
        ) : (
            <XCircle className="text-red-500" size={16} />
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Payment History</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">Loading payment history...</div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">Error: {error}</div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-8">No payments found for this booking</div>
                    ) : (
                        <>
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <CreditCard size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Booking: {bookingInfo.bookingRef}</h3>
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <User size={16} /> {bookingInfo.customerName}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                {getMethodIcon(payment.method)}
                                                <div>
                                                    <h4 className="font-medium">
                                                        {payment.isadvance ? 'Advance Payment' : 'Final Payment'}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                                        <Calendar size={14} />
                                                        {new Date(payment.date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">
                                                    ₹{payment.amount}
                                                </span>
                                                {getStatusIcon(payment.status)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Payment Method</p>
                                                <p className="font-medium">{getMethodName(payment.method)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Transaction ID</p>
                                                <p className="font-medium">{payment.transactionid || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {payment.bill && (
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-500">Bill Reference</p>
                                                <p className="font-medium">
                                                    {payment.bill.invoiceId || `Bill #${payment.bill.id}`}
                                                </p>
                                            </div>
                                        )}

                                        {payment.note && (
                                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                                <p className="text-sm text-gray-500">Note</p>
                                                <p className="text-gray-700">{payment.note}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PaymentHistoryModal
