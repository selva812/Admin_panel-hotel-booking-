"use client"
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Wallet, CreditCard, RotateCcw, CheckCircle, AlertCircle, User, Phone, MapPin, Calendar, Home } from 'lucide-react';
import { toast } from 'react-toastify';

type Booking = {
    id: number;
    bookingref: string;
    customerName: string;
    customerPhone: string;
    date: string;
    rooms: number;
    status: number;
    isadvance: boolean;
    payments?: {
        amount: string;
        method: number;
        transactionid?: string;
    }[];
    arriveFrom?: string;
};

type Customer = {
    id: number;
    name: string;
    phoneNumber: string;
}

type EditBookingModalProps = {
    booking: Booking;
    onClose: () => void;
};

const paymentMethods = [
    { id: 0, name: 'Cash', icon: '💵' },
    { id: 1, name: 'Card', icon: '💳' },
    { id: 2, name: 'Online', icon: '🌐' }
];

const statusInfo: any = {
    0: { text: 'Checked Out', icon: <CheckCircle className='w-4 h-4' />, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    1: { text: 'Checked In', icon: <AlertCircle className='w-4 h-4' />, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    2: { text: 'Advance', icon: <Wallet className='w-4 h-4' />, color: 'bg-amber-100 text-amber-800 border-amber-200' }
};

export const EditBookingModal = ({ booking, onClose }: EditBookingModalProps) => {
    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hasSelected, setHasSelected] = useState(false);
    const [phoneInputTouched, setPhoneInputTouched] = useState(false);
    function toISTLocalDatetime(dateString: string) {
        const date = new Date(dateString);
        const istOffset = 5.5 * 60; // minutes
        const istDate = new Date(date.getTime() + istOffset * 60000);
        const local = istDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
        return local;
    }

    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            checkIn: toISTLocalDatetime(booking.date),
            numberOfRooms: booking.rooms,
            amount: booking.payments?.[0]?.amount || '',
            method: booking.payments?.[0]?.method?.toString() || '0',
            transaction: booking.payments?.[0]?.transactionid || '',
            arriveFrom: booking.arriveFrom || ''
        }
    });

    const phoneNumber = watch('customerPhone');
    const customerName = watch('customerName');
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (booking) {
            console.log('booking data', booking)
        }
    }, [])
    useEffect(() => {
        // Reset form with booking data when booking changes
        reset({
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            checkIn: toISTLocalDatetime(booking.date),
            numberOfRooms: booking.rooms,
            amount: booking.payments?.[0]?.amount || '',
            method: booking.payments?.[0]?.method?.toString() || '0',
            transaction: booking.payments?.[0]?.transactionid || '',
            arriveFrom: booking.arriveFrom || ''
        });
        // Reset touch state when booking changes
        setPhoneInputTouched(false);
        setHasSelected(false);
        setShowSuggestions(false);
    }, [booking, reset]);

    const selectCustomer = (customer: Customer) => {
        setValue('customerName', customer.name);
        setValue('customerPhone', customer.phoneNumber);
        setHasSelected(true);
        setShowSuggestions(false);
        setPhoneInputTouched(false);
    };

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const checkIn = new Date(data.checkIn).toISOString();
            const response = await fetch('/api/request-booking', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    phoneNumber: data.customerPhone,
                    customerName: data.customerName,
                    checkIn: checkIn,
                    numberOfRooms: Number(data.numberOfRooms),
                    isadvance: true, // Always advance
                    amount: data.amount,
                    method: Number(data.method),
                    transaction: data.transaction,
                    arriveFrom: data.arriveFrom
                })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const result = await response.json();
            toast.success('Booking updated successfully');
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    const searchCustomerByPhone = async (phone: string) => {
        if (phone.length < 3 || hasSelected || !phoneInputTouched) {
            setCustomerSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const res = await fetch(`/api/customers/search?phone=${phone}`);
            const data = await res.json();
            setCustomerSuggestions(data);
            setShowSuggestions(data.length > 0);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };

    useEffect(() => {
        if (!phoneNumber || phoneNumber.length < 10 || !phoneInputTouched) {
            if (phoneInputTouched && phoneNumber && phoneNumber.length < 10) {
                setHasSelected(false);
            }
            return;
        }

        const debounceTimeout = setTimeout(() => {
            searchCustomerByPhone(phoneNumber);
            setHasSelected(false);
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [phoneNumber, phoneInputTouched]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneInputTouched(true);
        // This will trigger the useForm's onChange
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
                {/* Modal Header with Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                Edit Booking
                            </h2>
                            <p className="text-blue-100 mt-1 font-medium">#{booking.bookingref}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/20 transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border ${statusInfo[booking.status]?.color}`}>
                            {statusInfo[booking.status]?.icon}
                            {statusInfo[booking.status]?.text}
                        </span>
                    </div>
                </div>

                {/* Modal Body with Enhanced Styling */}
                <div className="max-h-[calc(95vh-140px)] overflow-y-auto">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Customer Information Card */}
                            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Customer Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Customer Name *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                {...register('customerName', { required: true })}
                                                type="text"
                                                readOnly={hasSelected}
                                                className={`border border-gray-300 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${hasSelected ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                                placeholder="Enter customer name"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                {...register('customerPhone', {
                                                    required: true,
                                                    pattern: /^\d{10}$/,
                                                    onChange: handlePhoneChange
                                                })}
                                                type="tel"
                                                className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                placeholder="Enter 10-digit phone number"
                                            />
                                        </div>

                                        {showSuggestions && (
                                            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                                                <div className="p-2">
                                                    <p className="text-xs text-gray-500 mb-2 px-2">Existing customers:</p>
                                                    {customerSuggestions.map((customer) => (
                                                        <div
                                                            key={customer.id}
                                                            className="px-3 py-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors duration-150"
                                                            onClick={() => selectCustomer(customer)}
                                                        >
                                                            <div className="font-medium text-gray-900">{customer.name}</div>
                                                            <div className="text-sm text-gray-600">{customer.phoneNumber}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Arrival From
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                {...register('arriveFrom')}
                                                type="text"
                                                className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                placeholder="City or location"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Details Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Booking Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Check-in Date & Time (UTC) *
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                {...register('checkIn', { required: true })}
                                                type="datetime-local"
                                                className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                step="60"
                                            />
                                        </div>

                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Number of Rooms *
                                        </label>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                {...register('numberOfRooms', {
                                                    required: true,
                                                    min: 1,
                                                    valueAsNumber: true
                                                })}
                                                type="number"
                                                min="1"
                                                className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                                placeholder="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Section - Always Visible */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-600" />
                                Payment Details
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2">Required</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount *
                                    </label>
                                    <input
                                        {...register('amount', {
                                            required: true,
                                            min: 0
                                        })}
                                        type="number"
                                        step="0.01"
                                        className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method *
                                    </label>
                                    <select
                                        {...register('method', { required: true })}
                                        className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                    >
                                        {paymentMethods.map((method) => (
                                            <option key={method.id} value={method.id}>
                                                {method.icon} {method.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Transaction ID
                                        <span className="text-gray-500 text-xs ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        {...register('transaction')}
                                        type="text"
                                        className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                        placeholder="Enter transaction ID"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer with Enhanced Styling */}
                        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <RotateCcw className="w-4 h-4 animate-spin" />
                                        Updating Booking...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Update Booking
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
