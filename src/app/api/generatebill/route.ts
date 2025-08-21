// app/api/generate-bill/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

// Types based on your Prisma schema
interface BillData {
  id: number
  invoiceId?: string
  bookingId: number
  totalAmount: number
  createdAt: Date
  booking: {
    id: number
    bookingref: string
    customerId: number
    date: Date
    arriveFrom?: string
    customer: {
      id: number
      name: string
      company?: string
      address?: string
      phone?: string
      gstin?: string
    }
    bookedRooms: {
      id: number
      roomId: number
      checkIn: Date
      checkOut: Date
      bookedPrice: number
      tax?: number
      extraBeds: number
      extraBedPrice?: number
      room: {
        roomNumber: string
        type: {
          name: string
        }
      }
      occupancies: {
        name: string
        address?: string
        phone?: string
      }[]
    }[]
  }
  payments: {
    id: number
    amount: number
    method: number // 0-cash, 1-card, 2-online
    date: Date
    isadvance: boolean
    transactionid?: string
  }[]
}

interface HotelInfo {
  name: string
  address: string
  gstin: string
  phone: string[]
}

const HOTEL_INFO: HotelInfo = {
  name: 'HOTEL NAME',
  address: "NO : 61/A2, PERIAPALAYAM ROAD, JANAPANCHATRAM\n'X' ROAD, AZHINJIVAKKAM, CHENNAI-600 067.",
  gstin: '33ADVFS3315G1ZY',
  phone: ['044-27984004', '044-27984005']
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB')
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function calculateStayDays(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays || 1
}

function numberToWords(num: number): string {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
  const teens = [
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN'
  ]
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
  const hundreds = ['', 'HUNDRED', 'THOUSAND', 'LAKH', 'CRORE']

  if (num === 0) return 'ZERO'

  function convertHundreds(n: number): string {
    let result = ''
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' HUNDRED '
      n %= 100
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' '
      n %= 10
    } else if (n >= 10) {
      result += teens[n - 10] + ' '
      return result
    }
    if (n > 0) {
      result += ones[n] + ' '
    }
    return result
  }

  let result = ''
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + 'CRORE '
    num %= 10000000
  }
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + 'LAKH '
    num %= 100000
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'THOUSAND '
    num %= 1000
  }
  if (num > 0) {
    result += convertHundreds(num)
  }

  return result.trim() + ' ONLY'
}

function generateBillPDF(billData: BillData): Buffer {
  const doc = new jsPDF()

  // Set font
  doc.setFont('helvetica')

  // Page margins and dimensions
  const pageWidth = doc.internal.pageSize.width
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // Helper function to wrap text
  function wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const testWidth = doc.getTextWidth(testLine)

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  // Header with border
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(HOTEL_INFO.name, margin, 20)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const addressLines = HOTEL_INFO.address.split('\n')
  let yPos = 30
  addressLines.forEach(line => {
    doc.text(line, margin, yPos)
    yPos += 5
  })

  doc.text(`GSTIN: ${HOTEL_INFO.gstin}`, margin, yPos)
  yPos += 5
  doc.text(`${HOTEL_INFO.phone.join(', ')}`, margin, yPos)

  // Header border
  yPos += 8
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // Customer info section
  yPos += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')

  // Left column - Customer info
  let leftColY = yPos
  doc.text(`Bill NO: ${billData.invoiceId || billData.id}`, margin, leftColY)
  leftColY += 6
  doc.text(`NAME: ${billData.booking.customer.name}`, margin, leftColY)
  leftColY += 6

  if (billData.booking.customer.company) {
    const companyLines = wrapText(`COMPANY NAME: ${billData.booking.customer.company}`, 80)
    companyLines.forEach(line => {
      doc.text(line, margin, leftColY)
      leftColY += 6
    })
  }

  if (billData.booking.customer.address) {
    const addressLines = wrapText(`ADDRESS: ${billData.booking.customer.address}`, 80)
    addressLines.forEach(line => {
      doc.text(line, margin, leftColY)
      leftColY += 6
    })
  }

  if (billData.booking.customer.gstin) {
    doc.text(`GSTIN NO: ${billData.booking.customer.gstin}`, margin, leftColY)
    leftColY += 6
  }

  // Right column - Dates and times
  const mainBookingRoom = billData.booking.bookedRooms[0]
  if (mainBookingRoom) {
    const rightColX = 120
    let rightColY = yPos
    doc.text(`ARR.DATE: ${formatDate(mainBookingRoom.checkIn)}`, rightColX, rightColY)
    rightColY += 6
    doc.text(`ARR.TIME: ${formatTime(mainBookingRoom.checkIn)}`, rightColX, rightColY)
    rightColY += 6
    doc.text(`DEP.DATE: ${formatDate(mainBookingRoom.checkOut)}`, rightColX, rightColY)
    rightColY += 6
    doc.text(`DEP.TIME: ${formatTime(mainBookingRoom.checkOut)}`, rightColX, rightColY)
  }

  // Room summary
  yPos = Math.max(leftColY, yPos + 30) + 8
  const totalDays = mainBookingRoom ? calculateStayDays(mainBookingRoom.checkIn, mainBookingRoom.checkOut) : 1
  const totalRooms = billData.booking.bookedRooms.length
  const totalPersons = billData.booking.bookedRooms.reduce((acc, room) => acc + room.occupancies.length, 0)

  doc.text(`PERSON: ${totalPersons}`, margin, yPos)
  doc.text(`${totalDays} Days`, 120, yPos)
  doc.text(`Rooms: ${totalRooms}`, 120, yPos + 6)

  // Table header with borders
  yPos += 20
  const tableStartY = yPos
  const col1X = margin
  const col2X = margin + 25
  const col3X = margin + 120
  const col4X = pageWidth - margin - 30

  // Draw table header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Rooms', col1X + 2, yPos + 4)
  doc.text('PARTICULARS', col2X + 2, yPos + 4)
  doc.text('Amount Rs.', col4X + 2, yPos + 4)

  // Header border
  doc.rect(col1X, yPos - 2, 25, 8)
  doc.rect(col2X, yPos - 2, 95, 8)
  doc.rect(col3X, yPos - 2, pageWidth - margin - col3X, 8)

  yPos += 8

  // Table content
  doc.setFont('helvetica', 'normal')

  billData.booking.bookedRooms.forEach((room, index) => {
    const roomStartY = yPos

    // Room number (spans multiple rows)
    doc.text(room.room.roomNumber, col1X + 2, yPos + 4)

    // Room tariff row
    doc.text('ROOM TARIFF', col2X + 2, yPos + 4)
    doc.text(room.bookedPrice.toFixed(2), col4X + 2, yPos + 4)
    yPos += 8

    // Tax calculations
    const cgst = room.bookedPrice * 0.06
    const sgst = room.bookedPrice * 0.06

    doc.text('CGST 6%', col2X + 2, yPos + 4)
    doc.text(cgst.toFixed(2), col4X + 2, yPos + 4)
    yPos += 8

    doc.text('SGST 6%', col2X + 2, yPos + 4)
    doc.text(sgst.toFixed(2), col4X + 2, yPos + 4)
    yPos += 8

    // Extra bed if applicable
    if (room.extraBeds > 0 && room.extraBedPrice) {
      doc.text(`EXTRA BED (${room.extraBeds})`, col2X + 2, yPos + 4)
      doc.text(room.extraBedPrice.toFixed(2), col4X + 2, yPos + 4)
      yPos += 8
    } else {
      doc.text('EXTRA BED', col2X + 2, yPos + 4)
      doc.text('0.00', col4X + 2, yPos + 4)
      yPos += 8
    }

    // Room total
    const roomTotal = room.bookedPrice + cgst + sgst + (room.extraBedPrice || 0)
    doc.setFont('helvetica', 'bold')
    doc.text('ROOM TOTAL', col2X + 2, yPos + 4)
    doc.text(roomTotal.toFixed(2), col4X + 2, yPos + 4)
    doc.setFont('helvetica', 'normal')
    yPos += 8

    // Draw room section border
    const roomHeight = yPos - roomStartY
    doc.rect(col1X, roomStartY, 25, roomHeight)
    doc.rect(col2X, roomStartY, 95, roomHeight)
    doc.rect(col3X, roomStartY, pageWidth - margin - col3X, roomHeight)

    yPos += 2 // Small gap between rooms
  })

  // Grand total row
  doc.setFont('helvetica', 'bold')
  doc.rect(col1X, yPos, pageWidth - margin - col1X, 8)
  doc.text('TOTAL', col2X + 2, yPos + 5)
  doc.text(billData.totalAmount.toFixed(2), col4X + 2, yPos + 5)
  yPos += 10

  // Amount in words
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const amountWords = `RUPEES ${numberToWords(Math.round(billData.totalAmount))}`
  const wordLines = wrapText(amountWords, contentWidth)
  wordLines.forEach(line => {
    doc.text(line, margin, yPos)
    yPos += 5
  })

  // Payment details with border
  yPos += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')

  const totalAdvance = billData.payments.filter(p => p.isadvance).reduce((sum, p) => sum + p.amount, 0)

  const balance = billData.totalAmount - totalAdvance

  doc.text(`ADVANCE: ${totalAdvance.toFixed(2)}`, margin, yPos)
  doc.text(`BALANCE: ${balance.toFixed(2)}`, margin, yPos + 8)

  // Separator line
  yPos += 20
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // Footer notes
  yPos += 8
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Note:', margin, yPos)
  doc.text('1. Checkout Time 24 Hours Format', margin, yPos + 8)
  doc.text('2. GST as Applicable.', margin, yPos + 16)
  doc.text('3. Tariff Subject to Change Without notice', margin, yPos + 24)

  // Signature lines with borders
  yPos += 40
  doc.setFontSize(8)
  doc.text('GUEST SIGNATURE', margin, yPos)
  doc.text('RECEPTIONIST SIGNATURE', 80, yPos)
  doc.text('ADMIN', 140, yPos)

  // Signature boxes
  doc.rect(margin, yPos + 5, 50, 15)
  doc.rect(80, yPos + 5, 50, 15)
  doc.rect(140, yPos + 5, 40, 15)

  // Final message
  yPos += 30
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('*** KINDLY RETURN YOUR ROOM KEYS ***', margin, yPos)
  doc.text('"THANK YOU VISIT AGAIN"', margin, yPos + 8)

  return Buffer.from(doc.output('arraybuffer'))
}

