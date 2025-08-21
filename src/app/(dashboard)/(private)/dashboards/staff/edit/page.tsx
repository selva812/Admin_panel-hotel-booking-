"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Save, Loader2, Key, Home, User, Phone, Mail, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import { TransparentLoader } from '@/components/transparent'
export const dynamic = 'force-dynamic'
interface User {
    id: number;
    name: string;
    email: string;
    role: number;
    address: string;
    phone: string;
    createdAt: string;
    lastLogin?: string;
    isOnline: boolean;
}

interface UserFormData {
    name: string;
    email: string;
    role: number;
    address: string;
    phone: string;
    password?: string;
}

const UserEditPage = () => {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    // Get current URL (client-side only)
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        role: 2, // Default to Staff (2)
        address: '',
        phone: '',
        password: ''
    });

    const [originalRole, setOriginalRole] = useState<number>(2);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Check if current user is admin
    const isAdmin = currentUser?.role === 'ADMIN';

    useEffect(() => {
        if (!isAdmin) {
            showToast('Access denied. Admin privileges required.', 'error');
            router.push('/dashboards/home');
            return;
        }


    }, [isAdmin]);

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId])

    const fetchUser = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/edit?id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            console.log('reponse', response.ok)
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setFormData({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    address: userData.address,
                    phone: userData.phone,
                    password: ''
                });
                setOriginalRole(userData.role);
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to fetch user', 'error');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            showToast('Error fetching user data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
            showToast('Access denied. Admin privileges required.', 'error');
            return;
        }
        if (formData.role === 1 && originalRole !== 1) {
            const confirmChange = window.confirm(
                'WARNING: Changing this role to Admin will grant the user full access to all data.\n\nAre you sure you want to proceed?'
            );
            if (!confirmChange) {
                return; // Abort submission
            }
        }
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            // Prepare data - only include password if it's not empty
            const updateData = { ...formData };
            if (!updateData.password || updateData.password.trim() === '') {
                delete updateData.password;
            }
            const response = await fetch(`/api/users/edit?id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const responseData = await response.json();

            if (response.ok) {
                showToast('User updated successfully!', 'success');
                // Refresh user data
                await fetchUser();
                // Clear password field
                setFormData(prev => ({ ...prev, password: '' }));
            } else {
                showToast(responseData.message || 'Failed to update user', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('Error updating user', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleBack = () => {
        router.back();
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-600">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <TransparentLoader />
        );
    }

    return (
        <Suspense fallback={<TransparentLoader />}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
                {/* Modern Toast Notification */}
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

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Modern Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Users
                            </button>
                            <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-800">Edit User Profile</h1>
                            {user && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-gray-600">
                                        Editing details for <span className="font-semibold">{user.name}</span>
                                    </span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                        ID: {user.id}
                                    </span>
                                </div>
                            )}
                        </div>

                        {user && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${user.isOnline
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-800'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-gray-500'
                                    }`}></div>
                                <span className="text-sm font-medium">
                                    {user.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Modern User Edit Form */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                            <div className="flex items-center">
                                <div className="bg-blue-800 p-2 rounded-lg">
                                    <User className="text-white w-6 h-6" />
                                </div>
                                <h2 className="ml-3 text-xl font-bold text-white">User Information</h2>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className=" text-sm font-medium text-gray-700 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-blue-600" />
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter full name"
                                        />
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className=" text-sm font-medium text-gray-700 flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-blue-600" />
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter email address"
                                        />
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className=" text-sm font-medium text-gray-700 flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-blue-600" />
                                        Phone Number *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Enter phone number"
                                        />
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <label htmlFor="role" className=" text-sm font-medium text-gray-700 flex items-center">
                                        <div className="bg-blue-100 p-1 rounded mr-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        Role *
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role.toString()} // Convert number to string for select value
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                role: parseInt(e.target.value) // Convert back to number
                                            });
                                        }}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.5rem]"
                                    >
                                        <option value="1">Admin</option>
                                        <option value="3">Manager</option>
                                        <option value="2">Staff</option>
                                    </select>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label htmlFor="address" className=" text-sm font-medium text-gray-700 flex items-center">
                                    <Home className="w-4 h-4 mr-2 text-blue-600" />
                                    Address *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Enter full address"
                                    />
                                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className=" text-sm font-medium text-gray-700 flex items-center">
                                    <Key className="w-4 h-4 mr-2 text-blue-600" />
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Leave blank to keep current password"
                                    />
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    Leave blank to keep the current password. Minimum 6 characters if changing.
                                </p>
                            </div>

                            {/* User Status Information */}
                            {user && (
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        <div className="bg-blue-100 p-1 rounded mr-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        User Status
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="text-gray-500 mb-1">Account Created</div>
                                            <div className="font-medium text-gray-800">
                                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="text-gray-500 mb-1">Last Login</div>
                                            <div className="font-medium text-gray-800">
                                                {user.lastLogin
                                                    ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'Never logged in'}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="text-gray-500 mb-1">Account Status</div>
                                            <div className={`font-medium ${user.isOnline ? 'text-emerald-600' : 'text-gray-600'
                                                }`}>
                                                {user.isOnline ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-500 mb-4 sm:mb-0">
                                    Fields marked with * are required
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
            </div>
        </Suspense>
    );
};

export default UserEditPage;
