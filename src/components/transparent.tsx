// components/TransparentLoader.tsx
'use client'
export const TransparentLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                {/* Spinner */}
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-t-transparent"></div>

                {/* Optional Text */}
                <span className="text-white font-medium">Loading...</span>
            </div>
        </div>
    );
};
