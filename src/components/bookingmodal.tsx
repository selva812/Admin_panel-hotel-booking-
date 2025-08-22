"use client"
import { useState, useEffect } from 'react';
import { X, Calendar, User, Bed, CreditCard, Check, XCircle, Clock, Edit, ArrowRight, Home, Loader2, Save, Snowflake, Sun, Search, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { TransparentLoader } from './transparent';
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

interface Booking {
    id: number;
    bookingref: string;
    isonline: boolean;
    bookedRooms: BookedRoom[];
}

interface RoomChange {
    bookingRoomId: number;
    oldRoomId: number;
    newRoomId: number;
    newBookedPrice: number;
}

interface EditBookingModalProps {
    booking: Booking;
    onClose: () => void;
    onSave: (data: any) => void;
    onOpen?: () => void;
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({ booking, onClose, onSave, onOpen }) => {
    const [formData, setFormData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [roomChanges, setRoomChanges] = useState<RoomChange[]>([]);
    const [isOnline, setIsOnline] = useState(booking.isonline || false);
    const [showRoomSelector, setShowRoomSelector] = useState<{ [key: number]: boolean }>({});
    const statusOptions = [
        { value: 0, label: 'Checked Out', icon: <Check className="w-4 h-4 mr-2" /> },
        { value: 1, label: 'Checked In', icon: <Bed className="w-4 h-4 mr-2" /> },
        { value: 2, label: 'Advance', icon: <CreditCard className="w-4 h-4 mr-2" /> },
        { value: 3, label: 'Cancelled', icon: <XCircle className="w-4 h-4 mr-2" /> },
    ];
    function toISTLocalDatetime(dateString: string) {
        const date = new Date(dateString);
        const istOffset = 5.5 * 60; // minutes
        const istDate = new Date(date.getTime() + istOffset * 60000);
        const local = istDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
        return local;
    }


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch booking details
                const bookingResponse = await fetch(`/api/bookings?id=${booking.id}`);
                if (!bookingResponse.ok) {
                    throw new Error('Failed to fetch booking details');
                }
                const bookingData = await bookingResponse.json();

                // Fetch available rooms
                const roomsResponse = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ action: 'GET_AVAILABLE_ROOMS', checkIn: bookingData.date })
                });

                if (!roomsResponse.ok) {
                    throw new Error('Failed to fetch available rooms');
                }
                const roomsData = await roomsResponse.json();
                setAvailableRooms(roomsData.availableRooms);

                setFormData({
                    ...bookingData,
                    date: toISTLocalDatetime(bookingData.date),
                    bookedRooms: bookingData.bookedRooms.map((room: any) => ({
                        ...room,
                        checkIn: toISTLocalDatetime(room.checkIn),
                        checkOut: toISTLocalDatetime(room.checkOut)
                    }))
                });
                if (onOpen) onOpen()
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load booking details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [booking.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/bookings?id=${booking.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    roomChanges,
                    bookedRooms: formData.bookedRooms.map((room: any) => ({
                        ...room,
                        checkIn: new Date(room.checkIn).toISOString(),
                        checkOut: new Date(room.checkOut).toISOString()
                    }))
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update booking');
            }
            const data = await response.json();
            onSave(data);
        } catch (error) {
            console.error('Error updating booking:', error);
            setError('Failed to update booking');
        } finally {
            setIsLoading(false);
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        try {
            const { name, value, type } = e.target;
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev: any) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        } catch (error) {
            toast.error('Failed to update form data');
            console.error(error);
        }
    };
    // Add room function
    const addRoom = () => {
        const newRoom = {
            id: null, // Will be created on save
            bookingId: booking.id,
            roomId: null,
            checkIn: new Date().toISOString().slice(0, 16),
            checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            bookedPrice: 0,
            adults: 1,
            children: 0,
            extraBeds: 0,
            isAc: false,
            room: null
        };

        setFormData((prev: { rooms: number; bookedRooms: any; }) => ({
            ...prev,
            rooms: prev.rooms + 1,
            bookedRooms: [...prev.bookedRooms, newRoom]
        }));
        toast.success('Room added successfully');
    };

    // Remove room function
    const removeRoom = (index: any) => {
        const updatedRooms = formData.bookedRooms.filter((_: any, i: any) => i !== index);
        setFormData((prev: { rooms: number; }) => ({
            ...prev,
            rooms: prev.rooms - 1,
            bookedRooms: updatedRooms
        }));
        toast.success('Room removed successfully');
    };
    const handleRoomChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        try {
            const { name, value, type } = e.target;
            const checked = (e.target as HTMLInputElement).checked;
            const updatedRooms = [...formData.bookedRooms];

            if (name === 'isAc') {
                const room = availableRooms.find(r => r.id === updatedRooms[index].roomId) || updatedRooms[index].room;
                let price = 0;

                if (isOnline) {
                    price = checked ? room?.online_acPrice || 0 : room?.online_nonAcPrice || 0;
                } else {
                    price = checked ? room?.acPrice || 0 : room?.nonAcPrice || 0;
                }

                updatedRooms[index] = {
                    ...updatedRooms[index],
                    [name]: checked,
                    bookedPrice: price
                };
                toast.success(`Changed to ${checked ? 'AC' : 'Non-AC'} mode`);
            } else {
                updatedRooms[index] = {
                    ...updatedRooms[index],
                    [name]: type === 'checkbox' ? checked : value
                };
            }

            setFormData((prev: any) => ({ ...prev, bookedRooms: updatedRooms }));
        } catch (error) {
            toast.error('Failed to update room details');
            console.error(error);
        }
    };

    // Modified handleRoomSelection to consider online pricing
    const handleRoomSelection = (roomIndex: number, newRoomId: number) => {
        try {
            const newRoom = availableRooms.find(room => room.id === newRoomId);
            if (!newRoom) {
                toast.error('Selected room not found');
                return;
            }

            const updatedRooms = [...formData.bookedRooms];
            const oldRoomId = updatedRooms[roomIndex].roomId;
            const isAc = updatedRooms[roomIndex].isAc;

            let newPrice = 0;
            if (isOnline) {
                newPrice = isAc ? newRoom.online_acPrice : newRoom.online_nonAcPrice;
            } else {
                newPrice = isAc ? newRoom.acPrice : newRoom.nonAcPrice;
            }

            // Update the room in formData
            updatedRooms[roomIndex] = {
                ...updatedRooms[roomIndex],
                roomId: newRoomId,
                bookedPrice: newPrice,
                room: newRoom
            };

            setFormData((prev: any) => ({ ...prev, bookedRooms: updatedRooms }));

            // Track room change
            const existingChangeIndex = roomChanges.findIndex(
                change => change.bookingRoomId === updatedRooms[roomIndex].id
            );

            const roomChange: RoomChange = {
                bookingRoomId: updatedRooms[roomIndex].id,
                oldRoomId,
                newRoomId,
                newBookedPrice: newPrice
            };

            if (existingChangeIndex >= 0) {
                const updatedChanges = [...roomChanges];
                updatedChanges[existingChangeIndex] = roomChange;
                setRoomChanges(updatedChanges);
            } else {
                setRoomChanges(prev => [...prev, roomChange]);
            }

            toast.success(`Room changed to ${newRoom.roomNumber}`);
            setShowRoomSelector(prev => ({ ...prev, [roomIndex]: false }));
        } catch (error) {
            toast.error('Failed to change room');
            console.error(error);
        }
    };

    const toggleRoomSelector = (roomIndex: number) => {
        setShowRoomSelector(prev => ({
            ...prev,
            [roomIndex]: !prev[roomIndex]
        }));
    };

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md">
                    <h3 className="text-red-500 font-medium mb-2">Error</h3>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    if (!formData) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
                {isLoading ? (
                    <TransparentLoader />
                ) : (
                    <>
                        <div className="sticky top-0 bg-white z-10 border-b p-6 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <Edit className="w-6 h-6 text-blue-600" />
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Edit Booking #{booking.bookingref}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Booking Details Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <User className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Booking Details
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Booking Date
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="datetime-local"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleChange}
                                                    className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Arrival From
                                            </label>
                                            <input
                                                type="text"
                                                name="arriveFrom"
                                                value={formData.arriveFrom || ''}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Where are they arriving from?"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Status
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {statusOptions.map((option) => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${formData.bookingstatus == option.value
                                                            ? 'border-blue-500 bg-blue-50/50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="bookingstatus"
                                                            value={option.value}
                                                            checked={formData.bookingstatus == option.value}
                                                            onChange={handleChange}
                                                            className="sr-only"
                                                        />
                                                        <span className="text-blue-600">{option.icon}</span>
                                                        <span className="text-sm font-medium">
                                                            {option.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <Bed className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Room Information
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Number of Rooms
                                            </label>
                                            <input
                                                type="number"
                                                name="rooms"
                                                value={formData.rooms}
                                                disabled
                                                onChange={handleChange}
                                                min="1"
                                                className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                id="isadvance"
                                                name="isadvance"
                                                checked={formData.isadvance}
                                                onChange={handleChange}
                                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <label
                                                htmlFor="isadvance"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Advance Booking
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Booked Rooms Section */}
                            <div className="pt-8 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <Bed className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Booked Rooms
                                        </h3>
                                        {/* Online Checkbox */}
                                        <div className="flex items-center space-x-2 ml-6">
                                            <input
                                                type="checkbox"
                                                id="isOnline"
                                                checked={isOnline}
                                                onChange={(e) => setIsOnline(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <label htmlFor="isOnline" className="text-sm font-medium text-gray-700">
                                                Online Booking
                                            </label>
                                        </div>
                                    </div>

                                    {/* Add Room Button */}
                                    <button
                                        type="button"
                                        onClick={addRoom}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center space-x-2 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add Room</span>
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {formData.bookedRooms.map((room: any, index: number) => (
                                        <div
                                            key={index}
                                            className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                                        >
                                            <div className="p-5 bg-gray-50 border-b flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <Home className="w-5 h-5 text-gray-500" />
                                                    <h4 className="font-medium text-gray-800">
                                                        Room {index + 1}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-sm text-gray-600">
                                                        Current: <span className="font-medium">{room.room?.roomNumber || 'Not Selected'}</span>
                                                        {room.room?.type?.name && ` (${room.room.type.name})`}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRoomSelector(index)}
                                                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 shadow-sm"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                            <span>Change Room</span>
                                                        </button>

                                                        {/* Remove Room Button - Only show if more than 1 room */}
                                                        {formData.rooms > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRoom(index)}
                                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center space-x-2 shadow-sm"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                <span>Remove</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Room Selector */}
                                            {showRoomSelector[index] && (
                                                <div className="p-5 border-b bg-blue-50/30">
                                                    <div className="mb-3 flex items-center space-x-2">
                                                        <Search className="w-4 h-4 text-gray-500" />
                                                        <h5 className="font-medium text-gray-700">
                                                            Select New Room
                                                        </h5>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {availableRooms.map((availableRoom) => (
                                                            <button
                                                                key={availableRoom.id}
                                                                type="button"
                                                                onClick={() => handleRoomSelection(index, availableRoom.id)}
                                                                className="p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left bg-white"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <span className="font-medium text-gray-800">
                                                                        {availableRoom.roomNumber}
                                                                    </span>
                                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                                        {availableRoom.type.name}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-500 flex items-center space-x-2">
                                                                    <span className="flex items-center">
                                                                        <Snowflake className="w-3 h-3 mr-1" />
                                                                        ₹{isOnline ? availableRoom.online_acPrice : availableRoom.acPrice}
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <Sun className="w-3 h-3 mr-1" />
                                                                        ₹{isOnline ? availableRoom.online_nonAcPrice : availableRoom.nonAcPrice}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Room Change Indicator */}
                                            {roomChanges.some((change) => change.bookingRoomId === room.id) && (
                                                <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center">
                                                    <ArrowRight className="w-4 h-4 text-yellow-600 mr-2" />
                                                    <span className="text-sm text-yellow-700">
                                                        Room will be changed from{' '}
                                                        {booking?.bookedRooms?.find((r) => r.id === room.id)?.room
                                                            ?.roomNumber || 'unknown'}{' '}
                                                        to {room.room?.roomNumber || 'unknown'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {/* Date Inputs */}
                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Check-In
                                                        </label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="datetime-local"
                                                                name="checkIn"
                                                                value={room.checkIn}
                                                                onChange={(e) => handleRoomChange(index, e)}
                                                                className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Check-Out
                                                        </label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="datetime-local"
                                                                name="checkOut"
                                                                value={room.checkOut}
                                                                onChange={(e) => handleRoomChange(index, e)}
                                                                className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Occupancy Inputs */}
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Adults
                                                            </label>
                                                            <input
                                                                type="number"
                                                                name="adults"
                                                                value={room.adults}
                                                                onChange={(e) => handleRoomChange(index, e)}
                                                                min="1"
                                                                className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Children
                                                            </label>
                                                            <input
                                                                type="number"
                                                                name="children"
                                                                value={room.children}
                                                                onChange={(e) => handleRoomChange(index, e)}
                                                                min="0"
                                                                className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Extra Beds
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="extraBeds"
                                                            value={room.extraBeds}
                                                            onChange={(e) => handleRoomChange(index, e)}
                                                            min="0"
                                                            className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            id={`isAc-${index}`}
                                                            name="isAc"
                                                            checked={room.isAc}
                                                            onChange={(e) => handleRoomChange(index, e)}
                                                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                        />
                                                        <label
                                                            htmlFor={`isAc-${index}`}
                                                            className="text-sm font-medium text-gray-700"
                                                        >
                                                            Air Conditioning (₹
                                                            {room.isAc
                                                                ? isOnline
                                                                    ? room.room?.online_acPrice || 0
                                                                    : room.room?.acPrice || 0
                                                                : isOnline
                                                                    ? room.room?.online_nonAcPrice || 0
                                                                    : room.room?.nonAcPrice || 0}
                                                            )
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-5 py-3 bg-gray-50 border-t flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Current Price:</span> ₹
                                                    {room.isAc
                                                        ? isOnline
                                                            ? room.room?.online_acPrice || 0
                                                            : room.room?.acPrice || 0
                                                        : isOnline
                                                            ? room.room?.online_nonAcPrice || 0
                                                            : room.room?.nonAcPrice || 0}

                                                    {isOnline && <span className="ml-2 text-blue-600 font-medium">(Online Rate)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="sticky bottom-0 bg-white pt-6 border-t border-gray-200 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditBookingModal;
