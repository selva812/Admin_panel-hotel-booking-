import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();
        if (!phone) {
            return NextResponse.json(
                { message: 'Phone number is required' },
                { status: 400 }
            );
        }
        const customer = await prisma.customer.findUnique({
            where: { phoneNumber: phone }
        });

        if (!customer) {
            return NextResponse.json(
                { message: 'Customer not found', status: false },
                { status: 200 }
            );
        }
        return NextResponse.json(
            { message: 'Customer found', customer, status: true },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error in customer check:', error);
        return NextResponse.json(
            {
                message: 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
