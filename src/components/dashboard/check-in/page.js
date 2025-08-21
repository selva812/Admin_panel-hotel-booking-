'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CheckInForm from './checkinform';
import BookingDetails from './bookingdetail';
import OccupancyForm from './occupancyform';


export default function CheckInPage() {
    const [roomNumber, setRoomNumber] = useState('');
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [occupancies, setOccupancies] = useState([]);
    const [isCustomerStaying, setIsCustomerStaying] = useState(false);
    const router = useRouter();

    const searchBooking = async () => {
        if (!roomNumber.trim()) {
            setError('Please enter a room number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`/api/check-in?roomNumber=${roomNumber}`);
            setBookingDetails(response.data.booking);

            // Initialize occupancies array with one empty form for each room
            const initialOccupancies = response.data.booking.booking.bookedRooms.map(room => ({
                bookingRoomId: room.id,
                name: '',
                address: '',
                phone: '',
                photo: '',
                aadhaarPhoto: '',
            }));

            setOccupancies(initialOccupancies);
        } catch (error) {
            console.error('Error fetching booking:', error);
            setError(error.response?.data?.error || 'Failed to fetch booking details');
            setBookingDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            setLoading(true);

            // Filter out empty occupancy entries
            const validOccupancies = occupancies.filter(occ => occ.name.trim() !== '');

            await axios.post('/api/check-in', {
                bookingId: bookingDetails.booking.id,
                occupancies: validOccupancies,
                isCustomerStaying,
            });

            alert('Check-in completed successfully!');
            router.push('/dashboard'); // Redirect to dashboard or appropriate page
        } catch (error) {
            console.error('Error during check-in:', error);
            setError(error.response?.data?.error || 'Check-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOccupancyChange = (index, field, value) => {
        const updatedOccupancies = [...occupancies];
        updatedOccupancies[index] = {
            ...updatedOccupancies[index],
            [field]: value,
        };
        setOccupancies(updatedOccupancies);
    };

    const handleFileUpload = async (index, fileType, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', fileType);

        try {
            const response = await axios.post('/api/upload', formData);
            handleOccupancyChange(index, fileType === 'photo' ? 'photo' : 'aadhaarPhoto', response.data.filePath);
        } catch (error) {
            console.error(`Error uploading ${fileType}:`, error);
            setError(`Failed to upload ${fileType}`);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Room Check-In</h1>

            <CheckInForm
                roomNumber={roomNumber}
                setRoomNumber={setRoomNumber}
                searchBooking={searchBooking}
                loading={loading}
            />

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            {bookingDetails && (
                <div className="mt-8">
                    <BookingDetails bookingDetails={bookingDetails} />

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isCustomerStaying}
                                    onChange={(e) => setIsCustomerStaying(e.target.checked)}
                                    className="mr-2"
                                />
                                <span>Booking customer is staying</span>
                            </label>
                        </div>

                        <h3 className="text-lg font-semibold mb-4">Occupancy Details</h3>

                        {bookingDetails.booking.bookedRooms.map((bookingRoom, index) => (
                            <div key={bookingRoom.id} className="mb-6 p-4 border rounded">
                                <h4 className="font-medium mb-2">Room {bookingRoom.room.roomNumber}</h4>
                                <OccupancyForm
                                    occupancy={occupancies[index]}
                                    onChange={(field, value) => handleOccupancyChange(index, field, value)}
                                    onFileUpload={(fileType, file) => handleFileUpload(index, fileType, file)}
                                />
                            </div>
                        ))}

                        <div className="mt-6">
                            <button
                                onClick={handleCheckIn}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                            >
                                {loading ? 'Processing...' : 'Complete Check-In'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
