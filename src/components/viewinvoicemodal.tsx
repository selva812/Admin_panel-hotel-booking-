"use client";
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
    X, CalendarIcon, UserIcon, BuildingIcon, PhoneIcon, CreditCardIcon,
    BedIcon, MapPinIcon, ClockIcon, IndianRupee, Users, Baby,
    BedDouble, FileTextIcon, CheckCircle,
    AlertCircle, Receipt, Home, Star, Utensils,
    ArrowRightIcon
} from 'lucide-react';
import {
    InformationCircleIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

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
    bookingstatus: number;
    user: User;
    customer: Customer;
    payments: Payment[]
    bookedBy: User;
    bookedRooms: BookingRoom[];
    purposeOfVisit: PurposeOfVisit;
    bookingType: BookingType;
    bill: Bill;
    services: Service[];
}

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: number | null;
}

interface Hotel {
    id: number;
    gst: string;
    name: string;
    contact: string;
    address: string;
    logo: string;
}
export default function InvoiceModal({ isOpen, onClose, bookingId }: InvoiceModalProps) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [hotel, sethotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const paymentMethodMap: any = {
        0: { name: 'Cash', icon: IndianRupee },
        1: { name: 'Card', icon: CreditCardIcon },
        2: { name: 'Online', icon: PhoneIcon }
    };

    useEffect(() => {
        const fetchBooking = async () => {
            if (bookingId && isOpen) {
                try {
                    setLoading(true);
                    setError(null);
                    const response = await fetch(`/api/invoices/details?id=${bookingId}`);
                    const data = await response.json();

                    if (response.ok) {
                        setBooking(data.booking);
                        sethotel(data.hotelInfo)
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
        };
        fetchBooking();
    }, [bookingId, isOpen]);

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Invoice</h3>
                        <p className="text-gray-600">Please wait while we fetch the details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Invoice</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                    <div className="text-center">
                        <FileTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h3>
                        <p className="text-gray-600 mb-6">No booking found with ID: {bookingId}</p>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Receipt className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* <button
                            onClick={handlePrint}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Print Invoice"
                        >
                            <PrinterIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download Invoice"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button> */}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-6">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8 p-6 border border-gray-200 rounded-xl">
                        <div className="flex items-start gap-4">
                            {hotel?.logo ? (
                                <div className="flex-shrink-0"> {/* Container to prevent logo from affecting layout */}
                                    <img
                                        src={hotel.logo}
                                        alt="Hotel Logo"
                                        className="w-32 h-32 object-contain" // Reduced from w-48 h-48 to more reasonable size
                                    />
                                </div>
                            ) : (
                                <Home className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                            )}
                            <div className="mt-1"> {/* Added mt-1 to align text with logo */}
                                <h1 className="text-3xl font-bold text-gray-800">
                                    {hotel?.name || 'MARAN RESIDENCY'}
                                </h1>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                    <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                                    <span>{hotel?.address || 'Kovilpatti, Tamil Nadu'}</span>
                                </div>
                                {hotel?.gst && (
                                    <p className="text-gray-600 mt-2">GSTIN: {hotel.gst}</p>
                                )}
                                {hotel?.contact && (
                                    <p className="text-gray-600 mt-1">Contact: {hotel.contact}</p>
                                )}
                            </div>
                        </div>
                        <div className="text-right border-l border-gray-200 pl-6 flex-shrink-0">
                            <div className="flex items-center gap-2 justify-end mb-2">
                                <FileTextIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <h2 className="text-2xl font-semibold text-blue-700">INVOICE</h2>
                            </div>
                            <p className="text-lg font-medium text-gray-800">#{booking.bill?.invoiceId || 'N/A'}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{format(new Date(booking.bill.createdAt), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <ClockIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{format(new Date(booking.bill.createdAt), 'hh:mm a')}</span>
                            </div>
                        </div>
                    </div>
                    {/* Booking Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="border border-gray-200 p-6 rounded-xl hover:shadow-md transition-shadow bg-white">
                            <div className="flex items-center gap-3 mb-4">
                                <CalendarIcon className="w-6 h-6 text-blue-600" />
                                <h3 className="font-semibold text-gray-700">Booking Dates</h3>
                            </div>

                            {firstRoom ? (
                                <div className="space-y-2">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Check-In</p>
                                            <p className="text-lg font-medium text-gray-900">
                                                {format(new Date(firstRoom.checkIn), 'dd MMM yyyy')}
                                            </p>
                                        </div>
                                        <ArrowRightIcon className="w-5 h-5 text-gray-400 mt-5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Check-Out</p>
                                            <p className="text-lg font-medium text-gray-900">
                                                {format(new Date(firstRoom.checkOut), 'dd MMM yyyy')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 mt-2 border-t border-gray-100">
                                        <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                            <BedIcon className="w-4 h-4 text-gray-500" />
                                            <span>
                                                {nights} night{nights !== 1 ? 's' : ''} •
                                                <span className="ml-1">
                                                    {format(new Date(firstRoom.checkIn), 'EEE')} to {format(new Date(firstRoom.checkOut), 'EEE')}
                                                </span>
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">N/A</p>
                            )}
                        </div>

                        <div className="border border-gray-200 p-6 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <UserIcon className="w-6 h-6 text-green-600" />
                                <h3 className="font-semibold text-gray-700">Booked By</h3>
                            </div>
                            <p className="text-lg font-medium text-gray-900">{booking.bookedBy.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <PhoneIcon className="w-4 h-4" />
                                {booking.bookedBy.phone}
                            </p>
                        </div>

                        <div className="border border-gray-200 p-6 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <CheckCircle className="w-6 h-6 text-purple-600" />
                                <h3 className="font-semibold text-gray-700">Status</h3>
                            </div>
                            <p className="text-lg font-medium text-gray-900 capitalize">
                                {booking.bookingstatus === 0 ? 'Checked Out' : booking.bookingstatus === 1 ? 'Checked In' : 'Unknown Status'}
                            </p>
                            <p className="text-sm text-gray-600">Booking #{booking.bookingref}</p>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="mb-8 border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-6 h-6 text-indigo-600" />
                            <h3 className="text-xl font-semibold text-gray-800">Customer Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <UserIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-700">Name</p>
                                    <p className="text-gray-900">{booking.customer.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <PhoneIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-700">Phone</p>
                                    <p className="text-gray-900">{booking.customer.phoneNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <BuildingIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-700">Company</p>
                                    <p className="text-gray-900">{booking.customer.companyName || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Star className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-700">Purpose</p>
                                    <p className="text-gray-900">{booking.purposeOfVisit.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Room Details */}
                    <div className="mb-8 border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <BedIcon className="w-6 h-6 text-orange-600" />
                            <h3 className="text-xl font-semibold text-gray-800">
                                Room Details ({booking.bookedRooms.length})
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {booking.bookedRooms.map((room) => (
                                <div key={room.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <BedDouble className="w-6 h-6 text-blue-600" />
                                            <div>
                                                <p className="text-lg font-semibold">Room {room.room.roomNumber}</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                                    <span>{room.room.type.name}</span>
                                                    <span>•</span>
                                                    <span>{room.room.floor.name}</span>
                                                    <span>•</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.isAc ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {room.isAc ? 'AC' : 'Non-AC'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold flex items-center gap-1">
                                                <IndianRupee className="w-4 h-4" />
                                                {room.bookedPrice}/night
                                            </p>
                                            {parseFloat(room.tax) > 0 && (
                                                <p className="text-sm text-gray-600">+ ₹{room.tax} tax</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-gray-600">Adults</p>
                                                <p className="font-medium">{room.adults}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Baby className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-gray-600">Children</p>
                                                <p className="font-medium">{room.children}</p>
                                            </div>
                                        </div>
                                        {room.extraBeds > 0 && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <BedIcon className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-gray-600">Extra Beds</p>
                                                        <p className="font-medium">{room.extraBeds}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-gray-600">Extra Bed Price</p>
                                                        <p className="font-medium">₹{room.extraBedPrice}</p>
                                                    </div>
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
                        <div className="mb-8 border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Utensils className="w-6 h-6 text-green-600" />
                                <h3 className="text-xl font-semibold text-gray-800">Additional Services</h3>
                            </div>
                            <div className="space-y-3">
                                {booking.services.map((service) => (
                                    <div key={service.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Utensils className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">{service.name}</span>
                                            <span className="text-sm text-gray-600">(Qty: {service.quantity})</span>
                                        </div>
                                        <p className="font-semibold flex items-center gap-1">
                                            <IndianRupee className="w-4 h-4" />
                                            {service.price}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment Summary */}
                    <div className="mb-8 border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <CreditCardIcon className="w-6 h-6 text-emerald-600" />
                            <h3 className="text-xl font-semibold text-gray-800">Payment Summary</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="border border-gray-200 p-4 rounded-lg text-center">
                                <p className="text-gray-600 font-medium mb-2">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                                    <IndianRupee className="w-5 h-5" />
                                    {booking.bill.totalAmount}
                                </p>
                            </div>
                            <div className="border border-green-200 p-4 rounded-lg text-center bg-green-50">
                                <p className="text-green-700 font-medium mb-2">Total Paid</p>
                                <p className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                                    <IndianRupee className="w-5 h-5" />
                                    {booking.bill.totalPaid}
                                </p>
                            </div>
                            <div className={`border p-4 rounded-lg text-center ${parseFloat(booking.bill.balance) > 0
                                ? 'border-red-200 bg-red-50'
                                : 'border-green-200 bg-green-50'
                                }`}>
                                <p className={`font-medium mb-2 ${parseFloat(booking.bill.balance) > 0 ? 'text-red-700' : 'text-green-700'
                                    }`}>
                                    Balance
                                </p>
                                <p className={`text-2xl font-bold flex items-center justify-center gap-1 ${parseFloat(booking.bill.balance) > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                    <IndianRupee className="w-5 h-5" />
                                    {booking.bill.balance}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {booking.bill?.payments?.length > 0 && (
                        <div className="mb-8 border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Receipt className="w-6 h-6 text-blue-600" />
                                <h3 className="text-xl font-semibold text-gray-800">Payment History</h3>
                            </div>
                            <div className="space-y-3">
                                {booking.payments.map((payment) => {
                                    const paymentMethod = paymentMethodMap[payment.method] || {
                                        name: 'Unknown',
                                        icon: IndianRupee,
                                        color: 'text-gray-500',
                                        bgColor: 'bg-gray-100'
                                    };

                                    return (
                                        <div
                                            key={payment.id}
                                            className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${paymentMethod.bgColor} ${paymentMethod.color}`}>
                                                    <paymentMethod.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {paymentMethod.name}
                                                    </p>
                                                    <div className="space-y-1 mt-1">
                                                        {payment.note && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                <InformationCircleIcon className="w-3.5 h-3.5" />
                                                                {payment.note}
                                                            </p>
                                                        )}
                                                        {payment.transactionid && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <DocumentTextIcon className="w-3.5 h-3.5" />
                                                                TXN: {payment.transactionid}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900 text-lg flex items-center justify-end gap-1">
                                                    <IndianRupee className="w-4 h-4" />
                                                    {payment.amount}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1 flex items-center justify-end gap-1">
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    {format(new Date(payment.date), 'dd MMM yyyy, hh:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="pt-6 border-t border-gray-200 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Home className="w-5 h-5 text-blue-600" />
                            <p className="font-semibold text-gray-900">Thank you for choosing MARAN RESIDENCY</p>
                        </div>
                        {/* <p className="text-gray-600 flex items-center justify-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            For any queries, please contact: +91 XXXXXXXXXX
                        </p> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
