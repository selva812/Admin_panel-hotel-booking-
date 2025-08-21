"use client"
import Dashboard from '@/components/dashboard/user/page'
import React, { Suspense } from 'react'
export const dynamic = 'force-dynamic'
const page = () => {
    return (
        <Suspense fallback={<p>Loading search params...</p>}>
            <Dashboard />
        </Suspense>
    )
}

export default page
