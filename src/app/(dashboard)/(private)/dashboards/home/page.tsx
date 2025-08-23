// app/dashboard/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Building, Calendar, Users, Hotel, Check, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { TransparentLoader } from '@/components/transparent';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Types
type DashboardStats = {
    totalBookings: number;
    totalCustomers: number;
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    reservedRooms: number;
};

type BookingChartData = {
    labels: string[];
    bookingCounts: number[];
};

type RoomTypeData = {
    labels: string[];
    counts: number[];
};

//export const dynamic = 'force-dynamic'
export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [bookingChart, setBookingChart] = useState<BookingChartData | null>(null);
    const [roomTypeData, setRoomTypeData] = useState<RoomTypeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageloading, setpageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter()
    const pathname = usePathname()
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch overall stats
                const statsResponse = await fetch('/api/dashboard/stats');
                if (!statsResponse.ok) throw new Error('Failed to fetch stats');
                const statsData = await statsResponse.json();

                // Fetch booking chart data
                const bookingResponse = await fetch('/api/dashboard/bookings-chart');
                if (!bookingResponse.ok) throw new Error('Failed to fetch booking data');
                const bookingData = await bookingResponse.json();

                // Fetch room type distribution
                const roomTypeResponse = await fetch('/api/dashboard/room-types');
                if (!roomTypeResponse.ok) throw new Error('Failed to fetch room type data');
                const roomTypeResult = await roomTypeResponse.json();

                setStats(statsData);
                setBookingChart(bookingData);
                setRoomTypeData(roomTypeResult);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);
    useEffect(() => {
        // Reset loading whenever the route changes
        setpageLoading(false);
    }, [pathname]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 border-4 border-t-[#c59f56] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <p className="text-lg font-medium text-gray-700">Loading dashboard data...</p>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                <h2 className="text-red-500 text-xl font-bold mb-4">Error</h2>
                <p className="text-gray-700">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-[#c59f56] text-white px-4 py-2 rounded-lg hover:bg-[#b38d45] transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        //  <Suspense fallback={<p>Loading search params...</p>}>
        <div className="min-h-screen bg-gray-100 px-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Hotel Dashboard</h1>
                {pageloading && <TransparentLoader />}
                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Bookings */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 cursor-pointer" onClick={() => {
                        setpageLoading(true)
                        router.push('/dashboards/booking')
                    }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                                <p className="text-2xl font-bold text-gray-800">{stats?.totalBookings}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Calendar className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Total Customers */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 cursor-pointer" onClick={() => { router.push('/dashboards/customers') }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-800">{stats?.totalCustomers}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <Users className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Total Rooms */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 cursor-pointer" onClick={() => {
                        setpageLoading(true)
                        router.push('/dashboards/rooms')
                    }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Rooms</p>
                                <p className="text-2xl font-bold text-gray-800">{stats?.totalRooms}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <Hotel className="w-6 h-6 text-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Room Status */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#c59f56] cursor-pointer" onClick={() => {
                        setpageLoading(true)
                        router.push('/dashboards/rooms')
                    }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Available Rooms</p>
                                <p className="text-2xl font-bold text-gray-800">{stats?.availableRooms}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <Check className="w-6 h-6 text-[#c59f56]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Room Status Detail Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Occupied Rooms */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center mb-3">
                            <div className="bg-amber-100 p-2 rounded-lg mr-3">
                                <Building className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="font-medium text-gray-700">Occupied Rooms</h3>
                        </div>
                        <p className="text-2xl font-bold text-amber-500">{stats?.occupiedRooms}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {stats?.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}% occupancy rate
                        </p>
                    </div>



                    {/* Reserved Rooms */}
                    {/* <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center mb-3">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                <Activity className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="font-medium text-gray-700">Reserved Rooms</h3>
                        </div>
                        <p className="text-2xl font-bold text-indigo-500">{stats?.reservedRooms}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {stats?.totalRooms ? Math.round((stats.reservedRooms / stats.totalRooms) * 100) : 0}% of total rooms
                        </p>
                    </div> */}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Bookings Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bookings Overview</h2>
                        {bookingChart && (
                            <Line
                                data={{
                                    labels: bookingChart.labels,
                                    datasets: [
                                        {
                                            label: 'Bookings',
                                            data: bookingChart.bookingCounts,
                                            borderColor: '#c59f56',
                                            backgroundColor: 'rgba(197, 159, 86, 0.2)',
                                            tension: 0.3,
                                            fill: true,
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        },
                                        tooltip: {
                                            mode: 'index',
                                            intersect: false,
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                precision: 0
                                            }
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Room Type Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Room Type Distribution</h2>
                        {roomTypeData && (
                            <Bar
                                data={{
                                    labels: roomTypeData.labels,
                                    datasets: [
                                        {
                                            label: 'Room Count',
                                            data: roomTypeData.counts,
                                            backgroundColor: [
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                            ],
                                            borderColor: [
                                                'rgb(75, 192, 192)',
                                                'rgb(153, 102, 255)',
                                                'rgb(255, 159, 64)',
                                                'rgb(255, 99, 132)',
                                                'rgb(54, 162, 235)',
                                            ],
                                            borderWidth: 1
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                precision: 0
                                            }
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Room Status Chart */}
                {/* <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Room Status Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1 md:col-span-1 flex items-center justify-center">
                            {roomStatusData && (
                                <Pie
                                    data={{
                                        labels: roomStatusData.statuses,
                                        datasets: [
                                            {
                                                data: roomStatusData.counts,
                                                backgroundColor: [
                                                    'rgba(34, 197, 94, 0.6)',  // Available - green
                                                    'rgba(234, 179, 8, 0.6)',   // Occupied - yellow
                                                    'rgba(239, 68, 68, 0.6)',   // Maintenance - red
                                                    'rgba(79, 70, 229, 0.6)',   // Reserved - indigo
                                                ],
                                                borderColor: [
                                                    'rgb(34, 197, 94)',
                                                    'rgb(234, 179, 8)',
                                                    'rgb(239, 68, 68)',
                                                    'rgb(79, 70, 229)',
                                                ],
                                                borderWidth: 1
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'right'
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <div className="grid grid-cols-2 gap-4">
                                {roomStatusData?.statuses.map((status, index) => (
                                    <div key={status} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor: [
                                                        'rgb(34, 197, 94)',
                                                        'rgb(234, 179, 8)',
                                                        'rgb(239, 68, 68)',
                                                        'rgb(79, 70, 229)',
                                                    ][index]
                                                }}
                                            ></div>
                                            <span className="font-medium text-gray-700">{status}</span>
                                        </div>
                                        <p className="text-xl font-bold mt-2">{roomStatusData.counts[index]}</p>
                                        <p className="text-sm text-gray-500">
                                            {stats?.totalRooms ?
                                                Math.round((roomStatusData.counts[index] / stats.totalRooms) * 100) : 0}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
        // </Suspense>
    );
}
