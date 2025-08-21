"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { FaFileInvoice, FaSearch } from 'react-icons/fa';

type Booking = {
    id: number;
    checkIn: string;
    checkOut: string;
    occupancy: number;
    customer?: { name: string, phoneNumber: string };
    room?: { roomNumber: string };
    bookedBy?: { name: string };
    stayedBy?: { name: string };
    user?: { name: string };
};

export default function BillingTable() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const filtersRef = useRef({
        bookingDate,
        customerName,
        customerPhone,
    });

    // Update ref when filters change
    useEffect(() => {
        filtersRef.current = { bookingDate, customerName, customerPhone };
    }, [bookingDate, customerName, customerPhone]);

    // Modified fetchBookings using ref
    const fetchBookings = async () => {
        try {
            setIsLoading(true);
            const query = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: '10',
                ...(filtersRef.current.bookingDate && { bookingDate: filtersRef.current.bookingDate }),
                ...(filtersRef.current.customerName && { customerName: filtersRef.current.customerName }),
                ...(filtersRef.current.customerPhone && { customerPhone: filtersRef.current.customerPhone })
            });

            const response = await fetch(`/api/invoices/closed?${query.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch bookings');
            const data = await response.json();
            setBookings(data.data || []);
            setTotalPages(data.meta.totalPages || 1);
            setTotalItems(data.meta.totalItems || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset filters function
    const resetFilters = () => {
        // Reset the state values
        setBookingDate('');
        setCustomerName('');
        setCustomerPhone('');

        // Also reset the ref values immediately
        filtersRef.current = {
            bookingDate: '',
            customerName: '',
            customerPhone: ''
        };
        // Now fetch with the cleared filters
        fetchBookings();
    };

    // Update useEffect dependencies
    useEffect(() => {
        fetchBookings();
    }, [currentPage, bookingDate]);

    useEffect(() => {
        fetchBookings()
    }, [])

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };
    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    // Date formatting utilities
    const formatDateWithDay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).replace(/,/, ' ·');
    };
    const getTimeOnly = (date: Date | string) => {
        const timeString = new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const [timePart, periodPart] = timeString.split(' ');
        return `${timePart.replace(':', '.')} ${periodPart.toLowerCase().replace('m', '.m.')}`;
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="container mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">INVOICE</h1>
                </div>

                {/* Filter section */}
                <div className="mb-4 flex gap-4 flex-wrap justify-between items-center">
                    <div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-white p-2 rounded border hover:bg-gray-50"
                        >
                            <Calendar size={18} />
                            <span>Filter</span>
                        </button>
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-lg shadow-lg mb-4 border border-[#c59f56]/20">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Date Filter */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-[#c59f56] mb-1">
                                    Booking Date
                                </label>
                                <input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#c59f56]/30 rounded-lg focus:ring-2 focus:ring-[#c59f56]/50 focus:border-[#c59f56]"
                                />
                            </div>

                            {/* Name Filter */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-[#c59f56] mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Search by name"
                                    className="w-full px-3 py-2 border border-[#c59f56]/30 rounded-lg focus:ring-2 focus:ring-[#c59f56]/50 focus:border-[#c59f56]"
                                />
                            </div>

                            {/* Phone Filter */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-[#c59f56] mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Search by phone"
                                    className="w-full px-3 py-2 border border-[#c59f56]/30 rounded-lg focus:ring-2 focus:ring-[#c59f56]/50 focus:border-[#c59f56]"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={fetchBookings}
                                    className="w-full bg-[#c59f56] hover:bg-[#b38d45] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaSearch />
                                    Search
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="w-full bg-white border border-[#c59f56] text-[#c59f56] hover:bg-[#f8f5ed] px-4 py-2 rounded-lg transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#c59f56]/20">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#c59f56]/20">
                            <thead className="bg-[#f8f5ed]">
                                <tr>
                                    {["Check-In", "Check-Out", "Customer", "Room", "Invoice"].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-4 text-left text-sm font-semibold text-[#c59f56] uppercase tracking-wider border-b border-[#c59f56]/30"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#c59f56]/20">
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center">
                                            <div className="flex flex-col items-center justify-center text-[#c59f56]/60">
                                                <span className="text-3xl mb-2">📋</span>
                                                No bookings found
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            className="hover:bg-[#f8f5ed]/40 transition-colors"
                                        >
                                            {/* Check-In */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {formatDateWithDay(booking.checkIn)}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">
                                                        {getTimeOnly(booking.checkIn)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Check-Out */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {formatDateWithDay(booking.checkOut)}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">
                                                        {getTimeOnly(booking.checkOut)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-medium">
                                                        {booking.customer?.name || 'N/A'}
                                                    </span>
                                                    <span className="text-[#c59f56] text-sm">
                                                        {booking.customer?.phoneNumber}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Room */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="inline-flex items-center bg-[#f8f5ed] px-3 py-1 rounded-lg border border-[#c59f56]/20">
                                                    <span className="text-[#c59f56] font-medium">#{booking.room?.roomNumber}</span>
                                                    {/* <span className="ml-2 text-gray-500 text-sm">
                                                        ({booking.room?.type?.name})
                                                    </span> */}
                                                </div>
                                            </td>

                                            {/* Invoice Action */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => router.push(`/dashboards/invoices/detail?bookingId=${booking.id}`)}
                                                    className="flex items-center gap-2 bg-[#c59f56] hover:bg-[#b38d45] text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-sm"
                                                >
                                                    <FaFileInvoice className="w-4 h-4" />
                                                    <span className="text-sm font-medium">View Invoice</span>
                                                </button>
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
        </div>
    );
}
