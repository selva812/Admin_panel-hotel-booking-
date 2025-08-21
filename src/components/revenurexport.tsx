'use client'
import { useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Download, FileText, Table, X, Eye, DollarSign, Calendar, Users, CreditCard, IndianRupee, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { TransparentLoader } from './transparent'
interface RevenueExportProps {
    startDate?: string
    endDate?: string
    customerid?: string
    roomid?: string
    bookedbyid?: string
}

interface BookingData {
    [x: string]: any
    summary: {
        netRevenue: any
        otherIncome: any
        totalIncome: any
        totalExpenses: any
        totalBookings: number
        totalRevenue: number
        totalRooms: number
        averageBookingValue: number
        paymentMethods: {
            cash: number
            card: number
            online: number
        }
    }
    bookings: Array<{
        id: number
        bookingRef: string
        date: string
        customerName: string
        customerPhone: string
        bookingType: string
        roomsCount: number
        rooms: Array<{
            roomNumber: string
            checkIn: string
            checkOut: string
            bookedPrice: number
            isAc: boolean
            adults: number
            children: number
            extraBeds: number
        }>
        totalAmount: number
        totalPaid: number
        balance: number
        payments: Array<{
            amount: number
            method: number
            date: string
            isAdvance: boolean
            transactionId?: string
            note?: string
        }>
        status: number
    }>
    dailySummary: Record<string, {
        date: string
        bookings: number
        revenue: number
        rooms: number
    }>
}

export default function RevenueExport({ startDate, endDate, customerid, roomid, bookedbyid }: RevenueExportProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [reportData, setReportData] = useState<BookingData | null>(null);

    const handleViewData = async () => {
        if (!startDate || !endDate) {
            toast.error('Please select start and end dates first');
            return;
        }

        setIsLoadingData(true);
        try {
            const params = new URLSearchParams({
                startDate: startDate,
                endDate: endDate,
                dataOnly: 'true'
            });

            // Add optional filters
            if (customerid) {
                params.append('customerId', customerid);
            }
            if (roomid) {
                params.append('roomId', roomid);
            }
            if (bookedbyid) {
                params.append('bookedById', bookedbyid);
            }

            const response = await fetch(`/api/reports/revenue/export?${params}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const result = await response.json();
            setReportData(result.data);
            setIsDataModalOpen(true);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load report data');
        } finally {
            setIsLoadingData(false);
        }
    };

    // Handle export button click
    const handleExportClick = () => {
        setIsOpen(true);
        handleViewData();
    };

    const handleDownloadPDF = () => {
        if (!reportData) return

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

        // Theme colors - Using shades of blue
        const primaryBlue = [41, 98, 255]      // Main blue
        const lightBlue = [59, 130, 246]       // Light blue
        const paleBlue = [239, 246, 255]       // Very light blue
        const darkBlue = [30, 64, 175]         // Dark blue
        const grayText = [75, 85, 99]          // Gray for text

        const pageWidth = 210
        const margin = 20
        const contentWidth = pageWidth - (margin * 2)

        // Helper function to add rupee symbol
        const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`

        let currentY = margin

        // Header with background
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
        doc.rect(0, 0, pageWidth, 35, 'F')

        // Company name
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('MARAN RESIDENCY', pageWidth / 2, 15, { align: 'center' })

        // Report title
        doc.setFontSize(14)
        doc.setFont('helvetica', 'normal')
        doc.text('Revenue Report', pageWidth / 2, 25, { align: 'center' })

        currentY = 45

        // Period info with background
        doc.setFillColor(paleBlue[0], paleBlue[1], paleBlue[2])
        doc.rect(margin, currentY, contentWidth, 12, 'F')
        doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2])
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Report Period: ${new Date(startDate!).toLocaleDateString()} - ${new Date(endDate!).toLocaleDateString()}`,
            pageWidth / 2, currentY + 8, { align: 'center' })

        currentY += 25

        // Summary section
        doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
        doc.rect(margin, currentY, contentWidth, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('SUMMARY', margin + 5, currentY + 5.5)

        currentY += 15

        // Summary cards layout (2x2 grid)
        const cardWidth = (contentWidth - 10) / 2
        const cardHeight = 25

        const summaryData = [
            {
                label: 'Total Bookings',
                value: reportData.summary.totalBookings.toString(),
                color: lightBlue,
                description: ''
            },
            {
                label: 'Total Income',
                value: formatCurrency(reportData.summary.totalIncome + reportData.summary.otherIncome),
                color: darkBlue,
                description: `(Bookings: ${formatCurrency(reportData.summary.totalIncome)})`
            },
            {
                label: 'Total Expenses',
                value: formatCurrency(reportData.summary.totalExpenses),
                color: grayText,
                description: ''
            },
            {
                label: 'Net Revenue',
                value: formatCurrency(reportData.summary.netRevenue),
                color: primaryBlue,
                description: '(Income - Expenses)'
            }
        ];

        summaryData.forEach((item, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = margin + (col * (cardWidth + 10));
            const y = currentY + (row * (cardHeight + 5));

            // Card background
            doc.setFillColor(250, 250, 250);
            doc.rect(x, y, cardWidth, cardHeight, 'F');

            // Card border
            doc.setDrawColor(item.color[0], item.color[1], item.color[2]);
            doc.setLineWidth(0.5);
            doc.rect(x, y, cardWidth, cardHeight);

            // Label
            doc.setTextColor(grayText[0], grayText[1], grayText[2]);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(item.label, x + 5, y + 8);

            // Value
            doc.setTextColor(item.color[0], item.color[1], item.color[2]);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(item.value, x + 5, y + 18);

            // Description (small text below value)
            if (item.description) {
                doc.setTextColor(grayText[0], grayText[1], grayText[2]);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text(item.description, x + 5, y + 24);
            }
        });

        currentY += 60

        // Payment Methods section
        doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
        doc.rect(margin, currentY, contentWidth, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('PAYMENT METHODS BREAKDOWN', margin + 5, currentY + 5.5)

        currentY += 15

        const pmData = [
            { method: 'Cash Payments', amount: reportData.summary.paymentMethods.cash },
            { method: 'Card Payments', amount: reportData.summary.paymentMethods.card },
            { method: 'Online Payments', amount: reportData.summary.paymentMethods.online }
        ]

        pmData.forEach((pm, index) => {
            const y = currentY + (index * 8)
            // Method name
            doc.setTextColor(grayText[0], grayText[1], grayText[2])
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text(`${pm.method}:`, margin + 5, y)

            // Amount
            doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
            doc.setFont('helvetica', 'bold')
            doc.text(formatCurrency(pm.amount), margin + 60, y)
        })
        currentY += 35
        // Bookings table
        doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
        doc.rect(margin, currentY, contentWidth, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('BOOKING DETAILS', margin + 5, currentY + 5.5)
        currentY += 15
        const tableData = reportData.bookings.map(booking => [
            booking.bookingRef,
            new Date(booking.date).toLocaleDateString('en-IN'),
            booking.customerName.length > 15 ? booking.customerName.substring(0, 15) + '...' : booking.customerName,
            booking.roomsCount.toString(),
            formatCurrency(booking.totalAmount),
            formatCurrency(booking.totalPaid),
            formatCurrency(booking.balance)
        ])
        autoTable(doc, {
            startY: currentY,
            head: [['Booking Ref', 'Date', 'Customer', 'Rooms', 'Amount', 'Paid', 'Balance']],
            body: tableData,
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                textColor: [50, 50, 50],
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [41, 98, 255],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 20 },  // Booking Ref
                1: { cellWidth: 20 },  // Date
                2: { cellWidth: 25 },  // Customer
                3: { cellWidth: 18, halign: 'center' },  // Rooms
                4: { cellWidth: 25, halign: 'right' },   // Amount
                5: { cellWidth: 25, halign: 'right' },   // Paid
                6: { cellWidth: 25, halign: 'right' }    // Balance
            }
        })

        // Footer on all pages
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)

            // Footer background
            doc.setFillColor(paleBlue[0], paleBlue[1], paleBlue[2])
            doc.rect(0, 285, pageWidth, 12, 'F')

            // Footer text
            doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2])
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | Maran Residency`, margin, 292)
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 292, { align: 'right' })
        }

        const filename = `Maran_Residency_Revenue_Report_${startDate}_to_${endDate}.pdf`
        doc.save(filename)
        toast.success('PDF downloaded successfully!')
    }

    return (
        <>
            <button
                onClick={handleExportClick}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <Download className="h-4 w-4" />
                Export Report
            </button>

            {isLoadingData && <TransparentLoader />}
            {/* Data View Modal */}
            <Transition show={isDataModalOpen}>
                <Dialog as="div" className="relative z-10" onClose={() => setIsDataModalOpen(false)}>
                    <Transition.Child
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                                                    Revenue Report
                                                </Dialog.Title>
                                                <p className="text-blue-100 text-sm mt-1">
                                                    {new Date(startDate!).toLocaleDateString('en-IN')} - {new Date(endDate!).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDownloadPDF}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    Download PDF
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsDataModalOpen(false);
                                                        setIsOpen(false);
                                                    }}
                                                    className="p-1 text-gray-800 hover:text-red-500 transition-colors duration-200 hover:bg-gray-100 rounded-full"
                                                >
                                                    <X className="h-6 w-6" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {reportData && (
                                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                                {/* Total Bookings Card */}
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-8 w-8 text-blue-600" />
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-blue-800">Total Bookings</p>
                                                            <p className="text-xl font-bold text-blue-900">{reportData.summary.totalBookings}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Total Income Card (Bookings + Other Income) */}
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                                    <div className="flex items-center">
                                                        <ArrowUpCircle className="h-8 w-8 text-purple-600" />
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-purple-800">Total Income</p>
                                                            <p className="text-xl font-bold text-purple-900">
                                                                ₹{(reportData.summary.totalIncome + reportData.summary.otherIncome).toLocaleString()}
                                                                <span className="block text-xs font-normal text-purple-600 mt-1">
                                                                    (Bookings: ₹{reportData.summary.totalIncome.toLocaleString()})
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Total Expenses Card */}
                                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                                    <div className="flex items-center">
                                                        <ArrowDownCircle className="h-8 w-8 text-orange-600" />
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-orange-800">Total Expenses</p>
                                                            <p className="text-xl font-bold text-orange-900">₹{reportData.summary.totalExpenses.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Net Revenue Card */}
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                                    <div className="flex items-center">
                                                        <IndianRupee className="h-8 w-8 text-green-600" />
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-green-800">Net Revenue</p>
                                                            <p className="text-xl font-bold text-green-900">₹{reportData.summary.netRevenue.toLocaleString()}</p>
                                                            <span className="block text-xs font-normal text-green-600 mt-1">
                                                                (Income - Expenses)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Methods */}
                                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                                <h4 className="font-semibold text-gray-900 mb-3">Payment Methods Breakdown</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <p className="text-sm text-gray-600">Cash</p>
                                                        <p className="text-lg font-bold text-green-600">₹{reportData.summary.paymentMethods.cash.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm text-gray-600">Card</p>
                                                        <p className="text-lg font-bold text-blue-600">₹{reportData.summary.paymentMethods.card.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm text-gray-600">Online</p>
                                                        <p className="text-lg font-bold text-purple-600">₹{reportData.summary.paymentMethods.online.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bookings Table */}
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                    <h4 className="font-semibold text-gray-900">Booking Details</h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Ref</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {reportData.bookings.map((booking, index) => (
                                                                <tr key={booking.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{booking.bookingRef}</td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(booking.date).toLocaleDateString()}</td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.customerName}</td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{booking.roomsCount}</td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">₹{booking.totalAmount.toLocaleString()}</td>

                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">₹{booking.totalPaid.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">₹{booking.balance.toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            {/* Expense table*/}
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6">
                                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                    <h4 className="font-semibold text-gray-900">Expense Details</h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {reportData.expenses.map((expense: any) => (
                                                                <tr key={expense.id}>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                        {new Date(expense.date).toLocaleDateString('en-IN')}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${expense.entrytype
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                            {expense.entrytype ? 'Income' : 'Expense'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                        <div className="group relative inline-block">
                                                                            <span className="">
                                                                                {expense.category.name}
                                                                            </span>

                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                                        {expense.description}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                        {expense.paymentMethod === 0 ? 'Cash' :
                                                                            expense.paymentMethod === 1 ? 'Card' : 'Online'}
                                                                    </td>
                                                                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${expense.entrytype ? 'text-green-600' : 'text-red-600'
                                                                        }`}>
                                                                        ₹{Number(expense.amount).toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                        {expense.recorder.name}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
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
        </>
    )
}
