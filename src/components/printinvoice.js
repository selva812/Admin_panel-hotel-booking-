'use client'
import { useEffect, useState, useRef } from 'react'
import { FaPrint, FaDownload } from 'react-icons/fa'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

const InvoicePage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const invoiceRef = useRef(null)
  const paymentMethodMap = {
    0: 'Cash',
    1: 'Card',
    2: 'Online'
  }
  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID is required')
      setLoading(false)
      return
    }

    const fetchInvoice = async () => {
      try {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bookingId })
        })

        if (!res.ok) throw new Error('Failed to load invoice')
        const data = await res.json()
        setInvoice(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [bookingId])

  const handlePrint = () => {
    if (!invoiceRef.current) return

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const invoiceHTML = invoiceRef.current.innerHTML

    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          @media print {
            html, body {
              height: auto;
              margin: 0;
              padding: 0;
              font-family: sans-serif;
              background: white;
              overflow: hidden;
            }

            .invoice-content {
              width: 190mm;
              margin: auto;
              padding: 10mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 1px solid #000;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            table, tr, td, th {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .no-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            img {
              max-width: 100%;
              height: auto;
              page-break-inside: avoid;
            }
          }

          body {
            margin: 0;
            padding: 10mm;
            font-family: sans-serif;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="invoice-content">
          ${invoiceHTML}
        </div>
      </body>
    </html>
  `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const downloadPdf = async () => {
    if (!invoiceRef.current || !invoice) return

    try {
      // Define PDF size and margin
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth() // 210 mm
      const pdfHeight = pdf.internal.pageSize.getHeight() // 297 mm
      const margin = 10 // 10 mm margin on all sides

      // Use html2canvas to render invoice
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: -window.scrollY
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)

      // Calculate scaled image size with padding
      const contentWidth = pdfWidth - margin * 2
      const contentHeight = (canvas.height * contentWidth) / canvas.width

      // If contentHeight exceeds PDF height, consider using multi-page or scale down
      const isOverflow = contentHeight + margin * 2 > pdfHeight
      const finalHeight = isOverflow ? pdfHeight - margin * 2 : contentHeight

      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, finalHeight)
      pdf.save(`invoice-${bookingId}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('There was an error generating the PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800'></div>
        <span className='ml-3 text-xl'>Loading invoice...</span>
      </div>
    )
  }

  if (error) return <div className='text-red-500 p-8'>Error: {error}</div>
  if (!invoice) return <div className='text-gray-500 p-8'>No invoice data available.</div>

  return (
    <>
      <div className='invoice-container min-h-screen bg-white py-8 px-8 text-black text-sm font-sans'>
        {/* Back Button - Hide on print */}
        <div className='no-print flex justify-center mb-6'>
          <button
            onClick={() => router.push('/dashboards/invoices')}
            className='flex items-center border px-4 py-2 rounded shadow-sm hover:shadow transition'
          >
            <ArrowLeftIcon className='w-5 h-5 mr-2 text-gray-600' />
            <span>Back to Invoices</span>
          </button>
        </div>

        {/* Invoice Content */}
        <div className='max-w-4xl mx-auto border px-8 py-4 shadow-sm bg-white'>
          <div ref={invoiceRef} className='invoice-content'>
            {/* Header */}
            <div className='flex items-center justify-between mb-6 border-b pb-4'>
              {invoice.hotelInfo?.logo && (
                <img src={invoice.hotelInfo.logo} alt='Hotel Logo' className='w-28 h-20 object-contain' />
              )}
              <div className='text-right'>
                <h1 className='text-xl font-bold uppercase'>{invoice.hotelInfo?.name}</h1>
                <p>{invoice.hotelInfo?.address}</p>
                <p>Contact: {invoice.hotelInfo?.contact}</p>
                <p>GSTIN: {invoice.hotelInfo?.gst}</p>
              </div>
            </div>

            {/* Invoice Title */}
            <div className='text-center mb-1'>
              <h2 className='text-md font-medium border-b pb-1'>
                INVOICE
                <span className='text-xs pl-2 mt-0.5'>
                  {invoice.charges?.tax === '0.00' ? '(Without tax)' : '(With tax)'}
                </span>
              </h2>
            </div>
            {/* Customer & Booking Info */}
            <div className='grid grid-cols-2 gap-3 border p-3 mb-4 text-xs'>
              <div className='space-y-1'>
                <p className='truncate'>
                  <strong className='inline-block w-24'>Name:</strong>
                  {invoice.customer?.name}
                </p>
                <p className='truncate'>
                  <strong className='inline-block w-24'>Company:</strong>
                  {invoice.customer?.company || 'N/A'}
                </p>
                <p>
                  <strong className='inline-block w-24'>Arrival Date:</strong>
                  {invoice.bookingDetails?.checkIn?.split(' ').slice(0, 3).join(' ')}
                </p>
                <p>
                  <strong className='inline-block w-24'>Departure Date:</strong>
                  {invoice.bookingDetails?.checkOut?.split(' ').slice(0, 3).join(' ')}
                </p>
                <p>
                  <strong className='inline-block w-24'>Nights:</strong>
                  {invoice.bookingDetails?.totalNights}
                </p>
              </div>
              <div className='space-y-1'>
                <p>
                  <strong className='inline-block w-24'>Bill No:</strong>
                  MRB-{bookingId}
                </p>
                <p className='truncate'>
                  <strong className='inline-block w-24'>Phone:</strong>
                  {invoice.customer?.phone}
                </p>
                <p>
                  <strong className='inline-block w-24'>Arrival Time:</strong>
                  {invoice.bookingDetails?.checkIn?.split(' ')[3]}
                </p>
                <p>
                  <strong className='inline-block w-24'>Departure Time:</strong>
                  {invoice.bookingDetails?.checkOut?.split(' ')[3]}
                </p>
                <p>
                  <strong className='inline-block w-24'>Rooms:</strong>
                  {invoice.bookingDetails?.rooms?.length}
                </p>
              </div>
            </div>

            {/* Charges Breakdown */}
            <table className='w-full border mb-4 text-xs'>
              <thead>
                <tr className='bg-gray-100'>
                  <th className='text-left px-1 py-0.5 border'>Particulars</th>
                  <th className='text-right px-1 py-0.5 border'>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* Room Charges */}
                <tr>
                  <td className='px-1 py-0.5 border'>Room Charges ({invoice.bookingDetails?.totalNights} nights)</td>
                  <td className='px-1 py-0.5 border text-right'>{invoice.charges?.room}</td>
                </tr>

                {/* Service Charges */}
                {invoice.charges?.services?.length > 0 &&
                  invoice.charges.services.map((service, index) => (
                    <tr key={index}>
                      <td className='px-1 py-0.5 border'>{service.name}</td>
                      <td className='px-1 py-0.5 border text-right'>{service.price.toFixed(2)}</td>
                    </tr>
                  ))}

                {/* Extra Bed Charges */}
                {parseFloat(invoice.charges?.extraBeds || '0') > 0 && (
                  <tr>
                    <td className='px-1 py-0.5 border'>Extra Bed Charges</td>
                    <td className='px-1 py-0.5 border text-right'>{invoice.charges?.extraBeds}</td>
                  </tr>
                )}

                {/* GST */}
                {invoice.charges?.tax !== '0.00' && (
                  <tr>
                    <td className='px-1 py-0.5 border'>GST</td>
                    <td className='px-1 py-0.5 border text-right'>{invoice.charges?.tax}</td>
                  </tr>
                )}

                {/* Total */}
                <tr className='font-medium'>
                  <td className='px-1 py-0.5 border'>Total Amount</td>
                  <td className='px-1 py-0.5 border text-right'>₹{invoice.charges?.total}</td>
                </tr>

                {/* Total Paid */}
                <tr className='font-medium'>
                  <td className='px-1 py-0.5 border'>Total Amount Paid</td>
                  <td className='px-1 py-0.5 border text-right'>₹{invoice.charges?.totalPaid}</td>
                </tr>

                {/* Balance */}
                <tr className='font-bold'>
                  <td className='px-1 py-0.5 border'>Balance Due</td>
                  <td
                    className={`px-1 py-0.5 border text-right ${
                      parseFloat(invoice.charges?.balance || '0') > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    ₹{invoice.charges?.balance}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment History */}
            {invoice.paymentHistory?.length > 0 && (
              <div className='mb-4'>
                <h4 className='font-bold mb-2'>Payment History</h4>
                <table className='w-full border text-xs'>
                  <thead>
                    <tr className='bg-gray-100'>
                      <th className='text-left px-1 py-0.5 border'>Date</th>
                      <th className='text-left px-1 py-0.5 border'>Method</th>
                      <th className='text-right px-1 py-0.5 border'>Amount</th>
                      <th className='text-left px-1 py-0.5 border'>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.paymentHistory.map((payment, index) => (
                      <tr key={index}>
                        <td className='px-1 py-0.5 border'>{payment.date}</td>
                        <td className='px-1 py-0.5 border'> {paymentMethodMap[payment.method] || 'Unknown'}</td>
                        <td className='px-1 py-0.5 border text-right'>₹{payment.amount}</td>
                        <td className='px-1 py-0.5 border'>{payment.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Terms */}
            <div className='border p-4 mb-2'>
              <h4 className='font-bold mb-2'>Terms & Conditions</h4>
              <ul className='list-disc list-inside text-sm columns-2 gap-x-4'>
                <li>Check-out time is 12:00 PM (24 hours format)</li>
                <li>GST as applicable</li>
                <li>Tariff subject to change without prior notice</li>
                <li>Please return room keys at the time of checkout</li>
              </ul>
            </div>

            {/* Signatures */}
            <div className='flex justify-between mt-4'>
              <div className='text-center'>
                <div className='border-t w-40 mx-auto'></div>
                <p className='text-sm'>Guest Signature</p>
              </div>
              <div className='text-center'>
                <div className='border-t w-40 mx-auto'></div>
                <p className='text-sm'>Authorized Signature</p>
              </div>
            </div>

            {/* Footer */}
            <div className='text-center mt-2 text-sm'>
              <p>*** Kindly return your room keys ***</p>
              <p className='mt-1 font-bold'>"Thank You, Visit Again"</p>
            </div>
          </div>
        </div>

        {/* Print/Download Buttons - Hide on print */}
        <div className='no-print flex justify-center gap-4 mt-6'>
          <button
            onClick={handlePrint}
            className='border px-4 py-2 rounded shadow hover:shadow-md flex items-center gap-2'
          >
            <FaPrint className='text-base' />
            Print Invoice
          </button>
          <button
            onClick={downloadPdf}
            className='border px-4 py-2 rounded shadow hover:shadow-md flex items-center gap-2'
          >
            <FaDownload className='text-base' />
            Download PDF
          </button>
        </div>
      </div>
    </>
  )
}

export default InvoicePage
