'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FaCalendarCheck, FaCalendarTimes, FaUser, FaUsers } from 'react-icons/fa'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import RoomModal from './roommodal'
import { TransparentLoader } from '@/components/transparent'

interface Booking {
    id: number
    checkIn: string
    checkOut: string
    customerName: string
}

interface Room {
    id: number
    roomNumber: string
    actualStatus: number
    price: string
    acPrice: string;
    online_acPrice: string;
    online_nonAcPrice: string;
    occupancy: number
    floorId: number
    typeId: number
    type: {
        name: string
    }
    floor: {
        name: string
    }
    currentCustomerName: string | null
    nextAvailableDate: string
    upcomingBookings: Booking[]
}

export default function RoomDashboard() {
    const router = useRouter()
    const [rooms, setRooms] = useState<Room[]>([])
    const [roomTypes, setRoomTypes] = useState([])
    const [floors, setFloors] = useState([])
    const [loading, setLoading] = useState(false)
    const [groupBy, setGroupBy] = useState<'type' | 'floor'>('floor')
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const [roomRes, typeRes, floorRes] = await Promise.all([
                axios.get('/api/room'),
                axios.get('/api/room-types'),
                axios.get('/api/floor')
            ])
            console.log('room details', roomRes.data)
            setRooms(roomRes.data)
            setRoomTypes(typeRes.data.data)
            setFloors(floorRes.data.data)
        } catch (err) {
            console.error('Failed to fetch rooms', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    const groupRooms = () => {
        if (groupBy === 'type') {
            return roomTypes.map((type: any) => ({
                title: type.name,
                items: rooms.filter(r => r.typeId === type.id)
            }))
        } else {
            return floors.map((floor: any) => ({
                title: floor.name,
                items: rooms.filter(r => r.floorId === floor.id)
            }))
        }
    }

    const handleRoomClick = (roomId: number) => {
        setSelectedRoomId(roomId)
        setShowDetailsModal(true)
    }

    const handleBookRoom = (roomId: number, floorId: number) => {
        const phoneNumber = localStorage.getItem('tempphone')
        if (phoneNumber) {
            router.push(`/dashboards/booking/create?roomId=${roomId}`)
        } else {
            sessionStorage.setItem('selectedRoomId', roomId.toString())
            sessionStorage.setItem('selectedFloorId', floorId.toString())
            router.push(`/dashboards/customers`)
        }
    }

    const handleCloseModal = () => {
        setShowDetailsModal(false)
        setSelectedRoomId(null)
    }

    // Find the selected room based on selectedRoomId
    const selectedRoom = selectedRoomId ? rooms.find(room => room.id === selectedRoomId) || null : null

    if (loading) {
        return (
            <TransparentLoader />
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Toggle View */}
            <div className="mb-8 flex flex-wrap gap-6 items-center p-4 bg-white rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center gap-4">
                    <label className="relative flex items-center cursor-pointer text-gray-700 group">
                        <input
                            type="radio"
                            value="floor"
                            checked={groupBy === 'floor'}
                            onChange={() => setGroupBy('floor')}
                            className="peer hidden"
                        />
                        <div className="w-5 h-5 rounded-full border-2 border-purple-400 peer-checked:border-4 peer-checked:border-purple-600 flex items-center justify-center transition-all duration-200">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-600 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                        </div>
                        <span className="ml-3 text-lg font-semibold group-hover:text-purple-700 transition-colors">
                            Group by Floor
                        </span>
                    </label>
                    <label className="relative flex items-center cursor-pointer text-gray-700 group">
                        <input
                            type="radio"
                            value="type"
                            checked={groupBy === 'type'}
                            onChange={() => setGroupBy('type')}
                            className="peer hidden"
                        />
                        <div className="w-5 h-5 rounded-full border-2 border-purple-400 peer-checked:border-4 peer-checked:border-purple-600 flex items-center justify-center transition-all duration-200">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-600 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                        </div>
                        <span className="ml-3 text-lg font-semibold group-hover:text-purple-700 transition-colors">
                            Group by Type
                        </span>
                    </label>
                </div>
            </div>

            {/* Room Cards Grouped */}
            {groupRooms().map((group, i) => (
                <section
                    key={i}
                    className={`mb-12 p-6 rounded-2xl border border-gray-200 shadow-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                    {/* Group Title */}
                    <div className="mb-6 px-2 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                {group.title}
                            </h2>
                            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full" />
                        </div>
                    </div>

                    {/* Room Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {group.items.map(room => (
                            <div
                                key={room.id}
                                onClick={() => handleRoomClick(room.id)}
                                className={`transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl rounded-2xl p-6 border border-gray-200 relative overflow-hidden cursor-pointer
                ${room.actualStatus === 1
                                        ? 'bg-gradient-to-br from-red-50/80 to-white ring-1 ring-red-100'
                                        : 'bg-gradient-to-br from-green-50/80 to-white hover:ring-1 hover:ring-green-100'
                                    }`}
                            >
                                {/* Status Ribbon */}
                                <div className={`absolute top-0 right-0 px-4 py-1 text-sm font-semibold rounded-bl-lg
                ${room.actualStatus === 1
                                        ? 'bg-red-500 text-white'
                                        : 'bg-green-500 text-white'
                                    }`}
                                >
                                    {room.actualStatus === 1 ? 'OCCUPIED' : 'AVAILABLE'}
                                </div>

                                {/* Room Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-900">{room.roomNumber} </span>
                                        <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                            {room.type?.name}
                                        </span>
                                    </div>
                                </div>

                                {/* Room Details - Adjusted date section */}
                                <div className="space-y-3 text-gray-700">
                                    <div className="grid grid-cols-[24px,1fr] items-center gap-2">
                                        <FaCalendarCheck className="w-4 h-4 text-purple-500" />
                                        <div className="flex gap-2 text-sm">
                                            <span className="font-medium shrink-0">Check-in:</span>
                                            <span className="text-gray-600 truncate">
                                                {room.upcomingBookings?.[0]
                                                    ? format(new Date(room.upcomingBookings[0].checkIn), 'dd MMM yyyy')
                                                    : 'Available'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[24px,1fr] items-center gap-2">
                                        <FaCalendarTimes className="w-4 h-4 text-purple-500" />
                                        <div className="flex gap-2 text-sm">
                                            <span className="font-medium shrink-0">Check-out:</span>
                                            <span className="text-gray-600 truncate">
                                                {room.upcomingBookings?.[0]
                                                    ? format(new Date(room.upcomingBookings[0].checkOut), 'dd MMM yyyy')
                                                    : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[24px,1fr] items-center gap-2">
                                        <FaUser className="w-4 h-4 text-purple-500" />
                                        <div className="flex gap-2">
                                            <span className="font-medium">Guest:</span>
                                            <span className="text-gray-600">{room.currentCustomerName || 'Vacant'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[24px,1fr] items-center gap-2">
                                        <FaUsers className="w-4 h-4 text-purple-500" />
                                        <div className="flex gap-2">
                                            <span className="font-medium">Occupancy:</span>
                                            <span className="text-gray-600">{room.occupancy}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price*/}
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-500">Standard Price</span>
                                        <span className="text-base font-bold text-purple-600">₹{room.price}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-semibold text-gray-500">AC Price</span>
                                        <span className="text-base font-bold text-purple-600">₹{room.acPrice}</span>
                                    </div>
                                </div>
                                {/* Price */}
                                <div className="mt-6 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-500">Online  Price</span>
                                        <span className="text-base font-bold text-purple-600">₹{room.online_acPrice}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-semibold text-gray-500">Online AC </span>
                                        <span className="text-base font-bold text-purple-600">₹{room.online_nonAcPrice}</span>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {/* Room Details Modal */}
            <RoomModal
                isOpen={showDetailsModal}
                onClose={handleCloseModal}
                roomId={selectedRoom?.id || null}
                floorId={selectedRoom?.floorId || null}
                onBookRoom={handleBookRoom}
            />
        </div>
    )
}
