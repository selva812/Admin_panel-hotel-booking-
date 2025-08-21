"use client"
import { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';

interface DeleteBookingModalProps {
    bookingId: number;
    isOpen: boolean;
    onClose: () => void;
    onDeleteSuccess: () => void;
}

const DeleteBookingModal = ({
    bookingId,
    isOpen,
    onClose,
    onDeleteSuccess
}: DeleteBookingModalProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(`/api/booking?id=${bookingId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to delete booking');
            }

            onClose();
            onDeleteSuccess();
        } catch (error: any) {
            console.error('Delete error:', error);
            setDeleteError(error.message || 'Failed to delete booking. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-800">Delete Booking</h3>
                    </div>

                    <p className="text-gray-600 mb-6">
                        This will permanently delete booking #{bookingId}. This action cannot be undone.
                    </p>

                    {deleteError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center">
                            <X className="w-5 h-5 mr-2" />
                            <span>{deleteError}</span>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                        >
                            {isDeleting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirm Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteBookingModal;
