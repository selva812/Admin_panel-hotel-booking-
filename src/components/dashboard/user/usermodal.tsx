"use client"

import { useState } from "react"

import axios from "axios"
import {
    FiUserPlus,
    FiAlertCircle,
    FiUser,
    FiMail,
    FiLock,
    FiShield,
    FiChevronDown,
    FiMapPin,
    FiPhone,
    FiX,
    FiLoader
} from 'react-icons/fi';

// Modal component
export default function AddUserModal({ onClose, onUserAdded }: { onClose: () => void; onUserAdded: () => void }) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: 0,
        address: "",
        phone: ""
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        if (name === "phone" && !/^\d{0,10}$/.test(value)) return // Allow only digits up to 10
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError("")
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post("/api/users", form, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            onUserAdded()
            onClose()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to add user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg relative shadow-xl transition-all duration-300 hover:shadow-2xl">
                {/* Header */}
                <div className="border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FiUserPlus className="text-blue-600" />
                        Add New Team Member
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Create staff or manager account</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                        <FiAlertCircle className="text-red-500 flex-shrink-0" />
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Form Grid */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FiUser className="text-gray-400" />
                            Full Name
                        </label>
                        <input
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition"
                            placeholder="John Doe"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FiMail className="text-gray-400" />
                            Email Address
                        </label>
                        <input
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition"
                            placeholder="john@example.com"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FiLock className="text-gray-400" />
                            Password
                        </label>
                        <input
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition"
                            placeholder="••••••••"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FiShield className="text-gray-400" />
                            Role
                        </label>
                        <div className="relative">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition pr-8"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                            >
                                <option value="0">Staff Member</option>
                                <option value="2">Manager</option>
                            </select>
                            <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FiMapPin className="text-gray-400" />
                            Address
                        </label>
                        <input
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition"
                            placeholder="Street, City, Country"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FiPhone className="text-gray-400" />
                            Phone Number
                        </label>
                        <input
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition"
                            placeholder="+1 234 567 890"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2"
                    >
                        <FiX className="text-lg" />
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <FiLoader className="animate-spin" />
                        ) : (
                            <FiUserPlus className="text-lg" />
                        )}
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </div>
            </div>
        </div>
    )
}