export async function POST(request: NextRequest) {
  try {
    const billData: BillData = await request.json()

    // Validate required fields
    if (!billData.booking || !billData.booking.customer) {
      return NextResponse.json({ error: 'Invalid bill data: missing booking or customer information' }, { status: 400 })
    }

    // Generate PDF
    const pdfBuffer = generateBillPDF(billData)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bill-${billData.invoiceId || billData.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

// GET endpoint for testing with sample data
export async function GET() {
  const sampleBillData: BillData = {
    id: 1246,
    invoiceId: '1246',
    bookingId: 1,
    totalAmount: 1799.84,
    createdAt: new Date(),
    booking: {
      id: 1,
      bookingref: 'BK001',
      customerId: 1,
      date: new Date('2025-03-07'),
      arriveFrom: 'MADURAI',
      customer: {
        id: 1,
        name: 'SHIVA. M.',
        company: 'AUTOMATION SOLUTIONS',
        address: '51/A T P K ROAD, SUBRAMANIYAPURAM, MADURAI -625011',
        phone: '9876543210',
        gstin: '33ADVFS3315G1ZY'
      },
      bookedRooms: [
        {
          id: 1,
          roomId: 203,
          checkIn: new Date('2025-03-07T07:08:00'),
          checkOut: new Date('2025-03-08T07:01:00'),
          bookedPrice: 1607.0,
          tax: 192.84,
          extraBeds: 0,
          extraBedPrice: 0,
          room: {
            roomNumber: '203',
            type: {
              name: 'Standard'
            }
          },
          occupancies: [
            {
              name: 'SHIVA. M.',
              address: '51/A T P K ROAD, SUBRAMANIYAPURAM, MADURAI -625011',
              phone: '9876543210'
            }
          ]
        },
        {
          id: 2,
          roomId: 204,
          checkIn: new Date('2025-03-07T07:08:00'),
          checkOut: new Date('2025-03-08T07:01:00'),
          bookedPrice: 1607.0,
          tax: 192.84,
          extraBeds: 0,
          extraBedPrice: 0,
          room: {
            roomNumber: '203',
            type: {
              name: 'Standard'
            }
          },
          occupancies: [
            {
              name: 'SHIVA. M.',
              address: '51/A T P K ROAD, SUBRAMANIYAPURAM, MADURAI -625011',
              phone: '9876543210'
            }
          ]
        }
      ]
    },
    payments: [
      {
        id: 1,
        amount: 1800.0,
        method: 0, // cash
        date: new Date(),
        isadvance: true
        //   transactionid: null
      }
    ]
  }

  const pdfBuffer = generateBillPDF(sampleBillData)

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="sample-bill.pdf"',
      'Content-Length': pdfBuffer.length.toString()
    }
  })
}
