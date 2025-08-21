"use client"
import { useState, useEffect, FormEvent, ReactNode, Suspense } from 'react';
import axios from 'axios';
import {
  PlusCircle,
  X,
  Text,
  List,
  CreditCard,
  Hash,
  Check,
  User,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  Upload, File,
  Calendar,
  Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import AddVendorModal from '@/components/vendormodal';
import { TransparentLoader } from '@/components/transparent';
interface Expense {
  attachment: string;
  vendor: {
    id: number;
    name: string;
    phonenumber: string;
  }
  id: number;
  entrytype: boolean;
  amount: number;
  description: string;
  paymentMethod: number;
  category: {
    id: number;
    name: string;
  };
  date: string;
  status: number;
}
interface ExpenseCategory {
  id: number;
  name: string;
  description: string | null;
  status: number;
}
interface Vendor {
  id: number;
  name: string;
  phonenumber: string;
}
interface Files {
  name: string;
  type: string;
}
interface FileWithPreview extends File {
  preview?: string;
}
const paymentMethodMap: Record<number, string> = {
  1: 'Cash',
  2: 'Card',
  3: 'Online'
};

const entryTypeMap: Record<any, string> = {
  true: 'In',
  false: 'Out'
};

//export const dynamic = 'force-dynamic'
export default function ExpenseTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(1); // Default to Cash
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachment, setAttachment] = useState<FileWithPreview | null>(null);
  const [filters, setFilters] = useState({
    categoryId: '',
    startDate: '',
    endDate: '',
    vendorId: '',
  });
  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [expenseload, setexpenseload] = useState(false)
  const [editload, seteditload] = useState(false)
  const [vendorSearch, setVendorSearch] = useState(editingExpense?.vendor?.phonenumber || '');
  const [vendorName, setVendorName] = useState(editingExpense?.vendor?.name || '');
  const [allowNameEdit, setAllowNameEdit] = useState(false);
  const validateFilters = () => {
    // Date validation
    if ((filters.startDate && !filters.endDate) || (!filters.startDate && filters.endDate)) {
      toast.error('Both From and To dates are required')
      return false
    } else if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      if (start > end) {
        toast.error('To Date must be after From Date')
        return false
      }
    }
    return true
  }

  const searchVendors = async (term: string) => {
    if (!term || term.length < 3) {
      setVendorSuggestions([]);
      setShowVendorSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/vendor/search?searchTerm=${encodeURIComponent(term)}`);
      const data = await res.json();
      setVendorSuggestions(data);
      setShowVendorSuggestions(data.length > 0);
    } catch (error) {
      console.error('Vendor search failed', error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedVendor) searchVendors(vendorSearch);
    }, 300);

    return () => clearTimeout(timeout);
  }, [vendorSearch]);

  const fetchExpenses = async (page: number) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/expenses', {
        params: {
          page,
          limit: itemsPerPage,
          ...filters, // spread filters here
        },
      });
      setExpenses(res.data.data);
      setTotalItems(res.data.pagination.totalItems);
    } catch {
      alert('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;
    seteditload(true)
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const form = e.currentTarget;
      const formData = new FormData();

      // Add all required fields to formData
      formData.append('id', editingExpense.id.toString());
      formData.append('description', form.description.value);
      formData.append('amount', form.amount.value);
      formData.append('paymentMethod', form.paymentMethod.value);
      formData.append('categoryId', form.categoryId.value);
      formData.append('entrytype', form.entrytype.value);
      formData.append('vendorId', form.vendorId?.value || editingExpense.vendor.id.toString());
      formData.append('transactionDate', editingExpense.date);

      // Handle transaction ID if payment method isn't cash (1)
      if (parseInt(form.paymentMethod.value) !== 1) {
        formData.append('transactionId', form.transactionId?.value || '');
      }

      // Handle file attachment
      const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('file-upload', fileInput.files[0]);
      } else if (!editingExpense.attachment) {
        // If no existing attachment and no new file, mark for removal
        formData.append('removeAttachment', 'true');
      }

      const response = await axios.put('/api/expenses', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditingExpense(null);
      toast.success('Expense updated successfully');
      fetchExpenses(currentPage);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update expense');
    } finally {
      seteditload(false)
    }
  };
  const handleAddExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setexpenseload(true)
    const form = e.currentTarget;
    const formData = new FormData(form);

    const description = formData.get('description')?.toString().trim();
    const amount = parseFloat(formData.get('amount') as string);
    const paymentMethod = parseInt(formData.get('paymentMethod') as string);
    const categoryId = parseInt(formData.get('categoryId') as string);
    const entrytype = formData.get('entrytype') === 'true';
    const transactionId = paymentMethod !== 1 ? formData.get('transactionId')?.toString().trim() : null;
    const transactionDate = formData.get('transactionDate')?.toString();
    const vendorId = selectedVendor?.id;

    // ✅ Field validations
    if (!description) return toast.error('Description is required');
    if (isNaN(amount) || amount <= 0) return toast.error('Valid amount is required');
    if (isNaN(paymentMethod)) return toast.error('Payment method is required');
    if (isNaN(categoryId)) return toast.error('Category is required');
    if (!transactionDate) return toast.error('Transaction date is required');
    if (!vendorId) return toast.error('Vendor is required');
    if (paymentMethod !== 1 && !transactionId) return toast.error('Transaction reference is required for non-cash payments');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const formPayload = new FormData();
      formPayload.append('description', description);
      formPayload.append('amount', amount.toString());
      formPayload.append('paymentMethod', paymentMethod.toString());
      formPayload.append('categoryId', categoryId.toString());
      formPayload.append('entrytype', entrytype.toString());
      formPayload.append('transactionDate', transactionDate);
      formPayload.append('vendorId', vendorId.toString());
      if (transactionId) formPayload.append('transactionId', transactionId);
      if (attachment) formPayload.append('file-upload', attachment);

      await axios.post('/api/expenses', formPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      setShowAddModal(false);
      setAttachment(null);
      toast.success('Payment added successfully');
      fetchExpenses(currentPage);
    } catch (error) {
      console.error('Add expense error:', error);
      toast.error(`Failed to add payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setexpenseload(false)
    }
  };


  useEffect(() => {
    fetchExpenses(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/expense-categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!validateFilters()) {
      return; // Don't proceed if validation fails
    }

    setCurrentPage(1);
    fetchExpenses(1);
  };
  const handleClear = () => {
    setFilters({
      categoryId: '',
      startDate: '',
      endDate: '',
      vendorId: ''
    });
    setCurrentPage(1);
    fetchExpenses(1);
  };
  if (loading) return <div><TransparentLoader /></div>

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Transactions</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" />
          Add New
        </button>
      </div>
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between cursor-pointer p-2 -m-2 hover:bg-gray-50 rounded"
        >
          <span className="text-sm font-medium">Filters</span>
          <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line ml-2`} />
        </div>

        {/* Expanded Filter Form */}
        {isExpanded && (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4"
          >
            {/* Category Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
                }
                className="p-2 border rounded text-sm w-full"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Vendor</label>
              <div className="relative">
                {filters.vendorId ? (
                  <div className="flex items-center justify-between p-2 border rounded text-sm w-full bg-gray-50">
                    <div>
                      <div className="font-medium">{vendorName}</div>
                      <div className="text-xs text-gray-500">{vendorSearch}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, vendorId: '' }));
                        setVendorSearch('');
                        setVendorName('');
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={vendorSearch}
                      onChange={async (e) => {
                        const phone = e.target.value;
                        setVendorSearch(phone);
                        await searchVendors(phone);
                        setAllowNameEdit(false);
                      }}
                      className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search by phone"
                    />
                    {showVendorSuggestions && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {vendorSuggestions.map((vendor) => (
                          <div
                            key={vendor.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setVendorSearch(vendor.phonenumber);
                              setVendorName(vendor.name);
                              setShowVendorSuggestions(false);
                              setAllowNameEdit(false);
                              setFilters((prev) => ({ ...prev, vendorId: `${vendor.id}` }));
                            }}
                          >
                            <div className="font-medium text-sm">{vendor.name}</div>
                            <div className="text-xs text-gray-500">{vendor.phonenumber}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="p-2 border rounded text-sm w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="p-2 border rounded text-sm w-full"
              />
            </div>

            {/* Submit + Clear Buttons */}
            <div className="flex gap-2 col-span-full md:col-span-1 items-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 w-full transition-colors disabled:bg-blue-300"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-100 w-full transition-colors"
              >
                Clear All
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-blue-100/75 border-b border-blue-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {expenses.map((exp) => (
                <tr
                  key={exp.id}
                  className="hover:bg-blue-50/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${exp.entrytype
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {exp.entrytype ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 max-w-[200px] truncate hover:text-clip">
                    {exp.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                      {exp.category.name}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-semibold ${exp.entrytype ? 'text-green-600' : 'text-red-600'
                    }`}>
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <span className="mr-2 text-blue-500">
                        {exp.paymentMethod === 0 ? (
                          <i className="ri-money-dollar-circle-line" />
                        ) : (
                          <i className="ri-bank-card-line" />
                        )}
                      </span>
                      {paymentMethodMap[exp.paymentMethod]}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {new Date(exp.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setVendorSearch(exp.vendor.phonenumber);
                          setVendorName(exp.vendor.name);
                          setEditingExpense(exp);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                      >
                        <PencilSquareIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                        Edit
                      </button>

                      {/* Optional Delete Button */}
                      {/* <button
      onClick={() => handleDelete(exp.id)}
      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-150"
    >
      <TrashIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
      Delete
    </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination */}
      <div className="mt-3 flex justify-between items-center text-sm">
        <div className="text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-sm"
          >
            Next
          </button>
        </div>
      </div>


      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-24 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Edit Expense</h2>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Type Field */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                        <input
                          type="radio"
                          name="entrytype"
                          value="true"
                          defaultChecked={editingExpense.entrytype}
                          className="h-4 w-4 text-indigo-600"
                        />
                        <span>Income</span>
                      </label>
                      <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                        <input
                          type="radio"
                          name="entrytype"
                          value="false"
                          defaultChecked={!editingExpense.entrytype}
                          className="h-4 w-4 text-indigo-600"
                        />
                        <span>Expense</span>
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      name="description"
                      defaultValue={editingExpense.description}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Description"
                      required
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="categoryId"
                      defaultValue={editingExpense.category.id}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vendor Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Phone</label>
                    <div className="relative">
                      <input
                        value={vendorSearch}
                        onChange={async (e) => {
                          const phone = e.target.value;
                          setVendorSearch(phone);
                          await searchVendors(phone);
                          setAllowNameEdit(false);
                        }}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Search by phone"
                        required
                      />
                      {showVendorSuggestions && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {vendorSuggestions.map((vendor) => (
                            <div
                              key={vendor.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setVendorSearch(vendor.phonenumber);
                                setVendorName(vendor.name);
                                setShowVendorSuggestions(false);
                                setAllowNameEdit(false);
                              }}
                            >
                              <div className="font-medium">{vendor.name}</div>
                              <div className="text-sm text-gray-500">{vendor.phonenumber}</div>
                            </div>
                          ))}
                          <div
                            className="px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 cursor-pointer border-t"
                            onClick={() => {
                              setAllowNameEdit(true);
                              setShowVendorSuggestions(false);
                            }}
                          >
                            Can't find vendor? Add manually
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Amount */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5">₹</span>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        defaultValue={editingExpense.amount}
                        className="w-full pl-8 p-2 border-0 bg-white rounded focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      name="paymentMethod"
                      defaultValue={editingExpense.paymentMethod}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      {Object.entries(paymentMethodMap).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vendor Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input
                      name="vendorName"
                      value={vendorName}
                      onChange={(e) => allowNameEdit && setVendorName(e.target.value)}
                      readOnly={!allowNameEdit}
                      className={`w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!allowNameEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      placeholder="Vendor name"
                      required
                    />
                    {!allowNameEdit && (
                      <p className="mt-1 text-xs text-gray-500">
                        Search by phone number first. Edit name only if vendor not found.
                      </p>
                    )}
                  </div>

                  {/* Attachment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                    <div className="relative">
                      {attachment || editingExpense?.attachment ? (
                        <div className="border border-gray-200 rounded-lg p-3">
                          {/* Existing attachment display */}
                          {editingExpense?.attachment && !attachment ? (
                            <div className="flex flex-col">
                              {editingExpense.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                <img
                                  src={`/uploads/${editingExpense.attachment}`}
                                  alt="Receipt"
                                  className="h-40 w-full object-contain mb-3"
                                />
                              ) : null}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <File className="w-5 h-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600 truncate max-w-xs">
                                    {editingExpense.attachment}
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <a
                                    href={`/uploads/${editingExpense.attachment}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                  <button
                                    type="button"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => {
                                      setEditingExpense({
                                        ...editingExpense,
                                        attachment: ''
                                      });
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* New attachment preview */
                            <div className="flex flex-col">
                              {attachment?.type.startsWith('image/') ? (
                                <img
                                  src={attachment.preview}
                                  alt="Preview"
                                  className="h-40 w-full object-contain mb-3"
                                />
                              ) : null}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <File className="w-5 h-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600 truncate max-w-xs">
                                    {attachment?.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
                                    setAttachment(null);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload className="w-6 h-6 mb-1 text-gray-500" />
                          <p className="text-sm text-gray-600 text-center">
                            <span className="font-medium text-indigo-600">Click to upload</span>
                            <span className="block text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 2MB</span>
                          </p>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && file.size <= 2 * 1024 * 1024) {
                                const fileWithPreview = file as FileWithPreview;
                                if (file.type.startsWith('image/')) {
                                  fileWithPreview.preview = URL.createObjectURL(file);
                                }
                                setAttachment(fileWithPreview);
                                setEditingExpense({
                                  ...editingExpense,
                                  attachment: ''
                                });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 bg-indigo-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${editload ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700'
                    }`}
                  disabled={editload}
                >
                  {editload ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl transform transition-all duration-300 ease-out animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <PlusCircle className="w-6 h-6 text-indigo-600" />
                  Add New Transaction
                </h2>
                <p className="text-sm text-gray-500 mt-1">Record income or expense transactions</p>
              </div>
              <button
                onClick={() => {
                  setSelectedVendor(null)
                  setVendorSearch('')
                  setShowAddModal(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Transaction Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex-1">
                        <input
                          type="radio"
                          name="entrytype"
                          value="true"
                          className="peer hidden"
                        />
                        <div className="flex flex-col items-center justify-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer transition-all peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:border-gray-300">
                          <ArrowDownCircle className="w-6 h-6 mb-1 text-green-500" />
                          <span className="font-medium">Income</span>
                        </div>
                      </label>
                      <label className="flex-1">
                        <input
                          type="radio"
                          name="entrytype"
                          value="false"
                          defaultChecked
                          className="peer hidden"
                        />
                        <div className="flex flex-col items-center justify-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer transition-all peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:border-gray-300">
                          <ArrowUpCircle className="w-6 h-6 mb-1 text-red-500" />
                          <span className="font-medium">Expense</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        name="categoryId"
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white "
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <List className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <input
                        name="description"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter description"
                        required
                      />
                      <Text className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Vendor Field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor
                      {!vendorSuggestions.length && !selectedVendor && (

                        <AddVendorModal onSuccess={(newVendor) => {
                          setSelectedVendor(newVendor);
                          setVendorSearch(`${newVendor.name} (${newVendor.phonenumber})`);
                          setShowVendorSuggestions(false);
                        }} />
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedVendor ? `${selectedVendor.name} (${selectedVendor.phonenumber})` : vendorSearch}
                        onChange={(e) => {
                          setVendorSearch(e.target.value);
                          setSelectedVendor(null);
                        }}
                        placeholder="Search by name or phone"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    {showVendorSuggestions && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {vendorSuggestions.map((vendor) => (
                          <div
                            key={vendor.id}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setVendorSearch(`${vendor.name} (${vendor.phonenumber})`);
                              setShowVendorSuggestions(false);
                            }}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{vendor.name}</div>
                              <div className="text-sm text-gray-500">{vendor.phonenumber}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Amount */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-lg font-bold text-gray-500">₹</span>
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 border-0 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="relative">
                      <select
                        name="paymentMethod"
                        defaultValue="1"
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                        required
                        onChange={(e) => setPaymentMethod(parseInt(e.target.value))}
                      >
                        {Object.entries(paymentMethodMap).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                      <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* File Attachment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachment (Receipt/Invoice)
                    </label>
                    <div className="relative">
                      {attachment ? (
                        <div className="border border-gray-200 rounded-lg p-3">
                          {attachment.type.startsWith('image/') ? (
                            <div className="flex flex-col items-center">
                              <img
                                src={attachment.preview}
                                alt="Preview"
                                className="h-40 object-contain mb-2 rounded"
                              />
                              <div className="flex items-center">
                                <span className="text-sm text-gray-600 mr-2">
                                  {attachment.name}
                                </span>
                                <button
                                  type="button"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    URL.revokeObjectURL(attachment.preview!);
                                    setAttachment(null);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <File className="w-5 h-5 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">
                                  {attachment.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setAttachment(null)}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                Click to upload
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, JPG, PNG up to 2MB
                            </p>
                          </div>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert('File size exceeds 2MB limit');
                                  return;
                                }

                                // Create preview URL for images
                                const fileWithPreview = file as FileWithPreview;
                                if (file.type.startsWith('image/')) {
                                  fileWithPreview.preview = URL.createObjectURL(file);
                                }

                                setAttachment(fileWithPreview);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transaction ID if not Cash */}
                {paymentMethod !== 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Reference
                    </label>
                    <div className="relative">
                      <input
                        name="transactionId"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter transaction reference"
                      />
                      <Hash className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )}

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="transactionDate"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>


                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVendor(null)
                      setVendorSearch('')
                      setShowAddModal(false)
                    }}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 bg-indigo-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${expenseload ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700'
                      }`}
                    disabled={expenseload}
                  >
                    {expenseload ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Add Transaction
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div >
        </div >
      )
      }

    </div >
    //</Suspense>
  );
}
