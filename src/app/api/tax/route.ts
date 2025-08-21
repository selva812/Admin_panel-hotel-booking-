import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taxName = searchParams.get('name')
    if (!taxName) {
      return NextResponse.json({ error: "Missing 'name' query parameter" }, { status: 400 })
    }
    const tax = await prisma.tax.findFirst({
      where: { name: taxName }
    })
    if (!tax) {
      return NextResponse.json({ error: `Tax with name '${taxName}' not found` }, { status: 404 })
    }

    // Return only the percentage value
    return NextResponse.json(tax.percentage)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
