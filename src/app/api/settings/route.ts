import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET all settings
export async function GET() {
  try {
    const [purposes, bookingTypes, extraBeds, taxes, hotelInfo, bookingPrefixes, invoicePrefixes] = await Promise.all([
      prisma.purposeOfVisit.findMany(),
      prisma.bookingType.findMany(),
      prisma.extraBed.findMany(),
      prisma.tax.findMany(),
      prisma.hotel_info.findFirst(),
      prisma.bookingprefix.findMany(),
      prisma.invoiceprefix.findMany()
    ])

    return NextResponse.json({
      purposes,
      bookingTypes,
      extraBeds,
      taxes,
      hotelInfo,
      bookingPrefixes,
      invoicePrefixes
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { purposes, bookingTypes, extraBeds, taxes, hotelInfo, bookingPrefixes, invoicePrefixes } = body

    // Update all settings in a transaction
    const results = await prisma.$transaction([
      // Purposes
      ...purposes.map((purpose: { id: any; name: any }) =>
        prisma.purposeOfVisit.upsert({
          where: { id: purpose.id || -1 },
          update: { name: purpose.name },
          create: { name: purpose.name }
        })
      ),
      // Booking types
      ...bookingTypes.map((type: { id: any; name: any }) =>
        prisma.bookingType.upsert({
          where: { id: type.id || -1 },
          update: { name: type.name },
          create: { name: type.name }
        })
      ),
      // Extra beds
      ...extraBeds.map((bed: { id: any; price: any }) =>
        prisma.extraBed.upsert({
          where: { id: bed.id || -1 },
          update: { price: bed.price },
          create: { price: bed.price }
        })
      ),
      // Taxes
      ...taxes.map((tax: { id: any; name: any; percentage: any }) =>
        prisma.tax.upsert({
          where: { id: tax.id || -1 },
          update: { name: tax.name, percentage: tax.percentage },
          create: { name: tax.name, percentage: tax.percentage }
        })
      ),
      // Hotel info
      prisma.hotel_info.upsert({
        where: { id: hotelInfo.id || -1 },
        update: {
          name: hotelInfo.name,
          contact: hotelInfo.contact,
          address: hotelInfo.address,
          logo: hotelInfo.logo,
          gst: hotelInfo.gst
        },
        create: {
          name: hotelInfo.name,
          contact: hotelInfo.contact,
          address: hotelInfo.address,
          logo: hotelInfo.logo,
          gst: hotelInfo.gst
        }
      }),
      // Booking prefixes
      ...bookingPrefixes.map((prefix: { id: any; prefix: any; number: any; status: any }) =>
        prisma.bookingprefix.upsert({
          where: { id: prefix.id || -1 },
          update: { prefix: prefix.prefix, number: prefix.number, status: prefix.status },
          create: { prefix: prefix.prefix, number: prefix.number, status: prefix.status }
        })
      ),
      // Invoice prefixes
      ...invoicePrefixes.map((prefix: { id: any; name: any; prefix: any; number: any; status: any }) =>
        prisma.invoiceprefix.upsert({
          where: { id: prefix.id || -1 },
          update: { prefix: prefix.prefix, number: prefix.number, status: prefix.status },
          create: { prefix: prefix.prefix, number: prefix.number, status: prefix.status, name: prefix.name }
        })
      )
    ])

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
