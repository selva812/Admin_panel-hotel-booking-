'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { CircularProgress } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

export const AuthChecker = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isLoading } = useAuth()

    useEffect(() => {
        // Don't do anything while auth is still loading
        if (isLoading) return;

        const isLoginPage = pathname === '/auth/login'
        const isRootPage = pathname === '/'

        // Handle root route - redirect based on auth status
        if (isRootPage) {
            if (user) {
                router.replace('/dashboards/home')
            } else {
                router.replace('/auth/login')
            }
            return
        }

        // Handle other routes
        if (!isLoginPage && !user) {
            // User is not authenticated and not on login page
            router.replace('/auth/login')
        } else if (isLoginPage && user) {
            // User is authenticated but on login page
            router.replace('/dashboards/home')
        }
    }, [user, isLoading, router, pathname])

    // Show loading while auth context is initializing
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <CircularProgress />
            </div>
        )
    }

    // Show loading for root route while redirecting
    if (pathname === '/') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <CircularProgress />
            </div>
        )
    }

    return <>{children}</>
}
