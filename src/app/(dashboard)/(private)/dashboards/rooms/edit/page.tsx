"use client"
import { TransparentLoader } from '@/components/transparent'
import { useAuth } from '@/contexts/AuthContext'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'

interface Room {
    id: number
    roomNumber: string
    acPrice: string
    nonAcPrice: string
    isAC: Boolean;
    status: string
    occupancy: number
    roomName: string
    floorName: string
    online_acPrice: string
    online_nonAcPrice: string
    currentCustomerName: string | null
    actualStatus: 'AVAILABLE' | 'OCCUPIED'
}

interface RoomType {
    id: number
    name: string
}

interface Floor {
    id: number
    name: string
}

const RoomsPage = () => {
    const [rooms, setRooms] = useState<Room[]>([])
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
    const [floors, setFloors] = useState<Floor[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        roomNumber: '',
        typeId: '',
        acPrice: '',
        nonAcPrice: '',
        isAC: false,
        floorId: '',
        occupancy: 5,
        online_nonAcPrice: '',
        online_acPrice: ''
    })
    const [editMode, setEditMode] = useState(false)
    const [currentRoomId, setCurrentRoomId] = useState<number | null>(null)
    const isAdmin = currentUser?.role === 'ADMIN';
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        id: null as number | null,
        isLoading: false,
    });
    const [deleteError, setDeleteError] = useState('');

    const handleDeleteClick = (id: number) => {
        setDeleteModal({
            isOpen: true,
            id,
            isLoading: false,
        });
        setDeleteError('');
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;

        try {
            setDeleteModal(prev => ({ ...prev, isLoading: true }));
            const response = await fetch(`/api/room?id=${deleteModal.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Delete failed');

            fetchRooms();
            setDeleteModal({ isOpen: false, id: null, isLoading: false });
            showToast("Room deleted successfully", "success")
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Delete failed');
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, id: null, isLoading: false });
        setDeleteError('');
    };
    useEffect(() => {
        if (!isAdmin) {
            showToast('Access denied. Admin privileges required.', 'error');
            router.push('/dashboards/home');
            return;
        }
    }, [isAdmin]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };
    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/room')
            if (!response.ok) throw new Error('Failed to fetch rooms')
            const data = await response.json()
            console.log('room data', data)
            setRooms(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load rooms')
        } finally {
            setLoading(false)
        }
    }

    const fetchTypesAndFloors = async () => {
        try {
            const [typeRes, floorRes] = await Promise.all([
                fetch('/api/room-types'),
                fetch('/api/floor'),
            ])
            const [types, floors] = await Promise.all([
                typeRes.json(),
                floorRes.json()
            ])
            console.log('room types', types)
            setRoomTypes(types.data)
            setFloors(floors.data)
        } catch (err) {
            console.error('Failed to fetch types or floors')
        }
    }

    useEffect(() => {
        fetchRooms()
        fetchTypesAndFloors()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editMode ? `/api/room?id=${currentRoomId}` : '/api/room'
            const method = editMode ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error(editMode ? 'Update failed' : 'Creation failed')

            setShowAddModal(false)
            { editMode ? showToast('Update the room successfully', "success") : showToast('New room added successfully', "success") }
            fetchRooms()
            setFormData({
                roomNumber: '',
                acPrice: '',
                nonAcPrice: '',
                isAC: false,
                typeId: '',
                floorId: '',
                occupancy: 2,
                online_nonAcPrice: '',
                online_acPrice: ''
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Operation failed')
        }
    }

    const openEditModal = (room: Room) => {
        setEditMode(true)
        setCurrentRoomId(room.id)
        const matchedType = roomTypes.find(t => t.name === room.roomName)
        const matchedFloor = floors.find(f => f.name === room.floorName)
        setFormData({
            roomNumber: room.roomNumber,
            typeId: matchedType?.id.toString() || '',
            acPrice: room.acPrice,
            nonAcPrice: room.nonAcPrice,
            isAC: false,
            floorId: matchedFloor?.id.toString() || '',
            occupancy: room.occupancy,
            online_nonAcPrice: room.online_acPrice,
            online_acPrice: room.online_nonAcPrice
        })
        setShowAddModal(true)
    }
    function getStatusText(status: any) {
        switch (status) {
            case 0: return 'AVAILABLE';
            case 1: return 'OCCUPIED';
            case 2: return 'MAINTENANCE';
            case 3: return 'RESERVED';
            default: return 'UNKNOWN';
        }
    }

    function getStatusClass(status: string | number) {
        return status === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    }
    if (loading) return <TransparentLoader />
    // if (error) return <div className="p-6 text-red-500">Error: {error}</div>

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold">Room Management</h1>
                <button
                    onClick={() => {
                        setEditMode(false)
                        setShowAddModal(true)
                        setFormData({
                            roomNumber: '', typeId: '', acPrice: '', nonAcPrice: '', isAC: false, floorId: '', occupancy: 2, online_nonAcPrice: '',
                            online_acPrice: ''
                        })
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <FaPlus /> Add Room
                </button>
            </div>
            {toast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full">
                    <div className={`flex items-center p-4 rounded-lg shadow-lg animate-fadeIn transition-all ${toast.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                        }`}>
                        <div className={`mr-3 p-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
                            }`}>
                            {toast.type === 'success' ? (
                                <Check size={18} className="text-emerald-600" />
                            ) : (
                                <X size={18} className="text-rose-600" />
                            )}
                        </div>
                        <div className="flex-1 font-medium">{toast.message}</div>
                        <button
                            onClick={() => setToast(null)}
                            className="ml-4 text-gray-500 hover:text-gray-700"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-lg">
                <table className="min-w-full bg-white">
                    <thead className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white uppercase text-sm">
                        <tr>
                            <th className="py-4 px-6 text-left font-semibold">Room #</th>
                            <th className="py-4 px-6 text-left font-semibold">Type</th>
                            <th className="py-4 px-6 text-left font-semibold">Floor</th>
                            <th className="py-4 px-6 text-left font-semibold">Occupancy</th>
                            <th className="py-4 px-6 text-left font-semibold">AC Price</th>
                            <th className="py-4 px-6 text-left font-semibold">Non-AC Price</th>
                            <th className="py-4 px-6 text-left font-semibold">Online AC</th>
                            <th className="py-4 px-6 text-left font-semibold">Online Non-AC</th>
                            <th className="py-4 px-6 text-left font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {rooms.map((room) => (
                            <tr
                                key={room.id}
                                className="border-b border-gray-100 hover:bg-indigo-50/50 transition-all duration-200"
                            >
                                <td className="py-4 px-6 font-medium">{room.roomNumber}</td>
                                <td className="py-4 px-6">
                                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {room.roomName}
                                    </span>
                                </td>
                                <td className="py-4 px-6">{room.floorName}</td>
                                <td className="py-4 px-6 text-center">
                                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {room.occupancy} {room.occupancy > 1 ? 'People' : 'Person'}
                                    </span>
                                </td>
                                <td className="py-4 px-6 font-medium">₹{room.acPrice}</td>
                                <td className="py-4 px-6 font-medium">₹{room.nonAcPrice}</td>
                                <td className="py-4 px-6 font-medium text-blue-600">₹{room.online_acPrice}</td>
                                <td className="py-4 px-6 font-medium text-blue-600">₹{room.online_nonAcPrice}</td>
                                <td className="py-4 px-6">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => openEditModal(room)}
                                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200"
                                            title="Edit"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(room.id)}
                                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
                                            title="Delete"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this room? This action cannot be undone.</p>

                        {deleteError && (
                            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={deleteModal.isLoading}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteModal.isLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:bg-red-600"
                            >
                                {deleteModal.isLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {editMode ? 'Edit Room Details' : 'Add New Room'}
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number*</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.roomNumber}
                                            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type*</label>
                                        <select
                                            required
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.typeId}
                                            onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                                        >
                                            <option value="" disabled>Select Type</option>
                                            {roomTypes.map((type) => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor*</label>
                                        <select
                                            required
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.floorId}
                                            onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                                        >
                                            <option value="" disabled>Select Floor</option>
                                            {floors.map((floor) => (
                                                <option key={floor.id} value={floor.id}>{floor.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Occupancy*</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.occupancy}
                                            onChange={(e) => setFormData({ ...formData, occupancy: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Walk-in AC Price (₹)*</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.acPrice}
                                            onChange={(e) => setFormData({ ...formData, acPrice: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Online AC Price (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.online_acPrice || ''}
                                            onChange={(e) => setFormData({ ...formData, online_acPrice: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Walk-in Non-AC Price (₹)*</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.nonAcPrice}
                                            onChange={(e) => setFormData({ ...formData, nonAcPrice: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Online Non-AC Price (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.online_nonAcPrice || ''}
                                            onChange={(e) => setFormData({ ...formData, online_nonAcPrice: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    {editMode ? 'Update Room' : 'Add Room'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default RoomsPage
