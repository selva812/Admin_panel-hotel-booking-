'use client'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format, differenceInCalendarDays } from 'date-fns'
import { FaCalendarAlt, FaCheckCircle, FaLock, FaTimes, FaUser, FaUsers } from 'react-icons/fa'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import clsx from 'clsx';
interface AvailabilityPeriod {
    from: string
    to: string
    status: 'AVAILABLE' | 'BOOKED'
    bookingDetails?: {
        id: number
        customerName: string
        occupancy: number
        checkInTime: string
        checkOutTime: string
    }
}

interface RoomDetails {
    id: number;
    roomNumber: string;
    price: string;
    status: string;
    occupancy: number;
    roomName: string;
    floorName: string;
    description: string;
    currentCustomerName: string | null;
    checkOutDate?: string;  // Added optional check-out date
    checkOutTime?: string;  // Added optional check-out time
    amenities: Array<{
        id: number;
        name: string;
        description: string | null;
    }>;
    availability: {
        currentStatus: string;
        periods: AvailabilityPeriod[];
        futureBookings: Array<{
            id: number;
            checkInDate: string;
            checkInTime: string;
            checkOutDate: string;
            checkOutTime: string;
            customerName: string;
            occupancy: number;
        }>;
    };
}

interface RoomDetailsModalProps {
    roomId: number | null
    floorId: number | null
    isOpen: boolean
    onClose: () => void
    onBookRoom: (roomId: number, floorId: number) => void
}
export default function RoomModal({ roomId, isOpen, onClose, onBookRoom, floorId }: RoomDetailsModalProps) {
    const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('details')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    useEffect(() => {
        if (isOpen && roomId) {
            fetchRoomDetails(roomId)
        }
    }, [isOpen, roomId])

    const fetchRoomDetails = async (id: number) => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`/api/room/availability?roomId=${id}`)
            console.log('response ', response.data)
            setRoomDetails(response.data)
        } catch (err) {
            console.error('Failed to fetch room details', err)
            setError('Failed to load room details')
        } finally {
            setLoading(false)
        }
    }

    const isSameDayOrBetween = (date: Date, from: Date, to: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        const f = new Date(from);
        f.setHours(0, 0, 0, 0);

        const t = new Date(to);
        t.setHours(0, 0, 0, 0);

        return d >= f && d <= t;
    };

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-purple-50 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">
                        {loading ? 'Loading...' : roomDetails ? `Room ${roomDetails.roomNumber}` : 'Room Details'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`px-6 py-3 font-medium text-sm ${activeTab === 'details'
                            ? 'text-purple-700 border-b-2 border-purple-700'
                            : 'text-gray-600 hover:text-purple-600'
                            }`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    <button
                        className={`px-6 py-3 font-medium text-sm ${activeTab === 'availability'
                            ? 'text-purple-700 border-b-2 border-purple-700'
                            : 'text-gray-600 hover:text-purple-600'
                            }`}
                        onClick={() => setActiveTab('availability')}
                    >
                        Availability
                    </button>
                </div>

                {/* Modal Content */}
                <div className="overflow-y-auto flex-grow p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-8">{error}</div>
                    ) : roomDetails ? (
                        <>
                            {activeTab === 'details' && (
                                <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
                                    {/* Room Overview */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span
                                                className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold
                        ${roomDetails.status === 'AVAILABLE'
                                                        ? 'bg-green-100 text-green-700'
                                                        : roomDetails.status === 'OCCUPIED'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}
                                            >
                                                {roomDetails.status === 'AVAILABLE' && <FaCheckCircle />}
                                                {roomDetails.status === 'OCCUPIED' && <FaLock />}
                                                {roomDetails.status === 'RESERVED' && <FaCalendarAlt />}
                                                {roomDetails.status}
                                            </span>
                                            <span className="text-sm font-medium text-gray-600">{roomDetails.floorName} Floor</span>
                                            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">
                                                {roomDetails.roomName}
                                            </span>
                                        </div>
                                        <div className="text-3xl font-bold text-purple-700">₹{roomDetails.price}/night</div>
                                    </div>

                                    {/* Room Info & Amenities */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Room Info */}
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-semibold text-gray-800">Room Information</h4>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <FaUsers className="text-purple-500" />
                                                <span>Max Occupancy: {roomDetails.occupancy}</span>
                                            </div>
                                            {roomDetails.status === 'OCCUPIED' && (
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <FaUser className="text-purple-500" />
                                                    <span>Current Guest: {roomDetails.currentCustomerName}</span>
                                                </div>
                                            )}
                                            {roomDetails.description && (
                                                <p className="text-gray-500 mt-2">{roomDetails.description}</p>
                                            )}
                                        </div>

                                        {/* Amenities */}
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-semibold text-gray-800">Amenities</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {roomDetails.amenities.map(amenity => (
                                                    <div key={amenity.id} className="flex items-center gap-2 text-gray-600">
                                                        <FaCheckCircle className="text-green-500" />
                                                        <span>{amenity.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Status */}
                                    <div className="p-5 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-1">Current Status</h4>
                                        {roomDetails.status === 'AVAILABLE' ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <FaCheckCircle />
                                                <span>Available for immediate booking</span>
                                            </div>
                                        ) : roomDetails.status === 'OCCUPIED' ? (
                                            <>
                                                <div className="flex items-center gap-2 text-red-600">
                                                    <FaLock />
                                                    <span>Currently occupied</span>
                                                </div>
                                                {roomDetails.checkOutDate && (
                                                    <div className="text-gray-600 text-sm">
                                                        Expected check-out: <span className="font-medium">{format(new Date(roomDetails.checkOutDate), 'MMM dd, yyyy')}</span> at{' '}
                                                        <span className="font-medium">{roomDetails.checkOutTime}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <FaCalendarAlt />
                                                <span>Reserved for future booking</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'availability' && (
                                <div className="space-y-6">
                                    <h4 className="text-lg font-semibold text-gray-800">Availability Calendar</h4>

                                    <Calendar
                                        minDate={new Date()} // Set minimum date to today to prevent selection of past dates
                                        tileClassName={({ date, view }) => {
                                            if (view === 'month') {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);

                                                // Check if date is in the past
                                                const isPast = date < today;

                                                // Check if date is booked
                                                const isBooked = roomDetails.availability.periods.some(period =>
                                                    period.status === 'BOOKED' &&
                                                    isSameDayOrBetween(date, new Date(period.from), new Date(period.to))
                                                );
                                                const isSelected = selectedDate &&
                                                    date.toDateString() === selectedDate.toDateString();

                                                return clsx(
                                                    'p-2 rounded-md transition-colors', // Base classes
                                                    {
                                                        'bg-gray-200 text-gray-400 cursor-not-allowed': isPast,
                                                        'bg-red-200 text-red-800 cursor-not-allowed': !isPast && isBooked,
                                                        'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200': !isPast && !isBooked && !isSelected,
                                                        '!bg-blue-500 text-white ring-2 ring-blue-500': isSelected
                                                    }
                                                );
                                            }
                                            return '';
                                        }}
                                        tileDisabled={({ date, view }) => {
                                            if (view === 'month') {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);

                                                // Disable past dates
                                                if (date < today) return true;

                                                // Disable booked dates
                                                return roomDetails.availability.periods.some(period => {
                                                    const start = new Date(period.from);
                                                    const end = new Date(period.to);
                                                    return (
                                                        period.status === 'BOOKED' &&
                                                        date >= start &&
                                                        date <= end
                                                    );
                                                });
                                            }
                                            return false;
                                        }}
                                        onClickDay={(date) => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);

                                            // Prevent selection of past dates
                                            if (date < today) return;

                                            const isAvailable = !roomDetails.availability.periods.some(period => {
                                                const start = new Date(period.from);
                                                const end = new Date(period.to);
                                                return (
                                                    period.status === 'BOOKED' &&
                                                    date >= start &&
                                                    date <= end
                                                );
                                            });

                                            if (isAvailable) {
                                                sessionStorage.setItem('selectedDate', date.toISOString());
                                                console.log('date is saved to session storage');
                                                setSelectedDate(date);
                                            }
                                        }}
                                    />

                                    {/* Enhanced Legend */}
                                    <div className="flex flex-wrap gap-4 text-sm mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-green-100 rounded-sm"></div>
                                            <span>Available</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-red-200 rounded-sm"></div>
                                            <span>Booked</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-gray-200 rounded-sm"></div>
                                            <span>Past dates</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                                            <span>Selected date</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500">No room details available</div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                        Close
                    </button>
                    {/* {roomDetails && (
                        <button
                            onClick={() => {
                                onClose();
                                sessionStorage.setItem('roomid', roomDetails.id.toString());
                                onBookRoom(roomDetails.id, floorId || 0);
                            }}
                            className={`px-6 py-2 rounded-lg ${selectedDate
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            disabled={!selectedDate}
                        >
                            Book This Room
                        </button>
                    )} */}
                </div>
            </div>
        </div>
    );
}
