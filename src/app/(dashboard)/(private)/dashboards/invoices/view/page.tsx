"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeftIcon, CalendarIcon, UserIcon, BuildingIcon, PhoneIcon, CreditCardIcon, BedIcon } from 'lucide-react';
import { Suspense } from 'react';
import { TransparentLoader } from '@/components/transparent'
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone: string;
    address: string;
}

interface Customer {
    id: number;
    name: string;
    phoneNumber: string;
    companyName: string;
    address?: string;
}

interface RoomType {
    id: number;
    name: string;
}

interface Floor {
    id: number;
    name: string;
}

interface Room {
    id: number;
    roomNumber: string;
    type: RoomType;
    floor: Floor;
    acPrice: string;
    nonAcPrice: string;
    status: string;
    occupancy: number;
}

interface Occupancy {
    id: number;
    name: string;
    phone: string;
    address: string;
    photo: string;
}

interface BookingRoom {
    id: number;
    bookedPrice: string;
    tax: string;
    adults: number;
    children: number;
    extraBeds: number;
    extraBedPrice: string;
    isAc: boolean;
    checkIn: string;
    checkOut: string;
    room: Room;
    occupancies: Occupancy[];
}

interface Payment {
    id: number;
    amount: string;
    method: string;
    date: string;
    note: string;
    transactionid?: string;
}

interface Bill {
    id: number;
    invoiceId: string;
    totalAmount: string;
    totalPaid: string;
    balance: string;
    createdAt: string;
    payments: Payment[];
}

interface PurposeOfVisit {
    id: number;
    name: string;
}

interface BookingType {
    id: number;
    name: string;
}

interface Service {
    id: number;
    name: string;
    price: string;
    quantity: number;
}

interface Booking {
    id: number;
    bookingref: string;
    date: string;
    createdAt: string;
    arriveFrom: string;
    bookingclosed: boolean;
    bookingstatus: string;
    user: User;
    customer: Customer;
    bookedBy: User;
    bookedRooms: BookingRoom[];
    purposeOfVisit: PurposeOfVisit;
    bookingType: BookingType;
    bill: Bill;
    services: Service[];
}

