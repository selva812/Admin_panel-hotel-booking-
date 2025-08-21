'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CameraIcon, Phone, XIcon } from 'lucide-react';

interface AddCustomerModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (customer: { id: string; phone: string; name: string; company: string }) => void
    initialPhone?: string
    initialName?: string
}

export default function AddCustomerModal({ isOpen, onClose, initialPhone, onSave, initialName }: AddCustomerModalProps) {
    const [form, setForm] = useState({
        name: initialName || '',
        phone: initialPhone || '',
        company: '',
        idProofNumber: '',
        address: '',
    })
    const [adhaar, setAdhaar] = useState<File | null>(null)
    const [profile, setProfile] = useState<File | null>(null)
    const [gstno, setgstno] = useState('')
    const [adhaarPreview, setAdhaarPreview] = useState<string | null>(null)
    const [profilePreview, setProfilePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [showCamera, setShowCamera] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    useEffect(() => {
        if (showCamera && videoRef.current && mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
            videoRef.current.play().then(() => {
                setCameraReady(true);
            }).catch(err => {
                console.error("Error playing video:", err);
                setCameraError("Failed to play camera");
            });
        }
    }, [showCamera]);

    const startCameraCapture = async () => {
        try {
            setCameraError(null);

            // Stop any existing streams first
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }

            // mediaStreamRef.current = stream;
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            mediaStreamRef.current = stream;
            setShowCamera(true);
            setCameraReady(false);
            console.log("Stream tracks:", stream.getTracks());
            console.log("Stream video tracks:", stream.getVideoTracks());

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                const video = videoRef.current;
                const handleLoadedMetadata = () => {
                    console.log("Video metadata loaded");
                    setCameraReady(true);
                };

                const handleCanPlay = () => {
                    console.log("Video can play");
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setTimeout(() => {
                            videoRef.current?.play().catch(e => {
                                console.error("Force play failed:", e);
                            });
                        }, 500);
                    }

                };

                const handleError = (e: Event) => {
                    console.error("Video error:", e);
                    setCameraError("Video playback error");
                };

                video.addEventListener('loadedmetadata', handleLoadedMetadata);
                // video.addEventListener('canplay', handleCanPlay);
                video.addEventListener('canplay', () => {
                    console.log("Can play event triggered");
                    setCameraReady(true);
                    video.play().catch(err => {
                        console.error("Autoplay failed:", err);
                        setCameraError("Unable to play video");
                    });
                });

                video.addEventListener('error', handleError);

                // Cleanup function
                const cleanup = () => {
                    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                    video.removeEventListener('canplay', handleCanPlay);
                    video.removeEventListener('error', handleError);
                };

                // Store cleanup function for later use
                // video.dataset.cleanup = 'true';

                // Force load the video
                video.load();

                // Timeout fallback
                setTimeout(() => {
                    if (!cameraReady && showCamera) {
                        console.log("Camera timeout, trying to force play");
                        video.play().catch(console.error);
                        setCameraReady(true);
                    }
                }, 3000);
            }

        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraError('Camera access denied or not available');

            // Show error for a moment then fallback to file input
            setTimeout(() => {
                setShowCamera(false);
                document.getElementById('cameraInput')?.click();
            }, 2000);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !mediaStreamRef.current) {
            console.log("Video or stream not ready for capture");
            return;
        }

        const video = videoRef.current;
        const canvas = document.createElement('canvas');

        // Get actual video dimensions
        const videoWidth = video.videoWidth || video.clientWidth;
        const videoHeight = video.videoHeight || video.clientHeight;

        // Set canvas dimensions
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Failed to get canvas context");
            return;
        }

        try {
            // Draw the current video frame to canvas
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

            // Convert canvas to Blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const timestamp = new Date().getTime();
                    const file = new File([blob], `profile_${timestamp}.jpg`, { type: 'image/jpeg' });
                    setProfile(file);
                    setProfilePreview(URL.createObjectURL(blob));
                    console.log("Photo captured successfully");
                } else {
                    console.error("Failed to create blob from canvas");
                }
            }, 'image/jpeg', 0.9);

            stopCamera();
        } catch (error) {
            console.error("Error capturing photo:", error);
            setCameraError("Failed to capture photo");
        }
    };

    const stopCamera = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("Camera track stopped");
            });
            mediaStreamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setShowCamera(false);
        setCameraReady(false);
        setCameraError(null);
    };

    // Clean up camera on unmount or when modal closes
    useEffect(() => {
        if (!isOpen && mediaStreamRef.current) {
            stopCamera();
        }

        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfile(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            name: initialName || '',
            phone: initialPhone || ''
        }));
    }, [initialName, initialPhone]);

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        setMounted(true)
        // Initialize phone number when modal opens
        setForm(prev => ({ ...prev, phone: initialPhone || '' }))
    }, [initialPhone])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }
    useEffect(() => {
        if (!isOpen) {
            // Reset all state when modal closes
            setTimeout(() => {
                setForm({
                    name: initialName || '',
                    phone: initialPhone || '',
                    company: '',
                    idProofNumber: '',
                    address: '',
                });
                setAdhaar(null);
                setProfile(null);
                setgstno('');
                setAdhaarPreview(null);
                setProfilePreview(null);
                setMessage(null);
            }, 300); // Small delay to allow animation
        }
    }, [isOpen, initialName, initialPhone]);
    const handleSubmit = async (e: React.FormEvent) => {
        try {
            e.preventDefault();
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => formData.append(key, value));
            if (adhaar) formData.append('adhaarPicture', adhaar);
            if (profile) formData.append('profilePicture', profile);
            if (gstno) formData.append('gstno', gstno);

            setLoading(true);
            setMessage(null); // Clear previous messages

            const res = await fetch('/api/customers', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to add customer');
            }

            // Success case
            setMessage({ text: data.message || 'Customer added successfully', type: 'success' });

            // Call onSave with the new customer data
            onSave({
                id: data.customer.id,
                phone: form.phone,
                name: form.name,
                company: form.company
            });

            // Reset form and close after delay
            setTimeout(() => {
                setForm({
                    name: '',
                    phone: '',
                    company: '',
                    idProofNumber: '',
                    address: '',
                });
                setAdhaar(null);
                setProfile(null);
                setgstno('');
                setAdhaarPreview(null);
                setProfilePreview(null);
                setMessage(null);
                onClose();
            }, 1500);

        } catch (error) {
            console.error('Error in adding customer:', error);
            setMessage({
                text: error instanceof Error ? error.message : 'An unexpected error occurred',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 sm:p-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <XIcon className="h-6 w-6 text-gray-600" />
                    </button>

                    <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                        Add New Customer
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Personal Information */}
                            <div className="space-y-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="+91 98765 43210"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <textarea
                                        name="address"
                                        placeholder="Enter full address"
                                        value={form.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof Number</label>
                                    <input
                                        type="text"
                                        name="idProofNumber"
                                        placeholder="Aadhaar/PAN/License Number"
                                        value={form.idProofNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]"
                                    />
                                </div>
                            </div>

                            {/* Right Column - Business & Documents */}
                            <div className="space-y-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                                    <input
                                        type="text"
                                        name="company"
                                        placeholder="Company Name"
                                        value={form.company}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                                    <input
                                        type="text"
                                        name="gstno"
                                        placeholder="Company GST number"
                                        value={gstno}
                                        onChange={(e) => { setgstno(e.target.value) }}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C59F56] focus:border-[#C59F56]"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Card</label>
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#C59F56] transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    const reader = new FileReader()
                                                    reader.onloadend = () => setAdhaarPreview(reader.result as string)
                                                    reader.readAsDataURL(file)
                                                }
                                                setAdhaar(file || null)
                                            }}
                                            className="hidden"
                                        />
                                        {adhaarPreview ? (
                                            <img src={adhaarPreview} alt="Aadhaar preview" className="h-full w-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="text-gray-500 text-sm">Click to upload Aadhaar</span>
                                        )}
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#C59F56] transition-colors relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            onChange={handleFileInput}
                                            className="hidden"
                                            id="cameraInput"
                                        />
                                        <button
                                            type="button"
                                            onClick={startCameraCapture}
                                            className="w-full h-full flex items-center justify-center"
                                        >
                                            {profilePreview ? (
                                                <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center">
                                                    <CameraIcon className="h-6 w-6 text-gray-500 mb-1" />
                                                    <span className="text-gray-500 text-sm">Take photo</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Camera preview modal (positioned outside columns) */}
                        {showCamera && (
                            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
                                <div className="relative bg-black w-full max-w-md">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-auto max-h-96"
                                        autoPlay
                                        playsInline
                                        muted
                                        style={{ backgroundColor: 'black' }}
                                    />
                                    {(!cameraReady || cameraError) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                            <div className="text-white text-center">
                                                {cameraError ? (
                                                    <div>
                                                        <div className="mb-2">{cameraError}</div>
                                                        <div className="text-sm">Switching to file upload...</div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                                        <div>Loading camera...</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex gap-4">
                                    <button
                                        onClick={capturePhoto}
                                        disabled={!cameraReady}
                                        className="p-4 bg-white rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Capture Photo"
                                    >
                                        <CameraIcon className="h-6 w-6 text-black" />
                                    </button>
                                    <button
                                        onClick={stopCamera}
                                        type="button"
                                        className="p-4 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                        title="Close Camera"
                                    >
                                        <XIcon className="h-6 w-6 text-black" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status message and submit button */}
                        <div className="pt-2">
                            {message && (
                                <div className={`mb-4 p-3 rounded-lg text-center ${message.type === 'success'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {message.text}
                                </div>
                            )}
                            <div className="text-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`bg-[#C59F56] text-white font-semibold px-8 py-3 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b88b3c]'
                                        }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </span>
                                    ) : (
                                        'Add Customer'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    )
}
