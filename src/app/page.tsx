"use client";

export default function HomePage() {
    // AuthChecker will handle the redirection logic
    // This component will rarely be seen as users get redirected immediately
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
    );
}
