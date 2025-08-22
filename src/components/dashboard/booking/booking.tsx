"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Calendar, Check, ChevronDown, ChevronDownIcon, Eye, Filter, Home, Loader2, Pencil, Phone, RotateCcw, Trash2, User, X } from 'lucide-react';
import EditBookingModal from '@/components/bookingmodal';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { TransparentLoader } from '@/components/transparent';
import BookingModal from '@/components/bookingdetailmodal';
type Booking = {
    bookingref: string;
    customerName: string;
    customerPhone: string;
    numberOfRooms: string;
    roomNumbers: any;
    bookingStatus: number;
    bookedRooms: any;
    id: number;
    checkIn: string;
    checkOut: string;
    occupancy: number;
    customer?: { name: string };
    room?: { roomNumber: string };
    bookedBy?: string;
    stayedBy?: { name: string };
    user?: { name: string };
};
interface Room {
    id: number;
    roomNumber: string;
    acPrice: number;
    online_acPrice: number;
    online_nonAcPrice: number;
    nonAcPrice: number;
    type: { id: number; name: string };
    floor: { id: number; name: string };
}

interface BookedRoom {
    id: number;
    roomId: number;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    extraBeds: number;
    isAc: boolean;
    bookedPrice: number;
    room: Room;
}
type BookingType = {
    id: number;
    bookingref: string;
    isonline: boolean;
    bookedRooms: BookedRoom[];
};
interface BookingFilters {
    endDate?: string;
    startDate?: string;
    customerName?: string;
    customerPhone?: string;
    roomNumber?: string;
    status?: string;
}
type Customer = {
    id: number;
    name: string;
    phoneNumber: string;
}
export default function BookingTable() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [dateError, setDateError] = useState('');
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { user: currentUser } = useAuth();
    const [hasSelected, setHasSelected] = useState(false);
    const isAdmin = currentUser?.role === 'ADMIN';
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [editingBooking, setEditingBooking] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [customer, setCustomer] = useState<Customer | null>();
    const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedBookingId, setSelectedBookingId] = useState('')
    const [isNavigating, setIsNavigating] = useState(false)

    const handleNavigate = () => {
        setIsNavigating(true)
        router.push('/dashboards/booking/create')
    }
    const openModal = (bookingId: any) => {
        setSelectedBookingId(bookingId)
        setIsModalOpen(true)
    }
    // State for applied filters (will trigger API call)
    // In your component:
    const [appliedFilters, setAppliedFilters] = useState<BookingFilters>({});
    const [dropdownState, setDropdownState] = useState<{
        id: number | null
        x: number
        y: number
    }>({ id: null, x: 0, y: 0 })
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
        const phoneNumber = e.target.value;
        // setCustomer(prev => prev ? { ...prev, phoneNumber } : { id: 0, name: '', phoneNumber });
        setPhoneNumber(phoneNumber)
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

    const selectCustomer = (selectedCustomer: Customer) => {
        setCustomer(selectedCustomer);
        setPhoneNumber(selectedCustomer.phoneNumber)
        setShowSuggestions(false);
        setCustomerSuggestions([]);
        setHasSelected(true);
    };
    const handleDropdownOpen = (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        setDropdownState(prev =>
            prev.id === id
                ? { id: null, x: 0, y: 0 }
                : { id, x: rect.left, y: rect.bottom }
        )
    }
    const validateDates = () => {
        if (startDate && !endDate) {
            setDateError('Please select both start and end dates');
            return false;
        }
        if (endDate && !startDate) {
            setDateError('Please select both start and end dates');
            return false;
        }
        if (startDate && endDate && endDate < startDate) {
            setDateError('End date cannot be before start date');
            return false;
        }
        setDateError('');
        return true;
    };
    const handleDropdownAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
        setDropdownState({ id: null, x: 0, y: 0 })
        action()
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.dropdown-container')) {
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


    const applyFilters = () => {
        if (!validateDates()) return;
        setAppliedFilters({
            startDate,
            endDate,
            customerName,
            customerPhone,
            roomNumber,
            status: statusFilter
        });
        setCurrentPage(1); // Reset to first page when filters change
    };

    const resetFilters = () => {
        setBookingDate('');
        setStartDate('');
        setEndDate('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomer(null);
        setPhoneNumber('')
        setRoomNumber('');
        setStatusFilter('');
        setAppliedFilters({});
        setCurrentPage(1);
    };

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const query = new URLSearchParams(
                    Object.entries({
                        page: currentPage.toString(),
                        pageSize: '10',
                        ...(appliedFilters.startDate && { startDate: appliedFilters.startDate }),
                        ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
                        ...(customer?.id && { customerId: customer.id.toString() }),
                        ...(appliedFilters.roomNumber && { roomNumber: appliedFilters.roomNumber }),
                        ...(appliedFilters.status && { status: appliedFilters.status })
                    }).filter(([_, value]) => value !== undefined) as [string, string][]
                );

                const response = await fetch(`/api/booking?${query.toString()}`, { signal });
                if (!response.ok) throw new Error('Failed to fetch bookings');

                const data = await response.json();
                setBookings(data.data || []);
                setTotalPages(data.meta.totalPages || 1);
                setTotalItems(data.meta.totalItems || 0);
                setIsInitialLoad(false);
            } catch (err) {
                if (!signal.aborted) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        return () => controller.abort();
    }, [currentPage, appliedFilters, refreshTrigger]);

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const closeFilters = () => {
        setShowFilters(false);
    };

    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    // Date formatting utilities
    const formatDateWithDay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).replace(/,/, ' ·');
    };
    const getTimeOnly = (date: string | Date) => {
        const options: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        const istDate = new Date(date); // 2:53 PM IST
        const utcDate = new Date(istDate.getTime()); // Convert to UTC
        const timeString = new Date(utcDate).toLocaleTimeString('en-IN', options);

        return timeString
            .replace(':', '.') // Replace colon with dot
            .replace(/(AM|PM)/, match => ` ${match.toLowerCase().replace('m', '.m.')}`); // Format am/pm
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            {isLoading ? <TransparentLoader /> :
                <div className="container mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Bookings</h1>
                        <button
                            onClick={handleNavigate}
                            disabled={isNavigating}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isNavigating ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Redirecting...
                                </>
                            ) : (
                                'Add Booking'
                            )}
                        </button>
                    </div>

                    {/* Filter section */}

                    <div className="mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full flex justify-between items-center bg-white border border-gray-300 px-4 py-3 rounded-t-lg text-left hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={18} />
                                <span className="font-medium text-gray-700">Filter</span>
                            </div>
                            <ChevronDown
                                size={18}
                                className={`transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>
                        {/* Filter panel */}
                        {showFilters && (
                            <div className="bg-white p-6 rounded-lg shadow-lg mb-6 relative border border-gray-200">
                                {/* Header with close button */}
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                        <Filter className="w-5 h-5 mr-2 text-blue-600" />
                                        Filter Bookings
                                    </h3>
                                    <button
                                        onClick={closeFilters}
                                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                        aria-label="Close filters"
                                    >
                                        <X size={20} className="text-gray-500 hover:text-gray-700" />
                                    </button>
                                </div>

                                {/* Error Message */}
                                {dateError && (
                                    <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-md flex items-start border border-red-100">
                                        <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{dateError}</span>
                                    </div>
                                )}

                                {/* Filter Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Start Date */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Start Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    setDateError('');
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') validateDates();
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                max={endDate || undefined}
                                            />
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            End Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => {
                                                    const selectedEndDate = e.target.value;
                                                    if (startDate && selectedEndDate < startDate) {
                                                        setDateError('End date cannot be before start date');
                                                        return;
                                                    }
                                                    setEndDate(selectedEndDate);
                                                    setDateError('');
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') validateDates();
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                min={startDate || undefined}
                                            />
                                        </div>
                                    </div>

                                    {/* Customer */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Customer
                                        </label>
                                        <div className="relative">
                                            {hasSelected && customer ? (
                                                <div className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                                        <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
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
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        placeholder="Search by name or phone number"
                                                    />
                                                    {showSuggestions && customerSuggestions.length > 0 && (
                                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg divide-y divide-gray-100 max-h-60 overflow-auto">
                                                            {customerSuggestions.map((customer) => (
                                                                <div
                                                                    key={customer.id}
                                                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                                                                    onClick={() => selectCustomer(customer)}
                                                                >
                                                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                                                    <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Status
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all bg-white"
                                            >
                                                <option value="" disabled>Select status</option>
                                                <option value="0">Checked Out</option>
                                                <option value="1">Checked In</option>
                                                <option value="0,1">Both</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        onClick={resetFilters}
                                        className="px-5 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-gray-700 hover:bg-gray-100 border border-gray-300"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset
                                    </button>
                                    <button
                                        onClick={applyFilters}
                                        className="px-5 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                                    >
                                        <Filter className="w-4 h-4" />
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-lg relative border border-gray-100">
                        <div className="overflow-x-auto border rounded-lg shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-50/60">
                                    <tr>
                                        {["Booking Ref", "Check-In", "Customer", "Room Numbers", "Booked By", "Status"].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider border-b"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {isInitialLoad ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center">
                                                <div className="flex justify-center">
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-2xl mb-2">📭</span>
                                                    No bookings found
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking: any) => (
                                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors cursor-pointer "
                                            // onClick={() =>
                                            //     router.push(`/dashboards/booking/details?id=${booking.id}`)}
                                            >
                                                {/* Booking Ref */}
                                                <td className="pl-6 whitespace-nowrap border-r border-b">
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={(e) => handleDropdownOpen(e, booking.id)}
                                                            className="flex items-center space-x-2 group relative"
                                                        >
                                                            <span className="font-medium text-blue-600 group-hover:text-blue-800 transition-colors duration-300">
                                                                {booking.bookingref || 'Not confirmed'}
                                                                {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-out"></span> */}
                                                            </span>
                                                            <div className="relative flex items-center">
                                                                <ChevronDownIcon
                                                                    className={`h-5 w-5 text-blue-500 group-hover:text-blue-700 transition-all duration-300 ${dropdownState.id === booking.id ? 'rotate-180' : ''
                                                                        }`}
                                                                />
                                                                {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-out"></span> */}
                                                            </div>
                                                            <span className="absolute -bottom-1 -left-1 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-out"></span>
                                                        </button>

                                                        {dropdownState.id === booking.id && (
                                                            <div
                                                                className="dropdown-container fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-48 overflow-hidden"
                                                                style={{
                                                                    top: dropdownState.y,
                                                                    left: dropdownState.x,
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                                                                    onClick={(e) => handleDropdownAction(e, () => {
                                                                        openModal(booking.id)
                                                                    })}
                                                                >
                                                                    <Eye className="w-4 h-4 mr-3" />
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (!isAdmin) {
                                                                            toast.error('Only Admin has access to edit');
                                                                            return;
                                                                        }
                                                                        setIsModalLoading(true);
                                                                        toast.loading('Opening booking editor...', {
                                                                            toastId: 'edit-booking-loading'
                                                                        });
                                                                        setSelectedBooking(booking);
                                                                        setEditingBooking(true);
                                                                        setIsModalLoading(false);
                                                                    }}

                                                                >

                                                                    <Pencil className="w-4 h-4 mr-3" />

                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedBooking(booking);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-3" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Check-In */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-b">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{formatDateWithDay(booking.checkIn)}</span>
                                                        <span className="text-gray-500 text-xs">{getTimeOnly(booking.checkIn)}</span>
                                                    </div>
                                                </td>

                                                {/* Customer */}
                                                <td className="px-6 py-4 whitespace-nowrap border-r border-b">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 font-medium">{booking.customerName}</span>
                                                        <span className="text-gray-500 text-sm">{booking.customerPhone}</span>
                                                    </div>
                                                </td>

                                                {/* Room Numbers */}
                                                <td className="px-6 py-4 whitespace-nowrap border-r border-b">
                                                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                        {booking.roomNumbers.map((num: any) => (
                                                            <span
                                                                key={num}
                                                                className="px-2.5 py-1 bg-gray-100 rounded-md text-gray-700 text-sm font-mono"
                                                            >
                                                                {num}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Booked By */}
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 border-r border-b">{booking.bookedBy}</td>

                                                {/* Status */}
                                                <td className="px-6 py-4 whitespace-nowrap border-b">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${booking.bookingStatus === 1 // Checkin
                                                            ? 'bg-green-100 text-green-800'
                                                            : booking.bookingStatus === 0 // Checkout
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : booking.bookingStatus === 2 // Advance
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : booking.bookingStatus === 3 // Cancelled
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {booking.bookingStatus === 1
                                                            ? 'Checkin'
                                                            : booking.bookingStatus === 0
                                                                ? 'Checkout'
                                                                : booking.bookingStatus === 2
                                                                    ? 'Advance'
                                                                    : booking.bookingStatus === 3
                                                                        ? 'Cancelled'
                                                                        : 'Unknown'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Showing page {currentPage} of {totalPages} ({totalItems} total records)
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1 rounded border ${currentPage === pageNum ? 'bg-[#C59F56] text-white' : 'bg-white text-gray-800 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            }
            {showDeleteModal && selectedBooking?.id && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-800">Delete Booking</h3>
                            </div>

                            <p className="text-gray-600 mb-6">
                                This will permanently delete booking #{selectedBooking.id}. This action cannot be undone.
                            </p>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(`/api/booking?id=${selectedBooking.id}`, {
                                                method: 'DELETE',
                                            });

                                            if (!response.ok) throw new Error('Failed to delete');

                                            setShowDeleteModal(false);
                                            setDropdownState({ id: null, x: 0, y: 0 });
                                            setRefreshTrigger(prev => prev + 1);
                                            toast.success('Booking deleted successfully');
                                        } catch (error) {
                                            toast.error('Failed to delete booking');
                                            console.error('Delete error:', error);
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {editingBooking && selectedBooking && (
                <EditBookingModal
                    booking={selectedBooking}
                    onOpen={() => {
                        toast.dismiss('edit-booking-loading');
                        setIsModalLoading(false);
                    }}
                    onClose={() => {
                        setEditingBooking(false);
                        setSelectedBooking(null);

                    }}
                    onSave={(updatedBooking: any) => {
                        // Handle saving logic
                        console.log('Updated booking:', updatedBooking);
                        setEditingBooking(false);
                        setSelectedBooking(null);
                        setRefreshTrigger(prev => prev + 1);
                    }}
                />
            )}
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                bookingId={selectedBookingId}
            />
        </div>
    );
}
