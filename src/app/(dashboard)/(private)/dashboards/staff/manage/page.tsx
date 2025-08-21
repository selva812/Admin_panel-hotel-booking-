"use client"
import AddUserPage from "@/components/dashboard/user/createuser"
import { Suspense } from "react"
export const dynamic = 'force-dynamic'
const Page = () => {
    return (
        <Suspense fallback={<p>Loading search params...</p>}>
            <AddUserPage />
        </Suspense>
    )
}

export default Page
