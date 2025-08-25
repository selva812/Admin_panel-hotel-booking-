"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ActivityLog {
    id: number;
    userId: number;
    type: "LOGIN" | "LOGOUT";
    timestamp: string;
    user: {
        name: string;
        role: number;
    };
}

interface TopStaff {
    bookedById: number;
    bookingCount: number;
    user: {
        name: string;
        role: string;
    };
}

interface RoomUtilization {
    roomType: string;
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
}

interface DashboardStats {
    userCount: number;
    onlineUsers: number;
    newUsersThisMonth: number;
    totalBookings: number;
    activeBookings: number;
    bookingsThisMonth: number;
    todaysBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    averageBookingsPerDay: number;
    revenueGrowth: number;
    recentActivity: ActivityLog[];
    bookingTrends: Array<{
        date: string;
        bookings: number;
        confirmed: number;
    }>;
    dailyRevenue: Array<{
        date: string;
        revenue: number;
        bookings: number;
    }>;
    topStaff: TopStaff[];
    roomUtilization: RoomUtilization[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'];

export default function Dashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold">{format(new Date(label), 'MMMM d, yyyy')}</p>
                    <p className="text-[#8884d8]">Revenue: {formatCurrency(payload[0].value)}</p>
                    <p className="text-[#82ca9d]">Bookings: {payload[1].value}</p>
                </div>
            );
        }
        return null;
    };
    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchDashboardData();
            // Set up auto-refresh every 5 minutes
            const interval = setInterval(fetchDashboardData, 300000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch("/api/dashboard/user");
            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }
            const data = await response.json();
            setStats(data);
            console.log("Dashboard data fetched successfully:", data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-red-100">
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div className="mx-auto mb-4">
                        <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to view this page.
                        <br />
                        Please contact your administrator for assistance.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <p className="text-xl text-red-600 mb-4">Error: {error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
        <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-shadow duration-300`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="text-sm font-medium">
                                {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Welcome back, {user?.name}! Last updated: {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
                    {[
                        { id: 'overview', name: 'Overview' },
                        { id: 'bookings', name: 'Bookings' },
                        { id: 'revenue', name: 'Revenue' },
                        { id: 'staff', name: 'Staff Performance' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Users"
                                value={stats?.userCount || 0}
                                subtitle={`${stats?.newUsersThisMonth || 0} new this month`}
                                color="border-l-blue-500"
                                icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                            />
                            <StatCard
                                title="Online Users"
                                value={stats?.onlineUsers || 0}
                                subtitle="Currently active"
                                color="border-l-green-500"
                                icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>}
                            />
                            <StatCard
                                title="Room Occupancy"
                                value={`${stats?.occupancyRate || 0}%`}
                                subtitle={`${stats?.occupiedRooms || 0}/${stats?.totalRooms || 0} rooms`}
                                color="border-l-purple-500"
                                icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                            />
                            <StatCard
                                title="Today's Bookings"
                                value={stats?.todaysBookings || 0}
                                subtitle={`${stats?.activeBookings || 0} active`}
                                color="border-l-orange-500"
                                icon={<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                            />
                        </div>

                        {/* Room Utilization Chart */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Utilization by Type</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats?.roomUtilization || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="roomType" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => [value, name === 'occupancyRate' ? 'Occupancy %' : name]} />
                                    <Legend />
                                    <Bar dataKey="totalRooms" fill="#8884d8" name="Total Rooms" />
                                    <Bar dataKey="occupiedRooms" fill="#82ca9d" name="Occupied Rooms" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stats?.recentActivity.map((activity) => (
                                            <tr key={activity.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {activity.user.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {activity.user.role === 0 ? "Staff" : activity.user.role === 1 ? "Admin" : "Manager"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${activity.type === "LOGIN"
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {activity.type === "LOGIN" ? "Login" : "Logout"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {(stats?.recentActivity.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No recent activity found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <StatCard
                                title="Total Bookings"
                                value={stats?.totalBookings || 0}
                                subtitle="All time"
                                color="border-l-blue-500"
                                icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                            />
                            <StatCard
                                title="This Month"
                                value={stats?.bookingsThisMonth || 0}
                                subtitle={`Avg ${stats?.averageBookingsPerDay || 0}/day`}
                                color="border-l-green-500"
                                icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4" /></svg>}
                            />
                            <StatCard
                                title="Active Bookings"
                                value={stats?.activeBookings || 0}
                                subtitle="Currently confirmed"
                                color="border-l-purple-500"
                                icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                        </div>

                        {/* Booking Trends Chart */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends (Last 14 Days)</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={stats?.bookingTrends || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        formatter={(value, name) => [value, name === 'bookings' ? 'Total Bookings' : 'Confirmed Bookings']}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="bookings"
                                        stackId="1"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        name="Total Bookings"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="confirmed"
                                        stackId="2"
                                        stroke="#82ca9d"
                                        fill="#82ca9d"
                                        name="Confirmed Bookings"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Revenue Tab */}
                {activeTab === 'revenue' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <StatCard
                                title="Total Revenue"
                                value={formatCurrency(stats?.totalRevenue || 0)}
                                subtitle="All time"
                                color="border-l-green-500"
                                icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                            />
                            <StatCard
                                title="Monthly Revenue"
                                value={formatCurrency(stats?.monthlyRevenue || 0)}
                                subtitle="Last 30 days"
                                color="border-l-blue-500"
                                trend={stats?.revenueGrowth}
                                icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                            />
                            <StatCard
                                title="Average Per Booking"
                                value={formatCurrency(stats?.totalBookings && stats.totalBookings > 0 ?
                                    (stats.totalRevenue / stats.totalBookings) : 0)}
                                subtitle="Revenue per booking"
                                color="border-l-purple-500"
                                icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
                            />
                        </div>

                        {/* Daily Revenue Chart */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue (Last 7 Days)</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart
                                    data={stats?.dailyRevenue || []}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
                                        tickFormatter={(value) => formatCurrency(value)}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        label={{ value: 'Bookings', angle: 90, position: 'insideRight' }}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                    />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="#8884d8"
                                        activeDot={{ r: 8 }}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="bookings"
                                        name="Bookings"
                                        stroke="#82ca9d"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Staff Performance Tab */}
                {activeTab === 'staff' && (
                    <div className="space-y-6">
                        {/* Top Performers */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Staff (Last 30 Days)</h3>
                            <div className="grid gap-4">
                                {stats?.topStaff.map((staff, index) => (
                                    <div key={staff.bookedById} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{staff.user.name}</p>
                                                <p className="text-sm text-gray-500">{parseInt(staff.user.role) === 0 ? 'STAFF' : parseInt(staff.user.role) === 1 ? 'ADMIN' : 'MANAGER'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">{staff.bookingCount}</p>
                                            <p className="text-sm text-gray-500">bookings</p>
                                        </div>
                                    </div>
                                ))}
                                {(stats?.topStaff.length === 0) && (
                                    <p className="text-center text-gray-500 py-8">No staff performance data available</p>
                                )}
                            </div>
                        </div>

                        {/* Staff Performance Chart */}
                        {stats?.topStaff && stats.topStaff.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance Comparison</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={stats.topStaff.map(staff => ({
                                                name: staff.user.name,
                                                value: staff.bookingCount
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {stats.topStaff.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
