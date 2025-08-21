"use client"
import AddCustomerModal from '@/components/dashboard/booking/customermodal';
import EditCustomerModal from '@/components/dashboard/booking/editmodal';
import { TransparentLoader } from '@/components/transparent';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

interface Customer {
    picture: any;
    id: number;
    name: string;
    phoneNumber: string;
    address?: string;
    companyName?: string;
    bookingsCount: number;
}

interface ApiResponse {
    data: Customer[];
    pagination: {
        total: number;
        currentPage: number;
        totalPages: number;
    };
}

export default function CustomersPage() {
    const router = useRouter()
    const [openModal, setOpenModal] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setloading] = useState(false);
    const [selectid, setselectid] = useState(0)
    const [phoneFilter, setPhoneFilter] = useState('');
    const [appliedPhoneFilter, setAppliedPhoneFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const fetchCustomers = useCallback(async () => {
        try {
            setloading(true)
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
                phone: appliedPhoneFilter
            });

            const res = await fetch(`/api/customers?${params}`);
            const json: ApiResponse = await res.json();

            setCustomers(json.data);
            setTotalCount(json.pagination.total);
        } catch (err) {
            console.error('Error fetching customers:', err);
        }
        finally {
            setloading(false)
        }
    }, [currentPage, appliedPhoneFilter]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);
    const handleReset = () => {
        setPhoneFilter('');
        setAppliedPhoneFilter(''); // Explicitly set to empty string
        setCurrentPage(1);
        // No need to call handleSearch, the useEffect will trigger
    };
    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedPhoneFilter(phoneFilter);
    };


    return (
        <Suspense fallback={<p>Loading search params...</p>}>
            <div className="px-3 w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Customers</h1>
                {/* Search and Add */}
                <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex flex-1  gap-2 w-full">
                        <input
                            type="tel"
                            value={phoneFilter}
                            onChange={(e) => setPhoneFilter(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search by name or phone number"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Search
                        </button>
                        {phoneFilter && (
                            <button
                                onClick={() => {
                                    setPhoneFilter('');
                                    handleReset(); // or your reset function if different
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-1"
                                title="Reset filter"
                            >
                                <XMarkIcon className="h-5 w-5" />
                                <span className="sr-only md:not-sr-only">Reset</span>
                            </button>
                        )}
                    </div>
                    <div
                        // href={`/dashboards/customers/newcustomer${phoneFilter ? `?phone=${encodeURIComponent(phoneFilter)}` : ''}`}
                        onClick={() => { setOpenModal(true) }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add New Customer
                    </div>
                </div>

                {/* Customer Table */}
                {loading ? <TransparentLoader /> :
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="overflow-x-auto"> {/* Add horizontal scroll for mobile */}
                            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center">
                                                <div className="text-gray-500">
                                                    No customers found.
                                                    {appliedPhoneFilter && (
                                                        <span className="block mt-2">
                                                            Would you like to{' '}
                                                            <Link
                                                                href={`/dashboards/customers/newcustomer?phone=${encodeURIComponent(appliedPhoneFilter)}`}
                                                                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                                            >
                                                                add a new customer with phone {appliedPhoneFilter}?
                                                            </Link>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-blue-50 transition-colors duration-150">
                                                {/* Name with truncation and tooltip */}
                                                <td className="px-6 py-4 max-w-[180px]">
                                                    <div className="flex items-center">
                                                        {customer.picture ? (
                                                            <img
                                                                src={`/uploads/${customer.picture}`}
                                                                alt={customer.name}
                                                                className="h-10 w-10 rounded-full object-cover mr-3"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                                <span className="text-blue-600 font-medium">
                                                                    {customer.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="truncate relative group" title={customer.name}>
                                                            <span className="font-medium text-gray-900 truncate block">
                                                                {customer.name}
                                                            </span>
                                                            <div className="absolute z-10 hidden group-hover:block bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                                                                {customer.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Phone - already good as is */}
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                    <a href={`tel:${customer.phoneNumber}`} className="hover:text-blue-600 transition-colors">
                                                        {customer.phoneNumber}
                                                    </a>
                                                </td>

                                                {/* Company with truncation */}
                                                <td className="px-6 py-4 max-w-[150px]">
                                                    {customer.companyName ? (
                                                        <div className="truncate relative group" title={customer.companyName}>
                                                            <span className="text-gray-600 truncate block">
                                                                {customer.companyName}
                                                            </span>
                                                            <div className="absolute z-10 hidden group-hover:block bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                                                                {customer.companyName}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>

                                                {/* Address with truncation */}
                                                <td className="px-6 py-4 max-w-[200px]">
                                                    {customer.address ? (
                                                        <div className="truncate relative group" title={customer.address}>
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-full">
                                                                {customer.address}
                                                            </span>
                                                            <div className="absolute z-10 hidden group-hover:block bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                                                                {customer.address}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>

                                                {/* Actions - unchanged */}
                                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                    <Link
                                                        href={`/dashboards/customers/details?id=${customer.id}`}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                    >
                                                        View
                                                    </Link>
                                                    <div
                                                        onClick={() => {
                                                            setselectid(customer.id)
                                                            setIsEditModalOpen(true)
                                                        }}
                                                        className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                    >
                                                        Edit
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - unchanged */}
                        {customers.length > 0 && (
                            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                                    <span className="font-semibold">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                                    <span className="font-semibold">{totalCount}</span> results
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm px-3 py-1.5">{currentPage}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage * pageSize >= totalCount}
                                        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>}
                <EditCustomerModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    customerId={selectid} // Pass the customer ID to edit
                    onSave={(updatedCustomer) => {
                        // Handle successful update
                        console.log('Customer updated:', updatedCustomer)
                    }}
                />
                <AddCustomerModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    initialPhone={''}
                    initialName={''}
                    onSave={newCustomer => {
                        fetchCustomers()
                    }}
                />
            </div>
        </Suspense>
    );
}
