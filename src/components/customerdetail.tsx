"use client"
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, PhoneIcon, UserIcon } from 'lucide-react';

interface CustomerDetails {
    id: number;
    name: string;
    phoneNumber: string;
    picture?: string;
    aadhaarPicture?: string;
    address?: string;
    companyName?: string;
    createdAt: string;
    bookings: Booking[];
    checkedInRooms: Room[];
}

interface Booking {
    id: number;
    checkInDate: string;
    checkOutDate: string;
    room: {
        roomNumber: string;
        type: {
            name: string;
        };
    };
}

interface Room {
    id: number;
    roomNumber: string;
    type: {
        name: string;
    };
}
interface Props {
    id: string;
}
export default function CustomerDetailClient({ id }: Props) {
    const router = useRouter();
    const [customer, setCustomer] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch('/api/customers/detail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id }), // Send ID in request body
                });

                if (!response.ok) throw new Error('Customer not found');

                const data = await response.json();
                setCustomer(data);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load customer');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [id]);

    if (loading) return <div className="text-center p-8">Loading customer details...</div>;
    if (error) return <div className="text-red-500 p-8">Error: {error}</div>;
    if (!customer) return <div className="p-8">Customer not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <ArrowLeftIcon className="h-5 w-5" />
                Back to Customers
            </button>

            <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
                <header className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{customer.name}</h1>
                    <p className="text-gray-500">Customer ID: #{customer.id}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Images Section */}
                    <div className="space-y-6">
                        {/* Profile Photo Card */}
                        <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative h-64 rounded-lg overflow-hidden border-2 border-white">
                                {customer.picture ? (
                                    <Image
                                        src={`/uploads/${customer.picture}`}
                                        alt={`${customer.name}'s profile`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                        <UserIcon className="h-16 w-16 text-blue-400" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                    Profile Photo
                                </span>
                            </div>
                        </div>

                        {/* Aadhaar Card */}
                        <div className="group relative bg-orange-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative h-64 rounded-lg overflow-hidden border-2 border-dashed border-orange-200 bg-white">
                                {customer.aadhaarPicture ? (
                                    <Image
                                        src={`/uploads/${customer.aadhaarPicture}`}
                                        alt={`${customer.name}'s Aadhaar`}
                                        fill
                                        className="object-contain p-4 group-hover:scale-[1.02] transition-transform"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                                        {/* <IdentificationIcon className="h-12 w-12 text-orange-400" /> */}
                                        <p className="text-orange-500 text-sm">Aadhaar Card Not Uploaded</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                                    Aadhaar Card
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-6">
                        {/* Contact Information */}
                        <div className="p-6 bg-gray-50 rounded-xl transition-colors hover:bg-blue-50">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                            <div className="flex items-center gap-2">
                                <PhoneIcon className="h-5 w-5 text-blue-500" />
                                <p className="text-lg font-semibold text-gray-800">{customer.phoneNumber}</p>
                            </div>
                        </div>

                        {/* Company */}
                        {customer.companyName && (
                            <div className="p-6 bg-gray-50 rounded-xl transition-colors hover:bg-green-50">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Company</h3>
                                <div className="flex items-center gap-2">
                                    {/* <BuildingOfficeIcon className="h-5 w-5 text-green-500" /> */}
                                    <p className="text-lg text-gray-800">{customer.companyName}</p>
                                </div>
                            </div>
                        )}

                        {/* Address */}
                        {customer.address && (
                            <div className="p-6 bg-gray-50 rounded-xl transition-colors hover:bg-purple-50">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="h-5 w-5 text-purple-500" />
                                    <p className="text-lg text-gray-800 whitespace-pre-line">{customer.address}</p>
                                </div>
                            </div>
                        )}

                        {/* Member Since */}
                        <div className="p-6 bg-gray-50 rounded-xl transition-colors hover:bg-yellow-50">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Member Since</h3>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-yellow-500" />
                                <p className="text-lg text-gray-800">
                                    {new Date(customer.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bookings Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Booking History</h2>
                    <div className="grid gap-4">
                        {customer.bookings.map((booking) => (
                            <div key={booking.id} className="p-4 bg-white rounded-lg border hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {booking.room.type.name} - Room {booking.room.roomNumber}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(booking.checkInDate).toLocaleDateString()} -{' '}
                                            {new Date(booking.checkOutDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                                        Completed
                                    </span>
                                </div>
                            </div>
                        ))}
                        {customer.bookings.length === 0 && (
                            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                                No booking history found
                            </div>
                        )}
                    </div>
                </section>

                {/* Current Rooms Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Active Check-Ins</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {customer.checkedInRooms.map((room) => (
                            <div key={room.id} className="p-4 bg-white rounded-lg border hover:border-green-200 transition-all shadow-sm hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {room.type.name} - Room {room.roomNumber}
                                        </p>
                                        <p className="text-sm text-gray-500">Checked In: 2 days ago</p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                                        Active
                                    </span>
                                </div>
                            </div>
                        ))}
                        {customer.checkedInRooms.length === 0 && (
                            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                                No active check-ins
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

