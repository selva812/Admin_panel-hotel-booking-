"use client"
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, User, Phone, Mail, Bed, CreditCard, Landmark, Wallet, IndianRupee, AlertTriangle } from 'lucide-react';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

interface Customer {
    id: number;
    name: string;
    phoneNumber: string;
    email: string;
}

interface Room {
    id: number;
    roomNumber: string;
    type: {
        name: string;
    };
}

interface BookedRoom {
    tax: string;
    extraBeds: number;
    extraBedPrice: string;
    isAc: boolean;
    id: number;
    roomId: number;
    room: Room;
    checkIn: string;
    checkOut: string;
    bookedPrice: number;
    adults: number;
    children?: number;
}

interface Payment {
    id: number;
    amount: number;
    method: number;
    transactionid?: string;
    note?: string;
}

interface Bill {
    id: number;
    totalAmount: number;
    balance: number;
}

interface Booking {
    id: number;
    bookingref: string;
    customer: Customer;
    bookedRooms: BookedRoom[];
    bill: Bill;
    payments: Payment[];
}

interface FormData {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    bookedRooms: BookedRoom[];
    billTotalAmount: number;
    payments: Payment[];
}

interface EditInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: number | null;
}

const paymentMethods = [
    { value: 0, label: 'Cash', icon: <Wallet size={16} className="mr-2" /> },
    { value: 1, label: 'Card', icon: <Landmark size={16} className="mr-2" /> },
    { value: 2, label: 'Online', icon: <CreditCard size={16} className="mr-2" /> },
];

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, onClose, bookingId }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [originalCustomer, setOriginalCustomer] = useState<{ name: string; phone: string } | null>(null);
    const [formData, setFormData] = useState<FormData>({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        bookedRooms: [],
        billTotalAmount: 0,
        payments: []
    });

    const fetchBooking = async () => {
        if (!bookingId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/bookings/specific?bookingId=${bookingId}`);
            const result = await response.json();

            if (result.success) {
                const bookingData: Booking = result.data;
                setBooking(bookingData);
                setOriginalCustomer({
                    name: bookingData.customer?.name || '',
                    phone: bookingData.customer?.phoneNumber || ''
                });
                setFormData({
                    customerName: bookingData.customer?.name || '',
                    customerPhone: bookingData.customer?.phoneNumber || '',
                    customerEmail: bookingData.customer?.email || '',
                    bookedRooms: bookingData.bookedRooms || [],
                    billTotalAmount: bookingData.bill?.totalAmount || 0,
                    payments: bookingData.payments || []
                });
            } else {
                console.error('Failed to fetch booking data');
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total payments and balance
    const totalPayments = formData.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const calculatedBalance = formData.billTotalAmount - totalPayments;

    // Check for payment mismatch
    const hasPaymentMismatch = Math.abs(calculatedBalance - (booking?.bill?.balance || 0)) > 0.01;

    // Check if customer details changed
    const customerChanged = originalCustomer && (
        formData.customerName !== originalCustomer.name ||
        formData.customerPhone !== originalCustomer.phone
    );

    const handleSave = async () => {
        // Validate payments before saving
        if (hasPaymentMismatch) {
            alert('Payment amounts do not match. Please check your payment history.');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`/api/bookings/specific?bookingId=${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                onClose();
            } else {
                console.error(result.message || 'Failed to update booking');
            }
        } catch (error) {
            console.error('Error saving booking:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRoomChange = (roomIndex: number, field: keyof BookedRoom, value: any) => {
        setFormData(prev => ({
            ...prev,
            bookedRooms: prev.bookedRooms.map((room, index) => {
                if (index === roomIndex) {
                    return { ...room, [field]: value };
                }
                // If changing check-in or check-out, apply to all rooms
                if (field === 'checkIn' || field === 'checkOut') {
                    return { ...room, [field]: value };
                }
                return room;
            })
        }));
    };

    const handlePaymentChange = (paymentIndex: number, field: keyof Payment, value: any) => {
        setFormData(prev => ({
            ...prev,
            payments: prev.payments.map((payment, index) =>
                index === paymentIndex ? { ...payment, [field]: value } : payment
            )
        }));
    };

    useEffect(() => {
        if (isOpen && bookingId) {
            fetchBooking();
        }
    }, [isOpen, bookingId]);

    if (!isOpen) return null;

    const toLocalDateTimeString = (date: any, timeZone = 'Asia/Kolkata') => {
        const zonedDate = toZonedTime(new Date(date), timeZone)
        return formatInTimeZone(zonedDate, timeZone, "yyyy-MM-dd'T'HH:mm")
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 border-b p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <User className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-800">
                            Edit Booking {booking?.bookingref}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <span className="ml-3 text-gray-600">Loading booking data...</span>
                        </div>
                    ) : (
                        <>
                            {/* Customer Information */}
                            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <User className="w-5 h-5 text-blue-600 mr-2" />
                                    Customer Information
                                    {customerChanged && (
                                        <div className="ml-3 flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-sm">
                                            <AlertTriangle className="w-4 h-4 mr-1" />
                                            Changes will update customer database
                                        </div>
                                    )}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.customerName}
                                            onChange={(e) => handleInputChange('customerName', e.target.value)}
                                            className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${originalCustomer && formData.customerName !== originalCustomer.name
                                                ? 'border-amber-300 bg-amber-50'
                                                : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.customerPhone}
                                                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                                                className={`w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${originalCustomer && formData.customerPhone !== originalCustomer.phone
                                                    ? 'border-amber-300 bg-amber-50'
                                                    : 'border-gray-300'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.customerEmail}
                                                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                                                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Room Information */}
                            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <Bed className="w-5 h-5 text-blue-600 mr-2" />
                                    Room Details
                                    <span className="ml-3 text-sm text-gray-500">
                                        (Check-in/out changes apply to all rooms)
                                    </span>
                                </h3>
                                <div className="space-y-4">
                                    {formData.bookedRooms.map((room, index) => (
                                        <div key={room.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-800">
                                                    {room.room?.roomNumber} - {room.room?.type?.name}
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                                <div className="space-y-1 col-span-1 md:col-span-1 lg:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Check In
                                                    </label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                                        <input
                                                            type="datetime-local"
                                                            value={room.checkIn ? toLocalDateTimeString(room.checkIn) : ''}
                                                            onChange={(e) => handleRoomChange(index, 'checkIn', e.target.value)}
                                                            className="w-full pl-10 pr-2 p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                            style={{ minWidth: '200px' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1 col-span-1 md:col-span-1 lg:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Check Out
                                                    </label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                                        <input
                                                            type="datetime-local"
                                                            value={room.checkOut ? toLocalDateTimeString(room.checkOut) : ''}
                                                            onChange={(e) => handleRoomChange(index, 'checkOut', e.target.value)}
                                                            className="w-full pl-10 pr-2 p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                            style={{ minWidth: '200px' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Price
                                                    </label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            value={room.bookedPrice}
                                                            onChange={(e) => handleRoomChange(index, 'bookedPrice', parseFloat(e.target.value))}
                                                            className="w-full pl-10 p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Adults
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={room.adults || ''}
                                                        onChange={(e) => handleRoomChange(index, 'adults', parseInt(e.target.value))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Children
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={room.children || ''}
                                                        onChange={(e) => handleRoomChange(index, 'children', parseInt(e.target.value))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Tax
                                                    </label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            value={room.tax || ''}
                                                            onChange={(e) => handleRoomChange(index, 'tax', parseFloat(e.target.value))}
                                                            className="w-full pl-10 p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                {room.extraBeds > 0 && (
                                                    <div className="space-y-1">
                                                        <label className="block text-xs font-medium text-gray-600">
                                                            Extra Bed Price
                                                        </label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="number"
                                                                value={room.extraBedPrice || ''}
                                                                onChange={(e) => handleRoomChange(index, 'extraBedPrice', parseFloat(e.target.value))}
                                                                className="w-full pl-10 p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="space-y-1 flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={room.isAc || false}
                                                        onChange={(e) => handleRoomChange(index, 'isAc', e.target.checked)}
                                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <label className="ml-2 block text-xs font-medium text-gray-600">
                                                        AC Room
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bill Information */}
                            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <IndianRupee className="w-5 h-5 text-blue-600 mr-2" />
                                    Bill Information
                                    {hasPaymentMismatch && (
                                        <div className="ml-3 flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md text-sm">
                                            <AlertTriangle className="w-4 h-4 mr-1" />
                                            Payment amounts don't match
                                        </div>
                                    )}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Total Amount
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.billTotalAmount}
                                                onChange={(e) => handleInputChange('billTotalAmount', parseFloat(e.target.value))}
                                                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Total Payments
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={totalPayments}
                                                disabled
                                                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg bg-gray-100"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Calculated Balance
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={calculatedBalance}
                                                disabled
                                                className={`w-full pl-10 p-2.5 border rounded-lg ${hasPaymentMismatch ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-100'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {hasPaymentMismatch && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start">
                                            <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                            <div className="text-sm text-red-700">
                                                <p className="font-medium">Payment Amount Mismatch Detected</p>
                                                <p className="mt-1">
                                                    Total Bill: ₹{formData.billTotalAmount} |
                                                    Total Payments: ₹{totalPayments} |
                                                    Expected Balance: ₹{calculatedBalance} |
                                                    Current Balance: ₹{(booking?.bill?.balance || 0)}
                                                </p>
                                                <p className="mt-1">Please verify your payment amounts before saving.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payments */}
                            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-4">
                                    Payment History
                                </h3>
                                <div className="space-y-3">
                                    {formData.payments.map((payment, index) => (
                                        <div key={payment.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Amount
                                                    </label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={payment.amount}
                                                            onChange={(e) => handlePaymentChange(index, 'amount', parseFloat(e.target.value))}
                                                            className="w-full pl-10 p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Method
                                                    </label>
                                                    <select
                                                        value={payment.method}
                                                        onChange={(e) => handlePaymentChange(index, 'method', parseInt(e.target.value))}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {paymentMethods.map(method => (
                                                            <option key={method.value} value={method.value}>
                                                                {method.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Transaction ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={payment.transactionid || ''}
                                                        onChange={(e) => handlePaymentChange(index, 'transactionid', e.target.value)}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-600">
                                                        Note
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={payment.note || ''}
                                                        onChange={(e) => handlePaymentChange(index, 'note', e.target.value)}
                                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading || hasPaymentMismatch}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors flex items-center"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditInvoiceModal
