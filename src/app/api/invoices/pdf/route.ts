import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import path from 'path'
import fs from 'fs'
const prisma = new PrismaClient()
import { parseISO } from 'date-fns'
import { check } from 'valibot'
let puppeteer: any
let chromium: any
const isVercel = !!process.env.VERCEL

if (isVercel) {
  puppeteer = require('puppeteer-core')
  chromium = require('@sparticuz/chromium')
} else {
  puppeteer = require('puppeteer')
}

// You can use your existing types/interfaces (HotelInfo, CustomerInfo, InvoiceData, etc.)
interface HotelInfo {
  name: string
  address: string
  contact: string
  gst: string
  logo?: string // Optional logo path
}

interface CustomerInfo {
  name: string
  phone: string
  company: string
  gst: string
  address: string
}

interface RoomCharge {
  roomNumber: string
  type: string
  nights: number
  price: number
}

interface ServiceCharge {
  name: string
  price: number
}

interface InvoiceData {
  hotelInfo: HotelInfo
  customer: CustomerInfo
  invoideate: Date
  bookingDetails: {
    checkIn: string
    checkOut: string
    totalNights: number
    rooms: RoomCharge[]
  }
  charges: {
    services: ServiceCharge[]
    extraBeds: string
    tax: string
    tax_percentage: string
    total: string
    totalPaid: number
    balance: string
  }
  invoiceid: string
}
const fetchInvoiceData = async (bookingId: string): Promise<InvoiceData | null> => {
  try {
    const parsedBookingId = parseInt(bookingId)
    const timeZone = 'Asia/Kolkata'

    const [booking, hotelInfo, taxes] = await Promise.all([
      prisma.booking.findUnique({
        where: { id: parsedBookingId },
        include: {
          bookedRooms: {
            include: {
              room: {
                include: {
                  type: true,
                  floor: true
                }
              }
            }
          },
          customer: true,
          user: true,
          services: true,
          payments: true,
          bill: {
            include: {
              payments: true
            }
          }
        }
      }),
      prisma.hotel_info.findFirst(),
      prisma.tax.findFirst()
    ])

    if (!booking || !hotelInfo) {
      return null
    }

    let earliestCheckIn = new Date()
    let latestCheckOut = new Date()

    if (booking.bookedRooms.length > 0) {
      earliestCheckIn = new Date(Math.min(...booking.bookedRooms.map(r => new Date(r.checkIn).getTime())))
      latestCheckOut = new Date(Math.max(...booking.bookedRooms.map(r => new Date(r.checkOut).getTime())))
    }

    const nights = Math.ceil((latestCheckOut.getTime() - earliestCheckIn.getTime()) / (1000 * 3600 * 24))

    let roomCharge = 0
    let totalTax = 0
    let extraBedCharge = 0

    const roomDetails = booking.bookedRooms.map(bookedRoom => {
      const roomPrice = parseFloat(bookedRoom.bookedPrice.toString())
      const roomTaxPerNight = parseFloat(bookedRoom.tax?.toString() || '0')
      const roomNights = Math.ceil(
        (new Date(bookedRoom.checkOut).getTime() - new Date(bookedRoom.checkIn).getTime()) / (1000 * 3600 * 24)
      )

      const roomTotal = roomPrice * roomNights
      const extraBedsTotal =
        (bookedRoom.extraBeds || 0) * parseFloat((bookedRoom.extraBedPrice || 0).toString()) * roomNights
      const roomTotalTax = roomTaxPerNight * roomNights

      // Accumulate for entire invoice
      roomCharge += roomTotal
      totalTax += roomTotalTax
      extraBedCharge += extraBedsTotal

      return {
        roomNumber: bookedRoom.room.roomNumber,
        type: bookedRoom.room.type.name,
        nights: roomNights,
        price: roomTotal // Total price for this room (price * nights)
      }
    })

    const serviceDetails = booking.services.map(service => ({
      name: service.name,
      price: parseFloat(service.price.toString())
    }))

    const serviceCharges = serviceDetails.reduce((sum, service) => sum + service.price, 0)
    const subtotal = roomCharge + serviceCharges + extraBedCharge
    const totalAmount = subtotal + totalTax

    // Calculate total paid from payments
    const totalPaid = booking.payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount.toString())
    }, 0)

    const invoiceData: InvoiceData = {
      invoiceid: booking.bill?.invoiceId || `INV-${booking.id}`,
      invoideate: booking.bill?.createdAt || new Date(),
      hotelInfo: {
        name: hotelInfo.name,
        address: hotelInfo.address,
        contact: hotelInfo.contact,
        logo: hotelInfo.logo || '',
        gst: hotelInfo.gst
      },
      customer: {
        name: booking.customer.name,
        company: booking.customer.companyName || '',
        phone: booking.customer.phoneNumber,
        gst: booking.customer.gst_no || '',
        address: booking.customer.address || ''
      },
      bookingDetails: {
        checkIn: format(toZonedTime(earliestCheckIn, timeZone), 'yyyy-MM-dd HH:mm a'),
        checkOut: format(toZonedTime(latestCheckOut, timeZone), 'yyyy-MM-dd HH:mm a'),
        rooms: roomDetails,
        totalNights: nights
      },
      charges: {
        services: serviceDetails,
        extraBeds: extraBedCharge.toFixed(2),
        tax: totalTax.toFixed(2),
        tax_percentage: taxes?.percentage?.toString() || '12',
        total: totalAmount.toFixed(2),
        totalPaid: totalPaid,
        balance: (totalAmount - totalPaid).toFixed(2)
      }
    }

    return invoiceData
  } catch (error) {
    console.error('Error fetching invoice data:', error)
    return null
  }
}
function amountToWords(amount: any): string {
  if (isNaN(amount)) return 'Zero Rupees Only'
  if (amount === 0) return 'Zero Rupees Only'

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen'
  ]
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertLessThanOneThousand(num: number): string {
    if (num === 0) return ''
    let result = ''

    if (num >= 100) {
      result += units[Math.floor(num / 100)] + ' Hundred '
      num %= 100
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' '
      num %= 10
    } else if (num >= 10) {
      result += teens[num - 10] + ' '
      num = 0
    }

    if (num > 0) {
      result += units[num] + ' '
    }

    return result.trim()
  }

  function convert(num: number): string {
    if (num === 0) return 'Zero'

    let result = ''
    const crore = Math.floor(num / 10000000)
    num %= 10000000

    const lakh = Math.floor(num / 100000)
    num %= 100000

    const thousand = Math.floor(num / 1000)
    num %= 1000

    const hundred = Math.floor(num / 100)
    num %= 100

    if (crore > 0) {
      result += convertLessThanOneThousand(crore) + ' Crore '
    }
    if (lakh > 0) {
      result += convertLessThanOneThousand(lakh) + ' Lakh '
    }
    if (thousand > 0) {
      result += convertLessThanOneThousand(thousand) + ' Thousand '
    }
    if (hundred > 0) {
      result += convertLessThanOneThousand(hundred) + ' Hundred '
    }
    if (num > 0) {
      result += convertLessThanOneThousand(num)
    }

    return result.trim()
  }

  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)

  let words = convert(rupees)
  if (words === '') words = 'Zero'
  words += ' Rupee' + (rupees === 1 ? '' : 's')

  if (paise > 0) {
    words += ' and ' + convert(paise) + ' Paise' + (paise === 1 ? '' : 's')
  }

  return words + ' Only'
}

function generateHTML(invoice: InvoiceData): string {
  // Parse check-in and check-out dates
  const parseDateTime = (datetimeStr: any) => {
    const [datePart, timePart] = datetimeStr.split(' ')
    const date = parseISO(datePart)

    // Parse 24-hour time and convert to 12-hour format
    const [hours, minutes] = timePart.split(':')
    const hourNum = parseInt(hours, 10)
    const period = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum % 12 || 12

    return {
      date: format(date, 'dd-MM-yyyy'),
      time: `${hour12}:${minutes} ${period}`
    }
  }
  const checkIn = parseDateTime(invoice.bookingDetails.checkIn)
  const checkOut = parseDateTime(invoice.bookingDetails.checkOut)
  // In your JavaScript code where you generate the HTML:
  const formatInvoiceDate = (dateString: string | number | Date) => {
    try {
      // First try native Date.toLocaleString()
      if (typeof window !== 'undefined') {
        const date = new Date(dateString)
        return date.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }

      // Fallback to date-fns for SSR or problematic environments
      return format(new Date(dateString), 'dd MMM yyyy, hh:mm a')
    } catch (error) {
      console.error('Date formatting error:', error)
      return dateString // Return original if formatting fails
    }
  }
  // Output: "14 Aug 2025, 11:45 am"
  console.log('Check-in Date:', checkIn.date, 'Time:', checkIn.time)
  console.log('Check-out Date:', checkOut.date, 'Time:', checkOut.time)
  // Generate room rows
  const roomRows = invoice.bookingDetails.rooms
    .map(
      (room, index) => `
  <tr>
    <td class="bold_text" style="padding: 10px 0 0 0;" align="center">${room.roomNumber}</td>
    <td class="bold_text" align="center" style="padding: 10px 0 0 0;">996311</td>
    <td align="center" style="padding: 10px 0 0 0;">${room.type} (${room.nights} night${room.nights > 1 ? 's' : ''})</td>
    <td class="bold_text" align="right" style="padding: 10px 2px 0 0 ;">₹${room.price.toFixed(2)}</td>
  </tr>
`
    )
    .join('')

  // Get room numbers as comma-separated string
  const roomNumbers = invoice.bookingDetails.rooms.map(room => room.roomNumber).join(', ')
  // Determine balance color
  const balanceAmount = parseFloat(invoice.charges.balance)
  const balanceColor = balanceAmount > 0 ? 'text-red-600' : balanceAmount < 0 ? 'text-green-600' : ''
  const logoPath = path.join(process.cwd(), 'public', 'images', 'maran_logo_invoice.png')
  const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' })
  const logoSrc = `data:image/png;base64,${logoBase64}`
  const totalRoomPrice = invoice.bookingDetails.rooms.reduce((sum, room) => sum + room.price, 0)

  const totalTax = parseFloat(invoice.charges.tax)
  const cgstAmount = (totalTax / 2).toFixed(2)
  const sgstAmount = (totalTax / 2).toFixed(2)
  // Calculate grand total (rooms + tax)
  const grandTotal = totalRoomPrice + totalTax
  // Tax rows with same 5-column structure
  const taxRows = `
  <tr>
    <td class="bold_text" style="padding: 10px 0 0 0;" align="center"></td>
    <td class="bold_text" align="center" style="padding: 10px 0 0 0;"></td>
    <td align="center" style="padding: 10px 0 0 0;">CGST (6%) </td>
    <td class="bold_text" align="right" style="padding: 10px 2px 0 0;">₹${cgstAmount}</td>
  </tr>
  <tr>
    <td class="bold_text" style="padding: 10px 0 0 0;" align="center"></td>
    <td class="bold_text" align="center" style="padding: 10px 0 0 0;"></td>
    <td align="center" style="padding: 10px 0 0 0;">SGST (6%) </td>
    <td class="bold_text" align="right" style="padding: 10px 2px 0 0;">₹${sgstAmount}</td>
  </tr>
`
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Intelixent Invoice</title>
    <meta name="author" content="Intelixent" />
    <style type="text/css">
        @font-face {
            font-family: 'OpenSans-Regular';
            font-style: normal;
            font-weight: normal;
            src: url({{ asset('fonts/OpenSans-Regular.ttf')
        }
        }) format('truetype');
        }

        @font-face {
            font-family: 'OpenSans-Bold';
            font-style: normal;
            font-weight: 700;
            src: url({{ asset('fonts/OpenSans-Bold.ttf')
        }
        }) format('truetype');
        }
        @page {
            size: 21cm 29.7cm;
            margin: 0mm;
        }
        * {
            font-family: OpenSans-Regular;
            font-size: 11px;
        }
        body {
            font-family: OpenSans-Bold;
            color: #000;
            width: 750px;
        }
        .invoice-container {
            border: 2px solid #000;
            margin: 10px;
            padding: 0;
            width: 726px;
        }
        /* Header section */
        .header-section {
            margin-bottom: 15px;
        }
        
        .logo-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        
        .logo-table td {
            padding: 10px;
            border: none;
            vertical-align: middle;
        }
        
        .invoice-title {
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        
        .company-address {
            font-size: 14px;
            text-align: center;
            line-height: 1.4;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
        }
        .logo_table tr>td {
            padding: 0px 10px;
        }
          .customer-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          border: 1px solid #000;
          border-bottom: 0;
          padding: 12px;
          font-size: 16px;
          line-height: 1.5;
        }
        .detail-row {
          display: flex;
          white-space: pre; /* Preserves spacing */
        }
        .detail-label {
          width: 120px; /* Fixed width for labels */
          text-align: left; /* Right-align labels */
          padding-right: 5px; /* Space before colon */
        }
        .colon {
          width: 10px; /* Fixed width for colon */
          text-align: center; /* Center the colon */
        }
        .detail-value {
          padding-left: 8px; /* Space after colon */
        }
        .table td,
        .table th {
            padding: 4px;
            border: 1px solid #000;
            font-size: 11px;
        }
        .table th {
            background-color: #F0F0F0;
            font-weight: bold;
        }
        .total_table td {
            font-size: 12px;
            font-weight: bold;
        }
        .desc_table td {
            font-size: 10px;
            padding: 2px;
        }
        .company_name {
            font-size: 16px;
            font-weight: bold;
        }
        .cus_title {
            font-size: 14px;
            font-weight: bold;
            text-decoration: underline;
        }
        .cus_name {
            font-size: 12px;
            font-weight: bold;
            color: #000;
        }
        .invno_table td {
            font-size: 11px;
        }
        .invno_table td {
            border: none;
            /* border-left: 1px solid #000;
            border-right: 1px solid #000;   */
        }
        .line_total_table td {
            font-size: 10px;
            font-weight: bold;
        }
        .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .amount-words {
            font-weight: bold;
            margin-top: 5px;
            margin-bottom: 10px;
        }
        .no-border {
            border: none;
        }
        .eoe {
            font-weight: bold;
            text-align: right;
        }

        .computer-generated {
            text-align: center;
            margin-top: 5px;
            font-size: 10px;
        }

        /* Item Design */

        .item_table {
            width: 100%;
            border-collapse: collapse;
            /* border: 1px solid #000; */
        }

        .item_table th {
            border: 1px solid #000;
            background-color: #F0F0F0;
            font-weight: bold;
            padding: 0px;
        }

        .item_table td {
            padding: 0px;
            border: none;
            /* border: 1px solid #000; */
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            font-size: 13px;
        }
        .item_table thead,
        .item_table tfoot {
            display: table;
            width: 100%;
            table-layout: fixed;
        }

        .item_table tbody {
            /* display: block; */
            display: flex;
            flex-direction: column;
            height: 340px !important;
            /* overflow-y: auto; */
            width: 100%;
        }

        .item_table tbody tr {
            display: table;
            width: 100%;
            table-layout: fixed;
        }

        .item_table tbody tr td {
            height: 10px;
        }

        .item_table tfoot {
            border-top: 1px solid #000;
        }
        .item_table .filler-row td {
            /* border: none; */
            /* height: 100% !important; */
        }
        .item_table .filler-row {
            flex-grow: 1;
        }
        .item_table .filler-row td {
            /* border: none; */

        }
        .item_table th:nth-child(1),
        .item_table td:nth-child(1) {
            width: 15%;
        }
        .item_table th:nth-child(2),
        .item_table td:nth-child(2) {
            width: 15%;
        }
        .item_table th:nth-child(3),
        .item_table td:nth-child(3) {
            width: 40%;
        }
        .item_table th:nth-child(4),
        .item_table td:nth-child(4) {
            width: 15%;
        }
        .item_table th:nth-child(5),
        .item_table td:nth-child(5) {
            width: 10%;
        }
        .item_table th:nth-child(6),
        .item_table td:nth-child(6) {
            width: 5%;
        }
        .item_table th:nth-child(7),
        .item_table td:nth-child(7) {
            width: 20%;
        }
        .text-right {
            text-align: right;
        }
        .bold_text {
            font-weight: bold;
        }
        .hsn_table td,
        .hsn_table th {
            padding: 0px 3px;
        }
        @media print {
            /* .item_table {
                page-break-inside: auto;
            }
            .item_table tr {
                page-break-inside: avoid;
                page-break-after: auto;
            } */
        }
        /* .total-row td {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
        } */
        .border-margin {
            /* padding: 10px 10px 10px 10px;
            border: 1px solid #000; */
        }

        .company-customer-details td {
            padding: 2px;
        }
    </style>
</head>

<body onload="window.print()">
  <div class="invoice-container">
        <div class="content-wrapper">
   <div class="header-section">
  <table class="logo-table" style="width: 100%; table-layout: fixed; border-collapse: collapse;">
    <tr>
      <td width="20%" style="text-align: left; vertical-align: top; padding-right: 10px;">
        <img src="${logoSrc}" style="max-height: 85px; max-width: 100%; display: block;">
      </td>
      <td width="60%" style="text-align: center; vertical-align: middle; word-wrap: break-word;">
        <div class="company-name" style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
          ${invoice.hotelInfo.name}
        </div>
       <div class="company-address" style="font-size: 12px; line-height: 1.4; max-width: 300px; margin: 0 auto;">
  ${invoice.hotelInfo.address}<br/>
  ${parseInt(invoice.charges.tax) > 0 ? `GSTIN: ${invoice.hotelInfo.gst}<br/>` : ''}
  Contact: +91 ${invoice.hotelInfo.contact}
</div>
      </td>
      <td width="20%" style="text-align: right; vertical-align: top;">
        <!-- Optional right side content -->
      </td>
    </tr>
  </table>
</div>

  <div class="customer-details">
  <div class="detail-column">
    <div class="detail-row">
      <span class="detail-label">Name</span>
      <span class="colon">:</span>
      <span class="detail-value">${invoice.customer?.name?.toUpperCase()}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Company</span>
      <span class="colon">:</span>
      <span class="detail-value">${invoice.customer?.company || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">GST No</span>
      <span class="colon">:</span>
      <span class="detail-value">${invoice.customer?.gst || '-'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Arrival Date</span>
      <span class="colon">:</span>
      <span class="detail-value">${checkIn.date}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Departure Date</span>
      <span class="colon">:</span>
      <span class="detail-value">${checkOut.date}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Nights</span>
      <span class="colon">:</span>
      <span class="detail-value">${invoice.bookingDetails?.totalNights}</span>
    </div>
  </div>
  <div class="detail-column">
    <div class="detail-row">
      <span class="detail-label">Invoice Date</span>
      <span class="colon">:</span>
      <span class="detail-value">${formatInvoiceDate(invoice.invoideate)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Bill No</span>
      <span class="colon">:</span>
      <span class="detail-value">${invoice.invoiceid}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Phone</span>
      <span class="colon">:</span>
      <span class="detail-value">${invoice.customer?.phone}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Arrival Time</span>
      <span class="colon">:</span>
      <span class="detail-value">${checkIn.time}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Departure Time</span>
      <span class="colon">:</span>
      <span class="detail-value">${checkOut.time}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Rooms</span>
      <span class="colon">:</span>
      <span class="detail-value">${invoice.bookingDetails?.rooms?.map(room => room.roomNumber).join(', ')}</span>
    </div>
  </div>
</div>
    <div class="border-margin">
        <table class="item_table" border="1">
            <thead>
                <tr>
                  <th style="font-size: 16px; font-weight: bold; padding: 4px 2px 0 0;">Room</th>
                  <th style="font-size: 16px; font-weight: bold; padding: 4px 2px 0 0;">HSN/SAC</th>
                  <th style="font-size: 16px; font-weight: bold; padding: 4px 2px 0 0;">Particulars</th>
                  <th style="font-size: 16px; font-weight: bold; padding: 4px 2px 0 0;">Taxable Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    ${roomRows}
                </tr>
                <tr>
                    ${taxRows}
                </tr>
                <tr>
                    <td colspan="1">&nbsp;</td>
                    <td colspan="1">&nbsp;</td>
                    <td colspan="1">&nbsp;</td>
                    <td colspan="1" style="padding: 0 2px 0 0;">&nbsp;</td>
                </tr>
                <tr class="filler-row">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td style="padding: 0 2px 0 0;">&nbsp;</td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="1" align="right"></td>
                    <td colspan="1" align="right"></td>
                    <td colspan="1" align="right"><b>Total (Including Tax)</b>&nbsp;</td>
                    <td align="right" class="bold_text" style="font-size:18px ; padding: 0 2px 0 0;">₹${grandTotal.toFixed(2)}&nbsp;</td>
                </tr>
                <tfoot>
        </table>
       <table class="table total_table" border="1" style="font-size: 14px;">
    <tr>
        <td width="100%" align="left">
            <div class="amount-row" style="font-size: 14px;">
                <div class="amount-words" style="font-size: 14px;">
                    Amount Chargeable (in Words)
                </div>
                <div class="eoe" style="font-size: 14px;">
                    ${amountToWords(grandTotal)}
                </div>
            </div>
            <span class="bold_text"></span><br />
        </td>
    </tr>
</table>
<div style=" padding:1rem ;">
    <div style="display: flex; gap: 8px; padding: 2px 2px 0 0; ">
      <span style="font-weight: 500; font-size: 16px;">Amount Paid:</span>
      <span style="font-size: 16px;">₹${Math.min(invoice.charges.totalPaid, grandTotal)}</span>
    </div>
    <div style="display: flex; gap: 8px;padding: 2px 2px 0 0;">
      <span style="font-weight: 700; font-size: 16px;">Balance Due:</span>
      <span style="color: #ef4444; font-size: 16px;">₹${Math.max(0, grandTotal - invoice.charges.totalPaid)}</span>
    </div>
</div>
<div style=" padding: 1rem; margin-bottom: 0.5rem; font-size: 14px;">
    <h4 style="font-weight: bold; margin-bottom: 0.5rem; font-size: 16px;">Terms & Conditions</h4>
    <ul style="list-style-type: disc; list-style-position: inside; column-count: 2; column-gap: 1rem; padding: 0; margin: 0; font-size: 14px;">
        <li>Check-out time 24 hours</li>
        <li>GST as applicable</li>
        <li>Tariff subject to change without prior notice</li>
        <li>Please return room keys at the time of checkout</li>
    </ul>
</div>

<!-- Signatures -->
<div style="display: flex; justify-content: space-between; margin-top: 1rem; font-size: 14px;">
    <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 10rem; margin-left: auto; margin-right: auto;"></div>
        <p style="font-size: 14px;">Guest Signature</p>
    </div>
    <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 10rem; margin-left: auto; margin-right: auto;"></div>
        <p style="font-size: 14px;">Authorized Signature</p>
    </div>
</div>
</div>
  </div>
  </div>
<!-- Footer -->
<div style="text-align: center; margin-top: 0.5rem; font-size: 14px;">
    <p>*** Kindly return your room keys ***</p>
    <p style="margin-top: 0.25rem; font-weight: bold; font-size: 15px;">"Thank You, Visit Again"</p>
</div>

<div class="computer-generated" style="font-size: 13px;">
    This is a computer Generated Invoice.
</div>

</body>
</html>

  `
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const invoice = await fetchInvoiceData(bookingId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 })
    }
    const htmlContent = generateHTML(invoice)
    let browser
    if (isVercel) {
      browser = await puppeteer.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: await chromium.executablePath(),
        headless: true
      })
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '40px', bottom: '60px', left: '40px', right: '40px' }
    })

    await browser.close()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceid}.pdf"`
      }
    })
  } catch (err) {
    console.error('Error generating invoice PDF:', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
