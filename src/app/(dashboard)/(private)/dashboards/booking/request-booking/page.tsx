'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { Search, Calendar } from 'lucide-react';
import { ChevronDownIcon, Eye, PlusCircle, Trash2, X, XCircle, Check, AlertTriangle, Edit, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import DeleteButtonWithModal from '@/components/deletemodal';
import BookingDetailsModal from '@/components/advancebookingmodal';
import DeleteBookingModal from '@/components/deletemodal';
import { EditBookingModal } from '@/components/editadvancebook';
import { TransparentLoader } from '@/components/transparent';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
    Bed,
    Users,
    Zap,
    ZapOff,
    CalendarClock,
    Wifi,
    Tv,
    ShowerHead,
    Coffee
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
type Customer = {
    id: number;
    name: string;
    phoneNumber: string;
}

type Booking = {
    paymentTotal: string;
    id: number;
    phoneNumber: string;
    customerName: string;
    date: string;
    rooms: number;
    status: number;
    createdAt: string;
    customerPhone: string;
    bookingstatus: number;
    bookingref: string;
    isadvance: boolean;
};

export default function RequestBookingPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [date, setDate] = useState('');
    const [numberOfRooms, setNumberOfRooms] = useState(1);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [sortBy, setSortBy] = useState<'date' | 'createdAt' | 'status'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [searchPhone, setSearchPhone] = useState('')
    const [searchName, setSearchName] = useState('')
    const [searchDate, setSearchDate] = useState('')
    const [customer, setCustomer] = useState<Customer | null>();
    const [advancePaymentReference, setAdvancePaymentReference] = useState('')
    const [isadvance, setIsadvance] = useState(false)
    const [advancePaymentMethod, setAdvancePaymentMethod] = useState('')
    const [advanceamount, setAdvanceAmount] = useState('')
    const [roomloading, setroomloading] = useState(false)
    const [hasSelected, setHasSelected] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedid, setselectedid] = useState(Number);
    const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<Booking | null>(null);
    const [refundmethod, setrefundmethod] = useState(0)
    const [refundtransaction, setrefundtransaction] = useState('')
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);
    const [availableRooms, setavailableRooms] = useState<{
        occupancy: number;
        online_nonac: number;
        online_ac: number;
        nextCheckin: any;
        expectedCheckout: any; id: number;
        roomNumber: string; type: string; floor: string; isAc: boolean; acPrice: number; nonAcPrice: number;
        status: string
    }[]>([])

    const openRefundModal = (booking: Booking) => {
        setSelectedBookingForRefund(booking);
        setShowRefundModal(true);
        setDropdownState({ id: null, x: 0, y: 0 });
    };

    const toggleRoomSelection = (roomId: any) => {
        setSelectedRooms(prev => {
            if (prev.includes(roomId)) {
                return prev.filter(id => id !== roomId);
            } else {
                return [...prev, roomId];
            }
        });
        setNumberOfRooms(selectedRooms.includes(roomId) ? numberOfRooms - 1 : numberOfRooms + 1);
    };

    const handleRefundSubmit = async () => {
        setIsProcessingRefund(true); // Start loading
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/request-booking/detail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookingId: selectedBookingForRefund?.id,
                    refundAmount: selectedBookingForRefund?.paymentTotal,
                    refundMethod: refundmethod,
                    transaction: refundtransaction,
                })
            });

            if (response.ok) {
                toast.success("Refund processed successfully");
                // Optionally refresh data or update state here
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to process refund");
            }
        } catch (error) {
            console.error('Refund error:', error);
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsProcessingRefund(false); // End loading
            setShowRefundModal(false);
            fetchBookings()
        }
    };
    const cancelBooking = async (bookingId: number) => {
        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/request-booking', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });

            if (!response.ok) throw new Error('Failed to cancel booking');

            setShowCancelModal(false);
            fetchBookings(); // Refresh the list
        } catch (err: any) {
            console.error('Failed to cancel booking', err);
            setError(err.message || 'Failed to cancel booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openCancelModal = (bookingId: number) => {
        setCurrentBookingId(bookingId);
        setShowCancelModal(true);
        setError(null);
    };

    const paymentMethod = [
        { id: 0, name: 'Cash' },
        { id: 1, name: 'Card' },
        { id: 2, name: 'Online' }
    ]


    const [dropdownState, setDropdownState] = useState<{
        id: number | null
        x: number
        y: number
    }>({ id: null, x: 0, y: 0 })

    const handleDropdownOpen = (e: React.MouseEvent, id: number) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setDropdownState(prev =>
            prev.id === id
                ? { id: null, x: 0, y: 0 } // toggle off if same ID
                : { id, x: rect.left, y: rect.bottom }
        )
    }

    const [room, setroom] = useState({
        totalRooms: 0,
        booked: 0,
        available: 0
    })
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (
                !target.closest('.dropdown-menu') &&
                !target.closest('.dropdown-trigger') &&
                !target.closest('button') // or specify stricter check
            ) {
                setDropdownState({ id: null, x: 0, y: 0 })
            }
        }

        const handleScroll = () => {
            if (dropdownState.id !== null) {
                setDropdownState({ id: null, x: 0, y: 0 })
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('scroll', handleScroll, true)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [dropdownState.id])

    const fetchBookings = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: pageSize.toString(),
                searchPhone,
                searchName,
                searchDate
            })
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/request-booking?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            const { data, pagination } = await res.json()
            console.log('data', data)
            setBookings(data)
            setTotalPages(pagination.totalPages)
            setTotalEntries(pagination.total)
        } catch (error) {
            console.error('Failed to fetch bookings', error)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (date) {
            fetchRoom();
        }
    }, [date]);

    const fetchRoom = async () => {
        try {
            setroomloading(true);
            setNumberOfRooms(0);
            const res = await fetch(`/api/booking-calender/date?date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setavailableRooms(data.availableRooms)
                setroom({
                    totalRooms: data.totalRooms,
                    booked: data.booked,
                    available: data.available,
                });

                // Reset number of rooms if it exceeds availability
                if (numberOfRooms > data.available) {
                    setNumberOfRooms(data.available);
                }
            } else {
                console.error('Room fetch failed');
            }
        } catch (error) {
            console.error('Error in fetchRoom:', error);
        } finally {
            setroomloading(false);
        }
    };
    useEffect(() => {
        fetchBookings();
    }, [currentPage, pageSize]);

    const searchCustomerByPhone = async (phone: string) => {
        if (phone.length < 3 || hasSelected) {
            setCustomerSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const res = await fetch(`/api/customers/search?phone=${phone}`);
            const data = await res.json();
            setCustomerSuggestions(data);
            setShowSuggestions(data.length > 0);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
        setHasSelected(false); // Reset selection state on new input
    };

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            if (phoneNumber && !hasSelected) { // Only search if no selection made
                searchCustomerByPhone(phoneNumber);
            }
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [phoneNumber, hasSelected]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !customerName || !date || !numberOfRooms || selectedRooms.length === 0) {
            alert('Please fill in all required fields and select rooms.');
            return;
        }

        // Validate number of selected rooms matches requested number
        if (selectedRooms.length !== numberOfRooms) {
            alert(`Please select exactly ${numberOfRooms} room(s).`);
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const checkIn = new Date(date).toISOString();

            // Get room details for selected rooms
            const selectedRoomDetails = availableRooms.filter((room: any) =>
                selectedRooms.includes(room.id)).map((room: any) => ({
                    roomId: room.id,
                    isAc: room.isAc,
                    price: room.isAc ? room.acPrice : room.nonAcPrice
                }));

            const res = await fetch('/api/request-booking', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber,
                    customerName,
                    checkIn,
                    numberOfRooms,
                    selectedRooms: selectedRoomDetails, // Send selected room details
                    isadvance,
                    amount: advanceamount,
                    method: advancePaymentMethod,
                    transaction: advancePaymentReference,
                }),
            });

            if (res.ok) {
                resetForm();
                fetchBookings();
                setIsModalOpen(false);
                toast.success('Booking created successfully');
            } else {
                const errorData = await res.json();
                console.error('Failed to create booking:', errorData);
                toast.error(errorData.message || 'Failed to create booking');
            }
        } catch (error) {
            console.error('Error creating booking', error);
            toast.error('Error creating booking');
        } finally {
            setSubmitting(false);
        }
    };

    const sortedBookings = [...bookings].sort((a, b) => {
        const compare = (a: any, b: any) => {
            if (sortBy === 'date' || sortBy === 'createdAt') {
                const dateA = new Date(a[sortBy]).getTime();
                const dateB = new Date(b[sortBy]).getTime();
                return dateA - dateB;
            }

            if (sortBy === 'status') {
                const statusOrder = ['PENDING', 'CONFIRMED', 'CANCELLED'];
                return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
            }

            return a[sortBy].localeCompare(b[sortBy]);
        };

        return sortOrder === 'asc' ? compare(a, b) : -compare(a, b);
    });

    const handleSort = (column: 'date' | 'createdAt' | 'status') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const SortArrow = ({ column }: { column: 'date' | 'createdAt' | 'status' }) => {
        if (sortBy !== column) return null;

        return (
            <span className="ml-2">
                {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const resetForm = () => {
        setPhoneNumber('');
        setCustomerName('');
        setDate('');
        setNumberOfRooms(1);
        setShowSuggestions(false);
        setCustomerSuggestions([]);
    };

    const selectCustomer = (customer: Customer) => {
        setPhoneNumber(customer.phoneNumber);
        setCustomerName(customer.name);
        setShowSuggestions(false);
        setCustomerSuggestions([])
        setHasSelected(true);
    };

    return (
        // <Suspense fallback={<p>Loading search params...</p>}>
        <div className=" px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-indigo-600">Booking Requests</h1>
                <button
                    onClick={() => {
                        setCustomer(null)
                        setPhoneNumber('');
                        setCustomerName('');
                        setIsModalOpen(true)
                    }}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
                >
                    Add Advance Booking
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                        {/* Header */}
                        <div className="flex justify-between items-center border-b p-5 sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-indigo-600">🛏 New Booking Request</h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✖
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Step 1: Customer Information */}
                                <section className="p-4 bg-gray-50 rounded-lg border">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">1️⃣ Customer Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Phone */}
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={phoneNumber}
                                                onChange={handlePhoneChange}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                required
                                            />
                                            {showSuggestions && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {customerSuggestions.map((customer) => (
                                                        <div
                                                            key={customer.id}
                                                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                                                            onClick={() => selectCustomer(customer)}
                                                        >
                                                            <div className="font-medium">{customer.name}</div>
                                                            <div className="text-sm text-gray-600">{customer.phoneNumber}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                required
                                            />
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                            <input
                                                type="datetime-local"
                                                value={date}
                                                onChange={(e) => {
                                                    setDate(e.target.value);
                                                    setSelectedRooms([]);
                                                }}
                                                min={new Date().toISOString().split("T")[0]}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                required
                                            />
                                        </div>

                                        {/* Number of Rooms */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Number of Rooms
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={room.available || 1}
                                                value={numberOfRooms}
                                                onChange={(e) => setNumberOfRooms(Number(e.target.value))}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                required
                                                disabled
                                            />
                                            <div className="mt-1 text-xs">
                                                {roomloading ? (
                                                    <span className="text-gray-500">Checking availability...</span>
                                                ) : room.available === 0 ? (
                                                    <span className="text-red-500">No rooms available</span>
                                                ) : (
                                                    <span className="text-green-600">{room.available} rooms available</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Step 2: Room Selection */}
                                {date && room.available > 0 && (
                                    <section className="p-4 bg-white rounded-lg border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-800">2️⃣ Select Rooms</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {availableRooms.map((room) => {
                                                const selected = selectedRooms.includes(room.id);
                                                const isAvailable = room.status === 'available';
                                                const isBlocked = room.status === 'blocked';
                                                const isBooked = room.status === 'booked' || room.status === 'occupied';

                                                const formattedCheckout = room.expectedCheckout
                                                    ? format(
                                                        toZonedTime(parseISO(room.expectedCheckout), 'Asia/Kolkata'),
                                                        'd MMM yyyy, h:mm a'
                                                    )
                                                    : null;

                                                const formattedCheckin = room.nextCheckin
                                                    ? format(
                                                        toZonedTime(parseISO(room.nextCheckin), 'Asia/Kolkata'),
                                                        'd MMM yyyy, h:mm a'
                                                    )
                                                    : null;

                                                return (
                                                    <div
                                                        key={room.id}
                                                        onClick={() => (isAvailable || isBlocked) && toggleRoomSelection(room.id)}
                                                        className={`relative rounded-lg p-4 border cursor-pointer transition-all h-full flex flex-col
        ${selected
                                                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                                : isBlocked
                                                                    ? 'border-yellow-400 bg-yellow-50 hover:border-yellow-500'
                                                                    : isBooked
                                                                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm bg-white'
                                                            }`}
                                                    >
                                                        {/* Availability Label - Top Right */}
                                                        <span className={`absolute -top-2 right-2 px-2 py-1 rounded-full text-xs font-medium
        ${isAvailable
                                                                ? 'bg-green-100 text-green-800'
                                                                : isBlocked
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {isAvailable ? 'Available' : isBlocked ? 'Blocked' : 'Booked'}
                                                        </span>

                                                        {/* Room Header */}
                                                        <div className="mb-3">
                                                            <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                                                <Bed className="w-4 h-4 text-indigo-600" />
                                                                {room.roomNumber} - {room.type}
                                                            </h4>
                                                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                                                <Users className="w-3 h-3 text-gray-500" />
                                                                {room.floor} • Max {room.occupancy} {room.occupancy > 1 ? 'guests' : 'guest'}
                                                            </p>
                                                        </div>

                                                        {/* Pricing Table - Only AC Prices */}
                                                        <div className="mt-2 text-xs border border-gray-200 rounded-lg overflow-hidden">
                                                            {/* Table Header */}
                                                            <div className="grid grid-cols-3 bg-gray-50 px-3 py-2 border-b border-gray-200">
                                                                <span className="text-gray-700 font-medium text-left">Type</span>
                                                                <span className="text-gray-700 font-medium text-center">Walk-in</span>
                                                                <span className="text-blue-600 font-medium text-center">Online</span>
                                                            </div>

                                                            {/* AC Row Only */}
                                                            <div className={`grid grid-cols-3 px-3 py-2 bg-blue-50`}>
                                                                <span className="text-gray-600 text-left flex items-center gap-1">
                                                                    <Zap className="w-3 h-3 text-blue-500" /> AC
                                                                </span>
                                                                <span className="text-gray-800 font-medium text-center flex items-center justify-center gap-0.5">
                                                                    <IndianRupee className="w-3 h-3" />{room.acPrice}
                                                                </span>
                                                                <span className="text-blue-600 text-center flex items-center justify-center gap-0.5">
                                                                    <IndianRupee className="w-3 h-3" />{room.online_ac}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Blocked Status - Show Next Checkin */}
                                                        {isBlocked && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                                                                <CalendarClock className="w-3 h-3" />
                                                                <span>Check-in: {formattedCheckin}</span>
                                                            </div>
                                                        )}

                                                        {/* Booked/Occupied Status - Show Expected Checkout */}
                                                        {isBooked && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                                                                <CalendarClock className="w-3 h-3" />
                                                                <span>Available after: {formattedCheckout}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* Step 3: Payment */}
                                <section className="p-4 bg-gray-50 rounded-lg border">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">3️⃣ Payment</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="checkbox"
                                            id="advance"
                                            className="form-checkbox h-4 w-4 text-indigo-600"
                                            checked={isadvance}
                                            onChange={(e) => setIsadvance(e.target.checked)}
                                        />
                                        <label htmlFor="advance" className="text-sm font-medium text-gray-700">Pay Advance</label>
                                    </div>
                                    {isadvance && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                                <select
                                                    value={advancePaymentMethod}
                                                    onChange={(e) => setAdvancePaymentMethod(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                >
                                                    <option value="">Select Method</option>
                                                    {paymentMethod.map((method) => (
                                                        <option key={method.id} value={method.id}>{method.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2">₹</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={advanceamount}
                                                        onChange={(e) => setAdvanceAmount(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                        placeholder="Enter amount"
                                                    />
                                                </div>
                                            </div>
                                            {advancePaymentMethod && advancePaymentMethod !== "CASH" && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                                                    <input
                                                        type="text"
                                                        value={advancePaymentReference}
                                                        onChange={(e) => setAdvancePaymentReference(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                        placeholder="Enter transaction ID"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="border-t p-4 sticky bottom-0 bg-white">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || selectedRooms.length !== numberOfRooms}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : '✅ Complete Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg p-5 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    {/* Search Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                        {/* Customer Search */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer
                            </label>
                            <div className="relative">
                                {hasSelected && customer ? (
                                    <div className="flex items-center justify-between w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div>
                                            <div className="font-medium text-gray-900">{customer.name}</div>
                                            <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCustomer(null);
                                                setHasSelected(false);
                                                setPhoneNumber('');
                                            }}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all shadow-sm"
                                            placeholder="Search by name or phone number"
                                        />
                                        {showSuggestions && customerSuggestions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg divide-y divide-gray-200 max-h-60 overflow-auto">
                                                {customerSuggestions.map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                                                        onClick={() => selectCustomer(customer)}
                                                    >
                                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                                        <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Date Search */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    placeholder="Select date"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all shadow-sm appearance-none"
                                />
                                {searchDate && (
                                    <button
                                        onClick={() => setSearchDate('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 md:ml-auto">
                        <button
                            onClick={() => { setCurrentPage(1); fetchBookings(); }}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Search className="h-5 w-5" />
                            Search
                        </button>

                        <button
                            onClick={() => {
                                setSearchPhone('');
                                setSearchName('');
                                setSearchDate('');
                                setCurrentPage(1);
                                fetchBookings();
                            }}
                            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            <X className="h-5 w-5" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>
            {loading ? (
                <TransparentLoader />
            ) : (
                <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full table-auto">
                        <thead className="bg-indigo-600 text-white">
                            <tr>
                                <th className="py-3 px-4 text-left">Actions</th>
                                <th className="py-3 px-4 text-left">Customer</th>

                                <th
                                    className="py-3 px-4 text-left cursor-pointer hover:bg-indigo-700"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center">
                                        Date
                                        <SortArrow column="date" />
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-left">Rooms</th>
                                <th className="py-3 px-4 text-left">Advance</th>
                                <th
                                    className="py-3 px-4 text-left cursor-pointer hover:bg-indigo-700"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        <SortArrow column="status" />
                                    </div>
                                </th>
                                <th
                                    className="py-3 px-4 text-left cursor-pointer hover:bg-indigo-700"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center">
                                        Created At
                                        <SortArrow column="createdAt" />
                                    </div>
                                </th>

                            </tr>
                        </thead>
                        <tbody>
                            {sortedBookings.map((booking) => {
                                // Status mapping configuration
                                const statusConfig: any = {
                                    0: { text: 'Checkout', class: 'bg-blue-200 text-blue-800' },
                                    1: { text: 'Checkin', class: 'bg-green-200 text-green-800' },
                                    2: { text: 'Advance', class: 'bg-yellow-200 text-yellow-800' },
                                    3: { text: 'Cancelled', class: 'bg-gray-200 text-gray-800 line-through' }
                                };

                                const currentStatus = statusConfig[booking.status] || {
                                    text: 'Unknown',
                                    class: 'bg-gray-200 text-gray-800'
                                };
                                const bookingDate = new Date(booking.date)
                                const today = new Date()
                                bookingDate.setHours(0, 0, 0, 0)
                                today.setHours(0, 0, 0, 0)

                                const isDisabled = bookingDate > today || [3, 1].includes(booking.status)

                                return (
                                    <tr
                                        key={booking.id}
                                        className={`border-b hover:bg-gray-50 odd:bg-white even:bg-gray-50 ${[3, 1].includes(booking.status) // Cancelled (3) or Checkin (1)
                                            ? 'cursor-default'
                                            : 'cursor-pointer'
                                            }`}

                                    >
                                        <td className="pl-6 whitespace-nowrap border-r border-b">
                                            <div className="flex items-center">
                                                <button
                                                    onClick={(e) => handleDropdownOpen(e, booking.id)}
                                                    className="flex items-center space-x-2 group relative"
                                                >
                                                    <span className="font-medium text-blue-600 group-hover:text-blue-800 transition-colors duration-300">
                                                        Action
                                                    </span>
                                                    <div className="relative flex items-center">
                                                        <ChevronDownIcon
                                                            className={`h-5 w-5 text-blue-500 group-hover:text-blue-700 transition-all duration-300 ${dropdownState.id === booking.id ? 'rotate-180' : ''
                                                                }`}
                                                        />

                                                    </div>
                                                    <span className="absolute -bottom-1 -left-2 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-out"></span>
                                                </button>

                                                {dropdownState.id === booking.id && (
                                                    <div
                                                        className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-48"
                                                        style={{
                                                            top: dropdownState.y,
                                                            left: dropdownState.x,
                                                        }}
                                                    >
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Handle view action here
                                                                    setSelectedBooking(booking)

                                                                    setDropdownState({ id: null, x: 0, y: 0 });
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                <span>View Details</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (user?.role !== 'ADMIN') {
                                                                        toast.error('Only admin can edit bookings.');
                                                                        return
                                                                    }
                                                                    setEditingBooking(booking);
                                                                    setDropdownState({ id: null, x: 0, y: 0 });
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                <span>Edit Booking</span>
                                                            </button>
                                                            <button
                                                                className={`flex items-center w-full px-4 py-2 text-sm ${isDisabled ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'} transition-colors`}
                                                                onClick={() => {
                                                                    if (isDisabled) return;
                                                                    const queryString = new URLSearchParams({
                                                                        bookingData: JSON.stringify(booking.id),
                                                                    }).toString();
                                                                    setTimeout(() => {
                                                                        router.push(`/dashboards/booking/create?${queryString}`);
                                                                    }, 0);
                                                                    setDropdownState({ id: null, x: 0, y: 0 });
                                                                }}
                                                                disabled={isDisabled}
                                                            >
                                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                                <span>Book Room</span>
                                                            </button>

                                                            {booking.status === 2 ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openCancelModal(booking.id);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                                                >
                                                                    <X className="w-4 h-4 mr-2" />
                                                                    <span>Cancel Booking</span>
                                                                </button>
                                                            ) : booking.status === 3 ? (
                                                                <div className="flex items-center px-4 py-2 text-gray-400">
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    <span className="text-sm">Cancelled</span>
                                                                </div>
                                                            ) : null}
                                                            {booking.status === 3 && booking.paymentTotal && parseFloat(booking.paymentTotal) > 0 ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openRefundModal(booking);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                                                >
                                                                    <IndianRupee className="w-4 h-4 mr-2" />
                                                                    <span>Refund</span>
                                                                </button>
                                                            ) : null}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (user?.role !== 'ADMIN') {
                                                                        toast.error('Only admin can Delete bookings.');
                                                                        return
                                                                    }
                                                                    setShowDeleteModal(true)
                                                                    setselectedid(booking.id)
                                                                    setDropdownState({ id: null, x: 0, y: 0 });
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                <span>Delete</span>
                                                            </button>
                                                        </>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="font-medium text-gray-900">
                                                {booking.customerName || <span className="text-gray-400">-</span>}
                                            </div>
                                            {booking.customerPhone && (
                                                <div className="text-sm text-gray-500 mt-1">{booking.customerPhone}</div>
                                            )}
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="text-gray-900 font-medium">
                                                {format(new Date(booking.date), 'dd MMM yyyy')}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {format(new Date(booking.date), 'hh:mm a')}
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {typeof booking.rooms === 'number' ? (
                                                    <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium">
                                                        {booking.rooms} {booking.rooms === 1 ? 'Room' : 'Rooms'}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="flex items-center">
                                                <span className="text-gray-900 font-medium">
                                                    ₹{booking.paymentTotal || 0}
                                                </span>
                                                {/* {parseInt(booking.paymentTotal) > 0 && (
                                                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                                                        Paid
                                                    </span>
                                                )} */}
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="flex items-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.class}`}>
                                                    {currentStatus.text}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="text-gray-600 text-sm">
                                                {format(new Date(booking.createdAt), 'dd MMM yyyy')}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {format(new Date(booking.createdAt), 'hh:mm a')}
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {showCancelModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
                                        <h3 className="text-lg font-semibold text-gray-800">Cancel Booking</h3>
                                    </div>

                                    <p className="text-gray-600 mb-6">
                                        Are you sure you want to cancel this booking? This action cannot be undone.
                                    </p>

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center">
                                            <XCircle className="w-5 h-5 mr-2" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => setShowCancelModal(false)}
                                            disabled={isProcessing}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Go Back
                                        </button>
                                        <button
                                            onClick={() => currentBookingId && cancelBooking(currentBookingId)}
                                            disabled={isProcessing}
                                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Confirm Cancellation
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="border rounded-md px-2 py-1 text-sm"
                            >
                                {[10, 25, 50].map((size) => (
                                    <option key={size} value={size}>
                                        Show {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <TransparentLoader />
                    )}
                    {!loading && bookings.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            No bookings found
                        </div>
                    )}

                    <DeleteBookingModal
                        bookingId={selectedid}
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onDeleteSuccess={() => {
                            toast.success('Booking Deleted successfully')
                            fetchBookings()
                        }}
                    />
                </div>
            )}
            {showRefundModal && selectedBookingForRefund && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Process Refund</h3>
                            <button onClick={() => setShowRefundModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Booking Reference</p>
                                <p className="font-medium">{selectedBookingForRefund.bookingref}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Customer</p>
                                <p className="font-medium">{selectedBookingForRefund.customerName}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">{selectedBookingForRefund.phoneNumber || selectedBookingForRefund.customerPhone}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Amount to Refund</p>
                                <p className="font-medium text-green-600">
                                    {parseFloat(selectedBookingForRefund.paymentTotal).toFixed(2)}
                                </p>
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Refund Method
                                </label>
                                <select
                                    value={refundmethod}
                                    onChange={(e) => { setrefundmethod(parseInt(e.target.value)) }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select refund method</option>
                                    <option value="0">Cash</option>
                                    <option value="1">Card</option>
                                    <option value="2">Online</option>
                                </select>
                            </div>
                            {refundmethod !== 0 ?
                                <div className="pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Transaction id
                                    </label>
                                    <textarea
                                        value={refundtransaction}
                                        onChange={(e) => { setrefundtransaction(e.target.value) }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Transaction id for refund "
                                    // Add your state management for the notes
                                    />
                                </div> : null}
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                disabled={isProcessingRefund}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefundSubmit}
                                className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={isProcessingRefund}
                            >
                                {isProcessingRefund ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Process Refund'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
            {editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    onClose={() => {
                        fetchBookings()
                        setEditingBooking(null)
                    }}
                // onUpdate={(updatedBooking) => {
                //     // Update your local state or refetch data
                //     setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
                // }}
                />
            )}
        </div>
        // </Suspense> 
    );
}
