
"use client"
import { useEffect, useRef, useState } from 'react';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Initialize camera when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const startCamera = async () => {
            try {
                setCameraError(null);
                setCameraReady(false);

                // Stop any existing streams
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                }

                // Request camera access
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                mediaStreamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play()
                            .then(() => setCameraReady(true))
                            .catch(err => {
                                console.error("Playback error:", err);
                                setCameraError("Failed to start camera");
                            });
                    };
                }
            } catch (error) {
                console.error('Camera error:', error);
                setCameraError('Camera access denied or not available');
            }
        };

        startCamera();

        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen]);

    // Cleanup when modal closes
    const handleClose = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        onClose();
    };

    const capturePhoto = () => {
        if (!videoRef.current || !cameraReady) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
            if (blob) {
                const file = new File([blob], `capture_${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                });
                onCapture(file);
            }
        }, 'image/jpeg', 0.9);

        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Take Photo</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Camera preview */}
                <div className="relative bg-black aspect-video rounded-md overflow-hidden mb-4">
                    {cameraError ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-500 p-4">
                            <div className="text-center">
                                <p className="mb-2">{cameraError}</p>
                                <p className="text-sm">Please allow camera access</p>
                            </div>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            className="w-full h-full object-contain"
                            muted
                            playsInline
                        />
                    )}

                    {!cameraReady && !cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            <div className="text-white">Loading camera...</div>
                        </div>
                    )}
                </div>

                {/* Camera controls */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={capturePhoto}
                        disabled={!cameraReady || !!cameraError}
                        className={`px-4 py-2 rounded-md ${cameraReady && !cameraError
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Capture
                    </button>
                </div>
            </div>
        </div>
    );
}