export default function InvoiceDetailPage() {
    const searchParams = useSearchParams()
    const bookingId = searchParams.get('id')
    const router = useRouter()
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const paymentMethodMap: any = {
        0: 'Cash',
        1: 'Card',
        2: 'Online'
    }
    useEffect(() => {
        const fetchBooking = async () => {
            if (bookingId) {
                try {
                    setLoading(true);
                    const response = await fetch(`/api/invoices/details?id=${bookingId}`);
                    const data = await response.json();

                    if (response.ok) {
                        setBooking(data.booking);
                    } else {
                        setError(data.message || 'Failed to fetch booking details');
                    }
                } catch (err) {
                    setError('An unexpected error occurred');
                    console.error('Fetch error:', err);
                } finally {
                    setLoading(false);
                }
            }
        }
        fetchBooking();
    }, [bookingId]);



    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Invoice</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    if (loading) {
        return (
            <TransparentLoader />
        );
    }
    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
                    <p className="text-gray-600">No booking found with ID: {bookingId}</p>
                </div>
            </div>
        );
    }

    // Calculate nights stayed from first room
    const firstRoom = booking.bookedRooms[0];
    const checkInDate = firstRoom ? new Date(firstRoom.checkIn) : new Date();
    const checkOutDate = firstRoom ? new Date(firstRoom.checkOut) : new Date();
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

    return (
        <Suspense fallback={<TransparentLoader />}>
            <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">MARAN RESIDENCY</h1>
                        <p className="text-gray-600">Kovilpatti, Tamil Nadu</p>
                        <p className="text-gray-600 mt-2">GSTIN: XXXXXXXX (if applicable)</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-semibold text-blue-700">INVOICE</h2>
                        <p className="text-gray-700">#{booking.bill?.invoiceId || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            Date: {format(new Date(booking.bill.createdAt), 'dd MMM yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                            Time: {format(new Date(booking.bill.createdAt), 'hh:mm a')}
                        </p>
                    </div>
                </div>

                {/* Booking Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="border p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Booking Dates</h3>
                        <p className="text-gray-900">
                            {/* {firstRoom ? format(new Date(firstRoom.checkIn), 'dd MMM yyyy')} */}
                            {firstRoom ? format(new Date(firstRoom.checkOut), 'dd MMM yyyy') : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">{nights} night(s)</p>
                    </div>

                    <div className="border p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Booked By</h3>
                        <p className="text-gray-900">{booking.bookedBy.name}</p>
                        <p className="text-sm text-gray-600">{booking.bookedBy.phone}</p>
                    </div>

                    <div className="border p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
                        <p className="text-gray-900 capitalize">{booking.bookingstatus}</p>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">
                        Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium text-gray-700">Name</p>
                            <p className="text-gray-900">{booking.customer.name}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">Phone</p>
                            <p className="text-gray-900">{booking.customer.phoneNumber}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">Company</p>
                            <p className="text-gray-900">{booking.customer.companyName || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">Purpose</p>
                            <p className="text-gray-900">{booking.purposeOfVisit.name}</p>
                        </div>
                    </div>
                </div>

                {/* Room Details */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">
                        Room Details ({booking.bookedRooms.length})
                    </h3>
                    <div className="space-y-4">
                        {booking.bookedRooms.map((room) => (
                            <div key={room.id} className="border rounded-lg p-4">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold">Room {room.room.roomNumber}</p>
                                        <p className="text-sm text-gray-600">
                                            {room.room.type.name} • {room.room.floor.name} •{' '}
                                            {room.isAc ? 'AC' : 'Non-AC'}
                                        </p>
                                    </div>
                                    <p className="font-semibold">₹{room.bookedPrice}/night</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Adults</p>
                                        <p>{room.adults}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Children</p>
                                        <p>{room.children}</p>
                                    </div>
                                    {room.extraBeds > 0 && (
                                        <>
                                            <div>
                                                <p className="text-gray-600">Extra Beds</p>
                                                <p>{room.extraBeds}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Extra Bed Price</p>
                                                <p>₹{room.extraBedPrice}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services */}
                {booking.services && booking.services.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">
                            Additional Services
                        </h3>
                        <div className="space-y-2">
                            {booking.services.map((service) => (
                                <div key={service.id} className="flex justify-between">
                                    <p>{service.name} (Qty: {service.quantity})</p>
                                    <p>₹{service.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Summary */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">
                        Payment Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border p-3 rounded">
                            <p className="text-gray-600 font-medium">Total Amount</p>
                            <p className="text-xl font-semibold">₹{booking.bill.totalAmount}</p>
                        </div>
                        <div className="border p-3 rounded">
                            <p className="text-gray-600 font-medium">Total Paid</p>
                            <p className="text-xl font-semibold text-green-600">
                                ₹{booking.bill.totalPaid}
                            </p>
                        </div>
                        <div className="border p-3 rounded">
                            <p className="text-gray-600 font-medium">Balance</p>
                            <p
                                className={`text-xl font-semibold ${parseFloat(booking.bill.balance) > 0
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                    }`}
                            >
                                ₹{booking.bill.balance}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {booking.bill?.payments?.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-800">
                            Payment History
                        </h3>
                        <div className="space-y-3">
                            {booking.bill.payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex justify-between items-center border-b pb-2"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {paymentMethodMap[payment.method] || 'Unknown'}
                                        </p>
                                        {payment.note && (
                                            <p className="text-sm text-gray-600">{payment.note}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">₹{payment.amount}</p>
                                        <p className="text-sm text-gray-600">
                                            {format(new Date(payment.date), 'dd MMM yyyy, hh:mm a')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t text-center text-sm text-gray-600">
                    <p>Thank you for choosing MARAN RESIDENCY</p>
                    <p className="mt-1">For any queries, please contact: +91 XXXXXXXXXX</p>
                </div>
            </div>
        </Suspense>
    );
}
