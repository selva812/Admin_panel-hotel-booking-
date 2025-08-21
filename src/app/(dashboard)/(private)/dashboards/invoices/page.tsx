"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { Calendar, CreditCard, Download, Edit, FileText, Printer, X, History } from 'lucide-react';
import { FaFileInvoice, FaSearch, FaArrowDown } from 'react-icons/fa';
import PaymentModal from '@/components/paymentmodal';
import EditInvoiceModal from '@/components/invoicemodal';
import { TransparentLoader } from '@/components/transparent';
import PaymentHistoryModal from '@/components/paymenthistory';
import InvoiceModal from '@/components/viewinvoicemodal';

type Booking = {
    id: number;
    checkIn: string;
    checkOut: string;
    bookingref: string;
    occupancy: number;
    customer?: { name: string, phoneNumber: string };
    room?: { roomNumber: string };
    bookedBy?: { name: string };
    stayedBy?: { name: string };
    user?: { name: string };
    roomNumbers?: string;
};
export default function BillingTable() {
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [showPaymentHistory, setShowPaymentHistory] = useState(false)
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInvoice, setshowInvoice] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectmaxamount, setselectmaxamount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dateError, setDateerror] = useState('')
    const [dropdownState, setDropdownState] = useState<{
        id: number | null
        x: number
        y: number
    }>({ id: null, x: 0, y: 0 })

    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        bookingDate: '',
        taxType: 'all',
        isOnline: 'all'
    });
    const handleDropdownOpen = (e: React.MouseEvent, id: number) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setDropdownState(prev =>
            prev.id === id
                ? { id: null, x: 0, y: 0 } // toggle off if same ID
                : { id, x: rect.left, y: rect.bottom }
        )
    }
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
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
    // Close dropdown when clicking outside

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // Only close if clicked outside the dropdown and not on a dropdown button
            if (openDropdown !== null && !target.closest('.dropdown-container')) {
                setDropdownState({ id: null, x: 0, y: 0 });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdown]);

    const fetchBookings = async (filterParams = filters) => {
        setDateerror('');
        if (filterParams.fromDate && !filterParams.toDate) {
            setDateerror("Please select a To Date when selecting a From Date");
            return;
        }
        if (filterParams.fromDate && filterParams.toDate && filterParams.fromDate > filterParams.toDate) {
            setDateerror("From Date cannot be after To Date");
            return;
        }

        try {
            setIsLoading(true);
            const query = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: '10',
                ...(filterParams.fromDate && { fromDate: filterParams.fromDate }),
                ...(filterParams.toDate && { toDate: filterParams.toDate }),
                ...(filterParams.bookingDate && { bookingDate: filterParams.bookingDate }),
                ...(filterParams.taxType !== 'all' && { taxType: filterParams.taxType }),
                ...(filterParams.isOnline !== 'all' && { isOnline: filterParams.isOnline }),
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

    const resetFilters = () => {
        const defaultFilters = {
            fromDate: '',
            toDate: '',
            bookingDate: '',
            taxType: 'all',
            isOnline: 'all'
        };

        setFilters(defaultFilters);
        setCurrentPage(1);
        fetchBookings(defaultFilters);
    };
    const handlePdf = async (bookingId: string) => {
        let timeoutId: NodeJS.Timeout | null = null;
        let cleanupExecuted = false;

        const cleanup = () => {
            if (cleanupExecuted) return;
            cleanupExecuted = true;

            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            setIsLoading(false);
        };

        try {
            setDropdownState({ id: null, x: 0, y: 0 });
            setIsLoading(true);

            // Set maximum timeout for the entire operation
            timeoutId = setTimeout(() => {
                console.warn('PDF download operation timed out');
                cleanup();
            }, 30000); // 30 seconds

            const response = await fetch('/api/invoices/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookingId }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate PDF: ${response.status} - ${errorText}`);
            }

            const blob = await response.blob();

            // Validate blob
            if (blob.size === 0) {
                throw new Error('Generated PDF is empty');
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${bookingId}.pdf`;
            a.style.display = 'none';

            document.body.appendChild(a);

            // Trigger download
            a.click();

            // Multiple cleanup strategies
            const finalCleanup = () => {
                try {
                    window.URL.revokeObjectURL(url);
                    if (document.body.contains(a)) {
                        document.body.removeChild(a);
                    }
                } catch (cleanupError) {
                    console.warn('Cleanup error:', cleanupError);
                }
                cleanup();
            };

            // Strategy 1: Listen for browser download events
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    setTimeout(finalCleanup, 1000);
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);

            // Strategy 2: Focus/blur events (when user switches tabs/windows)
            const handleWindowFocus = () => {
                setTimeout(finalCleanup, 500);
                window.removeEventListener('focus', handleWindowFocus);
            };
            window.addEventListener('focus', handleWindowFocus);

            // Strategy 3: Fallback timeout
            setTimeout(finalCleanup, 3000);

        } catch (error) {
            console.error('Error downloading PDF:', error);

            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Failed to download invoice: ${errorMessage}. Please try again.`);

            cleanup();
        }
    };

    const handlePrint = async (bookingId: string) => {
        let timeoutId: NodeJS.Timeout | null = null;
        let cleanupExecuted = false;
        let iframe: HTMLIFrameElement | null = null;
        let blobUrl: string | null = null;

        const cleanup = () => {
            if (cleanupExecuted) return;
            cleanupExecuted = true;

            try {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (blobUrl) {
                    window.URL.revokeObjectURL(blobUrl);
                }

                if (iframe && document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            } catch (cleanupError) {
                console.warn('Cleanup error:', cleanupError);
            }

            setIsLoading(false);
        };

        try {
            setDropdownState({ id: null, x: 0, y: 0 });
            setIsLoading(true);

            // Overall operation timeout - reduced from 45s to 15s
            timeoutId = setTimeout(() => {
                console.warn('PDF print operation timed out');
                cleanup();
            }, 15000);

            const response = await fetch('/api/invoices/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookingId }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate PDF: ${response.status} - ${errorText}`);
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Generated PDF is empty');
            }

            blobUrl = window.URL.createObjectURL(blob);
            iframe = document.createElement('iframe');

            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '-9999px';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            iframe.style.border = 'none';
            iframe.src = blobUrl;

            document.body.appendChild(iframe);

            // Improved print handlers with better cancel detection
            const setupPrintHandlers = () => {
                let printHandled = false;
                let printDialogOpened = false;
                let dialogOpenTime = 0;

                // Clear the main timeout since we're setting up print-specific timeouts
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                const handlePrintComplete = () => {
                    if (printHandled) return;
                    printHandled = true;

                    // Remove all listeners
                    window.removeEventListener('afterprint', handleAfterPrint);
                    window.removeEventListener('beforeprint', handleBeforePrint);
                    window.removeEventListener('focus', handleWindowFocus);
                    document.removeEventListener('visibilitychange', handleVisibilityChange);

                    cleanup();
                };

                const handleAfterPrint = () => {
                    console.log('After print event detected');
                    handlePrintComplete();
                };

                const handleBeforePrint = () => {
                    console.log('Before print event detected');
                    printDialogOpened = true;
                    dialogOpenTime = Date.now();
                };

                // Enhanced focus handler with timing detection
                const handleWindowFocus = () => {
                    if (printHandled) return;

                    // If dialog was opened, check timing to detect cancel vs print completion
                    if (printDialogOpened) {
                        const dialogDuration = Date.now() - dialogOpenTime;

                        // If dialog was closed very quickly (< 1 second), likely cancelled
                        // If longer, user probably printed or took time to decide
                        setTimeout(() => {
                            if (!printHandled) {
                                console.log(`Print dialog was open for ${dialogDuration}ms, cleaning up`);
                                handlePrintComplete();
                            }
                        }, dialogDuration < 1000 ? 100 : 1000);
                    } else {
                        // No beforeprint detected, might be mobile or different browser behavior
                        setTimeout(() => {
                            if (!printHandled) {
                                console.log('Focus returned without beforeprint, cleaning up');
                                handlePrintComplete();
                            }
                        }, 500);
                    }
                };

                // Enhanced visibility change handler
                const handleVisibilityChange = () => {
                    if (printHandled || document.visibilityState !== 'visible') return;

                    setTimeout(() => {
                        if (!printHandled) {
                            console.log('Visibility change detected, cleaning up');
                            handlePrintComplete();
                        }
                    }, 800);
                };

                // Set up event listeners
                window.addEventListener('afterprint', handleAfterPrint);
                window.addEventListener('beforeprint', handleBeforePrint);
                window.addEventListener('focus', handleWindowFocus);
                document.addEventListener('visibilitychange', handleVisibilityChange);

                // Reduced fallback timeout - if nothing happens in 10 seconds, assume cancelled
                setTimeout(() => {
                    if (!printHandled) {
                        console.warn('Print operation timeout (10s), assuming cancelled');
                        handlePrintComplete();
                    }
                }, 10000);
            };

            // Wait for iframe to load, then trigger print
            iframe.onload = () => {
                try {
                    setupPrintHandlers();

                    // Small delay to ensure PDF is fully rendered
                    setTimeout(() => {
                        try {
                            const iframeWindow = iframe?.contentWindow;
                            if (iframeWindow) {
                                iframeWindow.focus();
                                iframeWindow.print();
                            } else {
                                throw new Error('Cannot access iframe content');
                            }
                        } catch (printError) {
                            console.error('Print trigger error:', printError);
                            // Fallback: open in new window
                            const printWindow = window.open(blobUrl!, '_blank');
                            if (printWindow) {
                                printWindow.onload = () => {
                                    printWindow.print();
                                    // Shorter timeout for new window approach
                                    setTimeout(() => {
                                        try {
                                            printWindow.close();
                                        } catch (e) {
                                            // Ignore close errors
                                        }
                                        cleanup();
                                    }, 5000);
                                };
                            } else {
                                throw new Error('Failed to open print window');
                            }
                        }
                    }, 500);

                } catch (setupError) {
                    console.error('Print setup error:', setupError);
                    cleanup();
                }
            };

            // Handle iframe load errors
            iframe.onerror = () => {
                console.error('Failed to load PDF in iframe');
                cleanup();
            };

            // Fallback if iframe doesn't load - reduced timeout
            setTimeout(() => {
                if (!iframe?.contentDocument?.readyState || iframe.contentDocument.readyState !== 'complete') {
                    console.warn('Iframe load timeout, using window.open fallback');
                    try {
                        const printWindow = window.open(blobUrl!, '_blank');
                        if (printWindow) {
                            printWindow.onload = () => {
                                printWindow.print();
                                setTimeout(() => {
                                    cleanup();
                                }, 3000);
                            };
                        }
                    } catch (fallbackError) {
                        console.error('Fallback print method failed:', fallbackError);
                        cleanup();
                    }
                }
            }, 8000); // Reduced from 10s to 8s

        } catch (error) {
            console.error('Error printing PDF:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Failed to print invoice: ${errorMessage}. Please try again.`);

            cleanup();
        }
    };
    useEffect(() => {
        fetchBookings();
    }, [currentPage, bookingDate]);

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    if (error) return (
        <div className="p-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-600">Error: {error}</p>
            </div>
        </div>
    );

    const formatDateWithDay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).replace(/,/, ' ·');
    };
    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
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
    const handlePaymentSuccess = () => {
        setPaymentModalOpen(false)
        fetchBookings()
    }

    return (
        <Suspense fallback={<p>Loading search params...</p>}>
            {isLoading && (
                <TransparentLoader />
            )}
            <div className="px-6 pt-1 pb-6 bg-gray-50 min-h-screen">
                <div className="container mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
                            <p className="text-gray-600 mt-1">Manage and track all booking invoices</p>
                        </div>
                    </div>

                    {/* Filter section */}
                    <div className="mb-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Calendar size={18} className="text-[#c59f56]" />
                            <span className="font-medium">Filter Options</span>
                            <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                                ↓
                            </span>
                        </button>
                    </div>

                    {/* Filter panel */}
                    {showFilters && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
                            {/* Close button */}
                            <button
                                onClick={() => setShowFilters(false)}
                                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-gray-500" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {/* From Date */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.fromDate}
                                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c59f56]/50 focus:border-[#c59f56] transition-all"
                                    />
                                </div>

                                {/* To Date */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.toDate}
                                        min={filters.fromDate}
                                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c59f56]/50 focus:border-[#c59f56] transition-all"
                                    />
                                </div>

                                {/* Tax Type Filter */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Tax Type
                                    </label>
                                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-md border border-gray-200">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio h-4 w-4 text-[#c59f56]"
                                                checked={filters.taxType === 'all'}
                                                onChange={() => handleFilterChange('taxType', 'all')}
                                            />
                                            <span className="ml-2 text-sm">All</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio h-4 w-4 text-[#c59f56]"
                                                checked={filters.taxType === 'tax'}
                                                onChange={() => handleFilterChange('taxType', 'tax')}
                                            />
                                            <span className="ml-2 text-sm">Tax</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio h-4 w-4 text-[#c59f56]"
                                                checked={filters.taxType === 'non-tax'}
                                                onChange={() => handleFilterChange('taxType', 'non-tax')}
                                            />
                                            <span className="ml-2 text-sm">Non-Tax</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Booking Source Filter */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Booking Source
                                    </label>
                                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-md border border-gray-200">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio h-4 w-4 text-[#c59f56]"
                                                checked={filters.isOnline === 'all'}
                                                onChange={() => handleFilterChange('isOnline', 'all')}
                                            />
                                            <span className="ml-2 text-sm">All</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio h-4 w-4 text-[#c59f56]"
                                                checked={filters.isOnline === 'online'}
                                                onChange={() => handleFilterChange('isOnline', 'online')}
                                            />
                                            <span className="ml-2 text-sm">Online</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio h-4 w-4 text-[#c59f56]"
                                                checked={filters.isOnline === 'walk-in'}
                                                onChange={() => handleFilterChange('isOnline', 'walk-in')}
                                            />
                                            <span className="ml-2 text-sm">Walk-In</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons - Will stack on smaller screens */}
                                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row lg:items-end gap-2 md:col-span-4 lg:col-span-1">
                                    <button
                                        onClick={() => fetchBookings()}
                                        className="flex-1 bg-[#c59f56] hover:bg-[#b38d45]  text-white px-3 py-2 h-10 rounded-md transition-all flex items-center justify-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md"
                                    >
                                        <FaSearch className="w-3.5 h-3.5" />
                                        <span>Search</span>
                                    </button>
                                    <button
                                        onClick={resetFilters}
                                        className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 h-10 rounded-md transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {dateError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-start mt-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>{dateError}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-blue-100/75 border-b border-blue-200">
                                    <tr>
                                        {[
                                            'Invoice ID',
                                            'Invoice Date',
                                            'Check-In',
                                            'Customer',
                                            'Room',
                                            'Balance',
                                            'Booked By'
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider border"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <FaFileInvoice className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices found</h3>
                                                    <p className="text-gray-500">Try adjusting your search filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking: any, index: any) => {
                                            return (
                                                <tr
                                                    key={booking.id}
                                                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'
                                                        }`}
                                                >
                                                    {/* Booking ID with dropdown */}
                                                    <td className="px-6 py-4 whitespace-nowrap border relative">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={(e) => handleDropdownOpen(e, booking.id)}

                                                                className=" dropdown-trigger flex items-center gap-2 px-2 py-1 rounded bg-gray-100 border border-blue-200 text-blue-800 font-mono font-medium text-sm hover:bg-gray-200 transition"
                                                            >
                                                                {booking.invoiceref}
                                                                <FaArrowDown
                                                                    className={`w-4 h-4 transition-transform duration-200 ${dropdownState.id === booking.id ? 'rotate-180' : ''
                                                                        }`}
                                                                />
                                                            </button>

                                                            {dropdownState.id === booking.id && (
                                                                <div
                                                                    className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-56 dropdown-menu"
                                                                    style={{
                                                                        top: dropdownState.y,
                                                                        left: dropdownState.x,
                                                                    }}
                                                                >
                                                                    <div className="py-1">
                                                                        {/* Add Payment */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPaymentModalOpen(true);
                                                                                setSelectedBookingId(booking.id);
                                                                                setSelectedBooking(booking);
                                                                                setselectmaxamount(booking.bill?.balance || 0);
                                                                                setDropdownState({ id: null, x: 0, y: 0 });
                                                                            }}
                                                                            disabled={booking.bill?.balance == 0}
                                                                            className={`flex items-center w-full px-4 py-3 text-sm transition-colors duration-150 group ${booking.bill?.balance == 0
                                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                                                                }`}
                                                                        >
                                                                            <CreditCard className="w-4 h-4 mr-3 text-blue-500 group-hover:text-blue-600" />
                                                                            <span>Add Payment</span>
                                                                        </button>

                                                                        {/* View Invoice */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedBookingId(booking.id);
                                                                                setshowInvoice(true);
                                                                                setDropdownState({ id: null, x: 0, y: 0 });
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 group"
                                                                        >
                                                                            <FileText className="w-4 h-4 mr-3 text-blue-500 group-hover:text-blue-600" />
                                                                            <span>View Invoice</span>
                                                                        </button>

                                                                        {/* Download Invoice */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handlePdf(booking.id);
                                                                                setDropdownState({ id: null, x: 0, y: 0 });
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-150 group"
                                                                        >
                                                                            <Download className="w-4 h-4 mr-3 text-green-500 group-hover:text-green-600" />
                                                                            <span>Download Invoice</span>
                                                                        </button>

                                                                        {/* Print Invoice */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handlePrint(booking.id);
                                                                                setDropdownState({ id: null, x: 0, y: 0 });
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-150 group"
                                                                        >
                                                                            <Printer className="w-4 h-4 mr-3 text-orange-500 group-hover:text-orange-600" />
                                                                            <span>Print Invoice</span>
                                                                        </button>

                                                                        {/* Edit Invoice */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedBookingId(booking.id);
                                                                                setIsModalOpen(true);
                                                                                setDropdownState({ id: null, x: 0, y: 0 });
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-150 group"
                                                                        >
                                                                            <Edit className="w-4 h-4 mr-3 text-purple-500 group-hover:text-purple-600" />
                                                                            <span>Edit Invoice</span>
                                                                        </button>

                                                                        {/* Payment History */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedBookingId(booking.id);
                                                                                setDropdownState({ id: null, x: 0, y: 0 });
                                                                                setShowPaymentHistory(true);
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150 group"
                                                                        >
                                                                            <History className="w-4 h-4 mr-3 text-indigo-500 group-hover:text-indigo-600" />
                                                                            <span>Payment History</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* invoice date */}
                                                    <td className="px-6 py-4 whitespace-nowrap border">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {booking.invoicedate ? formatDateWithDay(booking.invoicedate) : 'N/A'}
                                                            </span>
                                                            {booking.invoicedate && (
                                                                <span className="text-xs text-gray-500">
                                                                    {getTimeOnly(booking.invoicedate)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Check-In */}
                                                    <td className="px-6 py-4 whitespace-nowrap border">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {formatDateWithDay(booking.checkIn)}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {getTimeOnly(booking.checkIn)}
                                                            </span>
                                                        </div>
                                                    </td>



                                                    {/* Customer */}
                                                    <td className="px-6 py-4 whitespace-nowrap border">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {booking.customer?.name || 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-blue-600 font-medium">
                                                                {booking.customer?.phoneNumber}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Room */}
                                                    <td className="px-6 py-4 whitespace-nowrap border">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="relative group">
                                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-300 text-blue-800 border border-blue-200 max-w-[120px] truncate">
                                                                    {booking.roomNumbers ?
                                                                        booking.roomNumbers.split(',').length > 3 ?
                                                                            `${booking.roomNumbers.split(',').slice(0, 3).join(',')}...` :
                                                                            booking.roomNumbers
                                                                        : 'N/A'}
                                                                </span>
                                                                {booking.roomNumbers && booking.roomNumbers.split(',').length > 3 && (
                                                                    <div className="absolute z-10 hidden group-hover:block bottom-full mb-2 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap">
                                                                        {booking.roomNumbers}
                                                                        <div className="absolute w-2 h-2 bg-gray-800 rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Balance */}
                                                    <td className="px-6 py-4 whitespace-nowrap border text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`text-sm font-semibold ${booking.bill?.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                ₹{booking.bill?.balance || 0}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Booked By */}
                                                    <td className="px-6 py-4 whitespace-nowrap border">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-300 text-blue-800 border border-blue-200">
                                                                {booking.bookedBy?.name || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600">
                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span> ({totalItems} total records)
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
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
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${currentPage === pageNum
                                            ? 'bg-[#c59f56] text-white border-[#c59f56]'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${currentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
                <PaymentModal
                    bookingId={selectedBookingId!}
                    booking={selectedBooking!}
                    max={selectmaxamount}
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
                <EditInvoiceModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        fetchBookings()
                    }}
                    bookingId={selectedBookingId}
                />
                {showPaymentHistory && (
                    <PaymentHistoryModal
                        bookingId={selectedBookingId!}
                        onClose={() => setShowPaymentHistory(false)}
                    />
                )}
                <InvoiceModal
                    isOpen={showInvoice}
                    onClose={() => setshowInvoice(false)}
                    bookingId={selectedBookingId!}
                />
            </div>
        </Suspense>
    );
}

