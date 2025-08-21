'use client'

import { ArrowLeftIcon } from 'lucide-react'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'

interface Props {
    phone: string;
}
export default function AddCustomerForm({ phone }: Props) {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        company: '',
    })

    const [adhaar, setAdhaar] = useState<File | null>(null)
    const [profile, setProfile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }
    useEffect(() => {
        console.log('phone', phone)
        if (phone) {
            setForm(prev => ({ ...prev, phone: phone }));
        }
    }, [phone])
    const handleSubmit = async (e: React.FormEvent) => {
        try {
            e.preventDefault()
            const formData = new FormData()
            Object.entries(form).forEach(([key, value]) => formData.append(key, value))
            if (adhaar) formData.append('adhaarPicture', adhaar)
            if (profile) formData.append('profilePicture', profile)

            setLoading(true)

            const res = await fetch('/api/customers', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            alert(data.message)
        } catch (error) {
            console.log('Error in adding customer ', error)
        } finally {
            setLoading(false)
        }

    }

    return (
        <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="h-full w-full bg-white p-4 sm:p-8">
                <div className="relative mb-8">
                    <div className="flex items-center w-full ">
                        <button
                            onClick={() => router.back()}
                            className=" p-2  transition-colors"
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                        </button>
                        <h2 className="text-4xl ml-36 font-bold text-gray-800 text-center">
                            Add New Customer
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Info Column */}
                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="block text-lg font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56] hover:border-gray-300 transition-all"
                                />
                            </div>

                            <div className="form-group">
                                <label className="block text-lg font-medium text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="+91 98765 43210"
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56] transition-all"
                                />
                            </div>

                            <div className="form-group">
                                <label className="block text-lg font-medium text-gray-700 mb-2">Company</label>
                                <input
                                    type="text"
                                    name="company"
                                    placeholder="Company Name"
                                    value={form.company}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56] transition-all"
                                />
                            </div>
                        </div>

                        {/* Address & Documents Column */}
                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="block text-lg font-medium text-gray-700 mb-2">Address</label>
                                <textarea
                                    name="address"
                                    placeholder="Enter full address"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56] transition-all"
                                />
                            </div>

                            <div className="form-group">
                                <label className="block text-lg font-medium text-gray-700 mb-2">Aadhaar Card</label>
                                <div className="relative group">
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C59F56] transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setAdhaar(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <svg className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#C59F56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-gray-500 group-hover:text-[#C59F56]">
                                            {adhaar ? adhaar.name : 'Click to upload Aadhaar'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="block text-lg font-medium text-gray-700 mb-2">Profile Photo</label>
                                <div className="relative group">
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C59F56] transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setProfile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <svg className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#C59F56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-gray-500 group-hover:text-[#C59F56]">
                                            {profile ? profile.name : 'Click to upload Profile Photo'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-[#C59F56] to-[#b38d4e] hover:from-[#b38d4e] hover:to-[#a07c46] text-white font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Submitting...</span>
                                </div>
                            ) : (
                                'Add Customer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
