"use client"
import { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Smartphone, Calendar, User, Phone, FileText, IndianRupee, BookUser, Home, ArrowRight } from 'lucide-react';
type Booking = {
    bookingref: string;
    id: number;
    checkIn: string;
    checkOut: string;
    occupancy: number;
    customer?: { name: string, phoneNumber: string };
    room?: { roomNumber: string };
    bookedBy?: { name: string };
    stayedBy?: { name: string };
    user?: { name: string };
    roomNumbers?: string;
};
interface PaymentModalProps {
    bookingId: number;
    booking: Booking;
    max: number;
    isOpen: boolean;
    onClose: () => void;
    onPaymentSuccess: () => void;
}

export default function PaymentModal({
    bookingId,
    booking,
    max,
    isOpen,
    onClose,
    onPaymentSuccess
}: PaymentModalProps) {
    const [amount, setAmount] = useState<number>(0);
    const [method, setMethod] = useState<string>('CASH');
    const [note, setNote] = useState<string>('');
    const [trans, settrans] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Reset form on modal open
        if (isOpen) {
            setAmount(0);
            setMethod('CASH');
            setNote('');
            setError(null);
        }
    }, [isOpen]);
    const convertPaymentMethodToNumber = (method: string): number => {
        switch (method) {
            case 'CASH': return 0;
            case 'CARD': return 1;
            case 'ONLINE': return 2;
            default: return 0; // default to CASH if unknown
        }
    };
    // Helper function to calculate nights
    const calculateNights = (checkIn: string | Date, checkOut: string | Date): number => {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(checkIn);
        const secondDate = new Date(checkOut);
        const diffTime = Math.abs(secondDate.getTime() - firstDate.getTime());
        return Math.round(diffTime / oneDay);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!amount || amount <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        if (amount > max) {
            setError(`Amount must not exceed ₹${max}`);
            return;
        }

        if ((method === 'CARD' || method === 'ONLINE') && note.trim() === '') {
            setError('Transaction ID is required for CARD or ONLINE payments');
            return;
        }

        setError(null);
        setIsLoading(true);
        console.log('method', convertPaymentMethodToNumber(method))
        try {
            const payload = {
                bookingId,
                amount: Number(amount),
                method: convertPaymentMethodToNumber(method),
                transact: trans,
                note: note.trim()
            };

            const res = await fetch('/api/checkout/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error('Payment processing failed');
            }

            onPaymentSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during payment');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pt-24 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Wallet className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Process Payment</h2>
                            <p className="text-sm text-gray-500">Complete the payment for this booking</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Booking Information Section */}
                {/* Booking Information Section */}
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-5">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg text-gray-800">Booking Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                            {/* Booking ID */}
                            <div className="flex items-start">
                                <div className="bg-white p-2 rounded-lg mr-4 shadow-sm flex-shrink-0">
                                    <BookUser className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Booking ID</p>
                                    <p className="font-semibold text-gray-800 text-lg">#{booking.bookingref}</p>
                                </div>
                            </div>

                            {/* Room Information */}
                            <div className="flex items-start">
                                <div className="bg-white p-2 rounded-lg mr-4 shadow-sm flex-shrink-0">
                                    <Home className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Room</p>
                                    <p className="font-semibold text-gray-800 text-lg">
                                        {booking.room?.roomNumber || booking.roomNumbers || 'N/A'}
                                    </p>
                                    {/* {booking.room?.type && (
                                        <p className="text-sm text-gray-600 mt-1">{booking.room.type.name}</p>
                                    )} */}
                                </div>
                            </div>

                            {/* Guest Information */}
                            <div className="flex items-start">
                                <div className="bg-white p-2 rounded-lg mr-4 shadow-sm flex-shrink-0">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Guest</p>
                                    <p className="font-semibold text-gray-800 text-lg">
                                        {booking.customer?.name || booking.stayedBy?.name || 'N/A'}
                                    </p>
                                    {/* {booking.customer?.companyName && (
                                        <p className="text-sm text-gray-600 mt-1">{booking.customer.companyName}</p>
                                    )} */}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            {/* Dates */}
                            <div className="flex items-start">
                                <div className="bg-white p-2 rounded-lg mr-4 shadow-sm flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Stay Period</p>
                                    <div className="flex items-center space-x-2">
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(booking.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(booking.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                        {calculateNights(booking.checkIn, booking.checkOut)} night stay
                                    </p>
                                </div>
                            </div>

                            {/* Balance Due */}
                            {/* <div className="flex items-start">
                                <div className="bg-white p-2 rounded-lg mr-4 shadow-sm flex-shrink-0">
                                    <IndianRupee className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Balance Due</p>
                                    <p className="font-bold text-xl text-blue-600">₹{max}</p>
                                    <p className="text-xs text-gray-500 mt-1">Includes all taxes and fees</p>
                                </div>
                            </div> */}

                            {/* Contact Information */}
                            <div className="flex items-start">
                                <div className="bg-white p-2 rounded-lg mr-4 shadow-sm flex-shrink-0">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Contact</p>
                                    <p className="font-semibold text-gray-800 text-lg">
                                        {booking.customer?.phoneNumber || 'N/A'}
                                    </p>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit}>
                    <input type="hidden" value={bookingId} />

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Payment Amount (₹)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                value={amount}
                                max={max}
                                onChange={e => {
                                    const inputValue = Number(e.target.value);
                                    const clampedValue = inputValue > max ? max : inputValue;
                                    setAmount(clampedValue);
                                }}
                                placeholder={`Enter amount up to ₹${max}`}
                                className="w-full pl-10 p-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                disabled={isLoading}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">
                                Max: ₹{max}
                            </div>
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                            <span>Minimum: ₹100</span>
                            <span>Balance: ₹{max - amount}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setMethod('CASH')}
                                className={`p-3 border rounded-lg flex flex-col items-center transition-colors ${method === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                disabled={isLoading}
                            >
                                <Wallet className="w-5 h-5 mb-1 text-gray-700" />
                                <span>Cash</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('CARD')}
                                className={`p-3 border rounded-lg flex flex-col items-center transition-colors ${method === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                disabled={isLoading}
                            >
                                <CreditCard className="w-5 h-5 mb-1 text-gray-700" />
                                <span>Card</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('ONLINE')}
                                className={`p-3 border rounded-lg flex flex-col items-center transition-colors ${method === 'ONLINE' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                disabled={isLoading}
                            >
                                <Smartphone className="w-5 h-5 mb-1 text-gray-700" />
                                <span>Online</span>
                            </button>
                        </div>
                    </div>

                    {(method === 'CARD' || method === 'ONLINE') && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Transaction Details</label>
                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CreditCard className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={trans}
                                        onChange={e => settrans(e.target.value)}
                                        placeholder="Enter transaction ID"
                                        className="w-full pl-10 p-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Additional Notes</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Any special instructions..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-start">
                            <X className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium flex items-center transition-colors"
                            disabled={isLoading}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium flex items-center transition-colors shadow-md"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing Payment...
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Pay ₹{amount || '0'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
