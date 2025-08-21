'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'

export default function CategoryDetailsModal({
    categoryId,
    startDate,
    endDate,
    onClose
}: {
    categoryId: any | null
    startDate?: string
    endDate?: string
    onClose: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [categoryDetails, setCategoryDetails] = useState<any>(null)
    const [expenses, setExpenses] = useState<any[]>([])

    useEffect(() => {
        if (categoryId) {
            fetchCategoryDetails()
        }
    }, [categoryId])

    const fetchCategoryDetails = async () => {
        setIsLoading(true)
        try {
            let url = `/api/reports/expenses/category?id=${categoryId}`
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`
            }

            const response = await fetch(url)
            const data = await response.json()

            setCategoryDetails(data.category)
            setExpenses(data.expenses)
        } catch (error) {
            console.error('Error fetching category details:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Transition appear show={!!categoryId} as="div">
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as="div"
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as="div"
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-start">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {categoryDetails?.name || 'Category Details'}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="mt-4 flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">Total Expenses</p>
                                                <p className="text-xl font-bold">
                                                    ₹{expenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">Transactions</p>
                                                <p className="text-xl font-bold">{expenses.length}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">Average</p>
                                                <p className="text-xl font-bold">
                                                    ₹{expenses.length > 0
                                                        ? (expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) / expenses.length).toLocaleString()
                                                        : 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                            <h4 className="font-medium mb-3">Transaction History</h4>
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {expenses.length > 0 ? (
                                                    expenses.map((expense) => (
                                                        <div key={expense.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                                                            <div>
                                                                <p className="font-medium">{expense.description || 'No description'}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    {new Date(expense.date).toLocaleDateString()} • {expense.recorder?.name || 'Unknown'}
                                                                </p>
                                                            </div>
                                                            <p className="font-bold text-red-600">₹{Number(expense.amount).toLocaleString()}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-gray-500 py-4">No transactions found</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
