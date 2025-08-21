"use client"
import RoomTable from '@/components/dashboard/room/page'
import { Suspense } from 'react';
export default function RoomsPage() {
  return (
    <Suspense fallback={<p>Loading search params...</p>}>
      <div className="min-h-screen bg-white text-gray-900 p-6">
        <h1 className="text-2xl font-bold mb-4">Room List</h1>
        <RoomTable />
      </div>
    </Suspense>
  );
}
