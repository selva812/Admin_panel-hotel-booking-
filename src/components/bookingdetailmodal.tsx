'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TransparentLoader } from '@/components/transparent'
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowUpRight,
    Building,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    DoorOpen,
    MessageSquare,
    X,
    User,
    Phone,
    Building2,
    IdCard,
    MapPin
} from 'lucide-react'

interface Booking {
    bookingref: string
    activated?: boolean
    createdAt?: string
    checkIn?: string
    checkOut?: string
    bookingstatus: number
    advance?: number
    bookingType?: {
        name: string
    }
    purposeOfVisit?: {
        name: string
    }
    arriveFrom?: string
    customer?: {
        picture?: string
        name: string
        phone?: string
        companyName?: string
        idNumber?: string
        address?: string
    }
    bookedRooms?: Array<{
        roomName?: string
        roomNumber?: string
        floor?: string
        maxOccupancy?: number
        image?: string
        acSelected?: boolean
        adults?: number
        children?: number
        extraBed?: number
        extraBedPrice?: number
        price?: number
    }>
    payments?: Array<{
        id: number
        amount: number
        method: number // 0: cash, 1: card, 2: online
        date: string
        transactionid?: string
        note?: string
    }>
}

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    bookingId: string
}

export default function BookingModal({ isOpen, onClose, bookingId }: BookingModalProps) {
    const [booking, setBooking] = useState<Booking | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                if (!bookingId) return

                const response = await fetch(`/api/booking/details?id=${bookingId}`)
                if (!response.ok) throw new Error('Failed to fetch booking')
                const data = await response.json()
                setBooking(data)
            } catch (err) {
                console.error('Error:', err)
                setError('Failed to load booking details')
            } finally {
                setLoading(false)
            }
        }

        if (isOpen) {
            fetchBooking()
        }
    }, [isOpen, bookingId])

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        try {
            const date = new Date(dateString)
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN')
        } catch {
            return 'Invalid Date'
        }
    }

    const formatTime = (dateString?: string) => {
        if (!dateString) return 'N/A'
        try {
            const date = new Date(dateString)
            return isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString('en-IN')
        } catch {
            return 'Invalid Time'
        }
    }

    if (!isOpen) return null

    if (loading) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <TransparentLoader />
        </div>
    )

    if (error) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="text-red-500 text-center">{error}</div>
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )

    if (!booking) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="text-center">Booking not found</div>
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto z-50">
            <div className="bg-gray-50 rounded-2xl shadow-xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gray-50 p-6 border-b flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                        >
                            <X size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Booking #{booking.bookingref}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {booking.activated !== undefined && (
                                    <span
                                        className={`px-2 py-1 rounded-full text-sm ${booking.activated ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {booking.activated ? 'Active' : 'Upcoming'}
                                    </span>
                                )}
                                {booking.createdAt && (
                                    <span className="text-sm text-gray-500">Created {formatDate(booking.createdAt)}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    {/* Customer Card */}
                    {booking.customer && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Customer Avatar */}
                                <div className="relative group">
                                    {booking.customer.picture ? (
                                        <img
                                            src={`/uploads/${booking.customer.picture}`}
                                            alt="Customer"
                                            className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-4xl font-bold text-gray-600 border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105">
                                            {booking.customer.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>

                                {/* Customer Details */}
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                                <User className="text-blue-500" size={20} />
                                                {booking.customer.name || 'Unknown Customer'}
                                            </h2>

                                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                                {booking.customer.phone && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                                                            <Phone className="text-blue-500" size={16} />
                                                            <span className="text-md font-medium text-gray-500">Phone:</span>
                                                            <span className="font-medium">{booking.customer.phone}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {booking.customer.companyName && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md">
                                                            <Building2 className="text-purple-500" size={16} />
                                                            <span className="text-md font-medium text-gray-500">Company:</span>
                                                            <span className="font-medium">{booking.customer.companyName}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {booking.customer.idNumber && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                                                            <IdCard className="text-green-500" size={16} />
                                                            <span className="text-md font-medium text-gray-500">ID:</span>
                                                            <span className="font-medium">{booking.customer.idNumber}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    {booking.customer.address && (
                                        <div className="flex items-start gap-2 text-gray-600 mt-2">
                                            <div className="flex items-start gap-1 bg-rose-50 px-2 py-1 rounded-md">
                                                <MapPin className="flex-shrink-0 mt-0.5 text-rose-500" size={16} />
                                                <div>
                                                    <span className="text-xs font-medium text-gray-500 block">Address:</span>
                                                    <span className="text-sm">{booking.customer.address}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Timeline Section */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Dates Card */}
                            {(booking.checkIn || booking.checkOut) && (
                                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-700">
                                        <CalendarDays size={20} />
                                        Booking Timeline
                                    </h3>

                                    <div className="flex items-center justify-between gap-4">
                                        {/* Check-in Section */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                                <ArrowDownLeft size={24} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Check-in</p>
                                                <p className="font-semibold">{formatDate(booking.checkIn)}</p>
                                                <p className="text-xs text-gray-500">{formatTime(booking.checkIn)}</p>
                                            </div>
                                        </div>

                                        {/* Timeline Divider */}
                                        {booking.bookingstatus === 0 ? (
                                            <>
                                                <div className="flex flex-col items-center justify-center mx-4">
                                                    <div className="w-8 border-t-2 border-dashed border-gray-200"></div>
                                                    <span className="text-gray-400 text-sm mx-2">→</span>
                                                    <div className="w-8 border-t-2 border-dashed border-gray-200"></div>
                                                </div>
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <ArrowUpRight size={24} className="text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Check-out</p>
                                                        <p className="font-semibold">{formatDate(booking.checkOut)}</p>
                                                        <p className="text-xs text-gray-500">{formatTime(booking.checkOut)}</p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            )}

                            {/* Rooms Section */}
                            {booking.bookedRooms && booking.bookedRooms.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-700">
                                        <DoorOpen size={20} />
                                        Booked Rooms ({booking.bookedRooms.length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {booking.bookedRooms.map((room, index) => (
                                            <div
                                                key={index}
                                                className="border rounded-xl p-4 hover:shadow-lg transition-all duration-200 group relative"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                                        {room.image && (
                                                            <img
                                                                src={`/rooms/${room.image}`}
                                                                className="w-full h-full object-cover"
                                                                alt={room.roomName || 'Room'}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition">
                                                            {room.roomName || 'Room'} ({room.roomNumber || 'N/A'})
                                                        </h4>
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            {room.floor || 'Floor N/A'} • Max {room.maxOccupancy || 0} guests
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs ${room.acSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                                                            >
                                                                {room.acSelected ? 'AC' : 'Non-AC'}
                                                            </span>
                                                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                                Adults: {room.adults || 0}
                                                            </span>
                                                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                                                Children: {room.children || 0}
                                                            </span>
                                                            {(room.extraBed || 0) !== 0 && (
                                                                <span className="px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700">
                                                                    Extra Bed (+₹{room.extraBedPrice || 0})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">Total Price</span>
                                                        <span className="font-semibold">₹{room.price || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Booking Summary */}
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                                    <ClipboardList size={20} />
                                    Booking Summary
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Booking Type:</span>
                                        <span className="font-medium">{booking.bookingType?.name || 'N/A'}</span>
                                    </div>
                                    {booking.purposeOfVisit && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Purpose:</span>
                                            <span className="font-medium">{booking.purposeOfVisit.name}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Arrival From:</span>
                                        <span className="font-medium">{booking.arriveFrom || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                                    <CreditCard size={20} />
                                    Payment Summary
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Amount Paid:</span>
                                            <span className={`font-medium ${(booking.advance || 0) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                                ₹{booking.advance || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {booking.payments && booking.payments.length > 0 && (
                                        <div className="mt-4 border rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 p-3 border-b">
                                                <h3 className="font-medium text-gray-700">Payment History</h3>
                                            </div>

                                            <div className="divide-y">
                                                {booking.payments.map(payment => (
                                                    <div key={payment.id} className="p-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium">₹{payment.amount}</p>
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    {payment.method === 0 ? '💵 Cash' : payment.method === 1 ? '💳 Card' : '🌐 Online'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                                                                {payment.transactionid && (
                                                                    <p className="text-xs text-gray-400 mt-1">Ref: {payment.transactionid}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {payment.note && <p className="text-sm text-gray-600 mt-2">Note: {payment.note}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(booking.advance || 0) > 0 && booking.createdAt && (
                                        <div className="mt-4 bg-blue-50 p-3 rounded-lg flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-blue-600" />
                                            <span className="text-sm text-blue-700">Amount paid on {formatDate(booking.createdAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
