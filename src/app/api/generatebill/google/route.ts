import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

// Data extracted from the source document
const billData = {
  billNo: '1246',
  arrival: { date: '07/03/2025', time: '7:08 am' },
  departure: { date: '08/03/2025', time: '7:01 am' },
  customer: {
    name: 'SHIVA. M.',
    company: 'AUTOMATION SOLUTIONS.',
    address: ['51/A TPK ROAD.', 'SUBRAMANIYAPURAM', 'MADURAI-625011'],
    room: '203'
  },
  items: [
    { particular: 'ROOM TARIFF 203', amount: '1607.00' },
    { particular: 'CGST 6%', amount: '96.42' },
    { particular: 'SGST 6%', amount: '96.42' },
    { particular: 'EXTRA BED', amount: '0.00' }
  ],
  roomTotal: '1799.84',
  total: '1799.84',
  finalTotal: '1800.00',
  balance: '1800.00',
  gstin: '33ADVFS3315G1ZY'
}

export async function GET() {
  const doc = new jsPDF({
    orientation: 'p', // portrait
    unit: 'mm', // millimeters
    format: 'a4' // A4 page size
  })

  const leftMargin = 10
  const pageContentWidth = 190 // A4 width 210mm - 2*10mm margin
  const rightMargin = leftMargin + pageContentWidth
  let y = 10 // Y position tracker

  // ====================================================================
  // 1. HEADER IMAGE (Placeholder)
  // This is where you will add your image.
  // The code leaves 40mm of vertical space for it.
  // Example: doc.addImage(imageData, 'PNG', leftMargin, y, pageContentWidth, 40);
  // ====================================================================
  y += 40 // Reserve space for the image
  doc
    .setFont('helvetica', 'normal')
    .setFontSize(10)
    .text(`GSTIN: ${billData.gstin}`, 105, y - 8, { align: 'center' })

  // --- Draw the main border around the content ---
  // The rectangle starts after the image placeholder and ends before the page bottom.
  const borderStartY = y - 12
  const borderHeight = 265
  doc.rect(leftMargin, borderStartY, pageContentWidth, borderHeight)

  // Dashed Separator
  doc.setLineDashPattern([2, 1], 0)
  doc.line(leftMargin + 5, y, rightMargin - 5, y)
  doc.setLineDashPattern([], 0) // reset
  y += 8

  // ====================================================================
  // 2. CUSTOMER AND BILL DETAILS
  // ====================================================================
  const detailsStartY = y
  const detailsLeftCol = leftMargin + 5
  const detailsRightCol = 110

  // Left Column (Customer Info)
  doc.setFont('helvetica', 'bold').setFontSize(9)
  doc.text('NAME', detailsLeftCol, y)
  doc.text('COMPANY NAME', detailsLeftCol, y + 5)
  doc.text('ADDRESS', detailsLeftCol, y + 10)
  doc.text('Rooms', detailsLeftCol, y + 25)

  doc.setFont('helvetica', 'normal')
  doc.text(`: ${billData.customer.name}`, detailsLeftCol + 35, y)
  doc.text(`: ${billData.customer.company}`, detailsLeftCol + 35, y + 5)
  doc.text(`: ${billData.customer.address[0]}`, detailsLeftCol + 35, y + 10)
  doc.text(billData.customer.address[1], detailsLeftCol + 37, y + 15)
  doc.text(billData.customer.address[2], detailsLeftCol + 37, y + 20)
  doc.text(`: ${billData.customer.room}`, detailsLeftCol + 35, y + 25)

  // Right Column (Bill Info)
  y = detailsStartY // Reset Y for the second column
  doc.setFont('helvetica', 'bold')
  doc.text('Bill NO', detailsRightCol, y)
  doc.text('ARR.DATE', detailsRightCol, y + 5)
  doc.text('ARR.TIME', detailsRightCol, y + 10)
  doc.text('DEP.DATE', detailsRightCol, y + 15)
  doc.text('DEP.TIME', detailsRightCol, y + 20)

  doc.setFont('helvetica', 'normal')
  doc.text(`: ${billData.billNo}`, detailsRightCol + 20, y)
  doc.text(`: ${billData.arrival.date}`, detailsRightCol + 20, y + 5)
  doc.text(`: ${billData.arrival.time}`, detailsRightCol + 20, y + 10)
  doc.text(`: ${billData.departure.date}`, detailsRightCol + 20, y + 15)
  doc.text(`: ${billData.departure.time}`, detailsRightCol + 20, y + 20)

  y += 30 // Move Y past the details section

  // Dashed Separator
  doc.setLineDashPattern([2, 1], 0)
  doc.line(leftMargin + 5, y, rightMargin - 5, y)
  doc.setLineDashPattern([], 0)
  y += 8

  // ====================================================================
  // 3. BILLING TABLE
  // ====================================================================
  const tableLeftCol = leftMargin + 5
  const tableRightCol = rightMargin - 5

  // Table Header
  doc.setFont('helvetica', 'bold').setFontSize(10)
  doc.text('PARTICULARS', tableLeftCol, y)
  doc.text('Amount Rs.', tableRightCol, y, { align: 'right' })
  y += 2
  doc.line(tableLeftCol, y, tableRightCol, y) // Solid line under header
  y += 5

  // Table Body
  doc.setFont('helvetica', 'normal').setFontSize(10)
  billData.items.forEach(item => {
    doc.text(item.particular, tableLeftCol, y)
    doc.text(item.amount, tableRightCol, y, { align: 'right' })
    y += 7
  })

  // Table Footer
  y += 2
  doc.line(tableLeftCol, y, tableRightCol, y) // Line above total
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('ROOM TOTAL', tableLeftCol, y)
  doc.text(billData.roomTotal, tableRightCol, y, { align: 'right' })
  y += 5
  doc.line(tableLeftCol, y, tableRightCol, y) // Line below total
  y += 1
  doc.line(tableLeftCol, y, tableRightCol, y) // Double line
  y += 5

  // Grand Total
  doc.setFontSize(11)
  doc.text('TOTAL', tableLeftCol, y)
  doc.text(billData.total, tableRightCol, y, { align: 'right' })
  y += 15

  // ====================================================================
  // 4. TOTAL IN WORDS & BALANCE
  // ====================================================================
  doc.setFontSize(9).setFont('helvetica', 'bold')
  doc.text('RUPEES ONE THOUSAND EIGHT HUNDRED ONLY', tableLeftCol, y)

  // Final total box on the right
  doc.text('TOTAL', tableRightCol - 25, y)
  doc.text(billData.finalTotal, tableRightCol, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.text('ADVANCE', tableRightCol - 25, y + 5)
  doc.text('0.00', tableRightCol, y + 5, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.text('BALANCE', tableRightCol - 25, y + 10)
  doc.text(billData.balance, tableRightCol, y + 10, { align: 'right' })

  // ====================================================================
  // 5. FOOTER
  // ====================================================================
  y = 250 // Position footer content towards the bottom
  doc.setFont('helvetica', 'bold').setFontSize(8)
  doc.text('Note:', tableLeftCol, y)
  doc.setFont('helvetica', 'normal')
  doc.text('1. Checkout Time 24 Hours Format', tableLeftCol + 2, y + 4)
  doc.text('2. GST as Applicable.', tableLeftCol + 2, y + 8)
  doc.text('3. Tariff Subject to Change Without notice', tableLeftCol + 2, y + 12)

  // Signatures
  y = 270
  doc.setFontSize(9).setFont('helvetica', 'bold')
  doc.text('GUEST SIGNATURE', tableLeftCol, y)
  doc.text('RECEPTIONIST SIGNATURE', 105, y, { align: 'center' })
  doc.text('ADMIN', tableRightCol, y, { align: 'right' })

  // Final messages
  y = 285
  doc.text('*** KINDLY RETURN YOUR ROOM KEYS ***', 105, y, { align: 'center' })
  doc.text('"THANK YOU VISIT AGAIN"', 105, y + 5, { align: 'center' })

  // ====================================================================
  // 6. GENERATE AND SEND PDF
  // ====================================================================
  const pdfBuffer = doc.output('arraybuffer')

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      // 'Content-Disposition' can be 'inline' (view in browser) or 'attachment' (force download)
      'Content-Disposition': 'inline; filename="bill.pdf"'
    }
  })
}
