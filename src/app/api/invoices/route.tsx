import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json(
                { error: 'Booking ID is required' },
                { status: 400 }
            );
        }
        const parsedBookingId = parseInt(bookingId);
        if (isNaN(parsedBookingId)) {
            return NextResponse.json(
                { error: 'Invalid booking ID' },
                { status: 400 }
            );
        }
        const timeZone = 'Asia/Kolkata';
        const [booking, hotelInfo, taxes] = await Promise.all([
            prisma.booking.findUnique({
                where: { id: parsedBookingId },
                include: {
                    bookedRooms: {
                        include: {
                            room: {
                                include: {
                                    type: true,
                                    floor: true,
                                },
                            },
                        },

                    },
                    customer: true,
                    user: true,
                    services: true,

                    payments: true,
                    bill: {
                        include: {
                            payments: true,
                        },
                    },
                },
            }),
            prisma.hotel_info.findFirst(),
            prisma.tax.findFirst(),
        ]);

        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        if (!hotelInfo) {
            return NextResponse.json(
                { error: 'Hotel information not found' },
                { status: 500 }
            );
        }
        let earliestCheckIn = new Date();
        let latestCheckOut = new Date();

        if (booking.bookedRooms.length > 0) {
            earliestCheckIn = new Date(Math.min(...booking.bookedRooms.map(r => new Date(r.checkIn).getTime())));
            latestCheckOut = new Date(Math.max(...booking.bookedRooms.map(r => new Date(r.checkOut).getTime())));
        }

        const nights = Math.ceil(
            (latestCheckOut.getTime() - earliestCheckIn.getTime()) / (1000 * 3600 * 24)
        );

        let roomCharge = 0;
        let totalTax = 0;
        let extraBedCharge = 0;

        const roomDetails = booking.bookedRooms.map((bookedRoom) => {
            const roomPrice = parseFloat(bookedRoom.bookedPrice.toString());
            const roomTaxPerNight = parseFloat(bookedRoom.tax?.toString() || '0');
            const roomNights = Math.ceil(
                (new Date(bookedRoom.checkOut).getTime() - new Date(bookedRoom.checkIn).getTime()) / (1000 * 3600 * 24)
            );

            const roomTotal = roomPrice * roomNights;
            const extraBedsTotal = (bookedRoom.extraBeds || 0) * parseFloat((bookedRoom.extraBedPrice || 0).toString()) * roomNights;
            const roomTotalTax = roomTaxPerNight * roomNights;

            // Accumulate for entire invoice
            roomCharge += roomTotal;
            totalTax += roomTotalTax;
            extraBedCharge += extraBedsTotal;

            return {
                roomNumber: bookedRoom.room.roomNumber,
                type: bookedRoom.room.type.name,
                floor: bookedRoom.room.floor.name,
                price: roomPrice,
                tax: bookedRoom.tax, // this now includes only tax for that specific room
                taxPerNight: roomTaxPerNight,
                checkIn: format(toZonedTime(new Date(bookedRoom.checkIn), timeZone), 'dd MMM yyyy HH:mm'),
                checkOut: format(toZonedTime(new Date(bookedRoom.checkOut), timeZone), 'dd MMM yyyy HH:mm'),
                nights: roomNights,
                extraBeds: bookedRoom.extraBeds,
                extraBedPrice: bookedRoom.extraBedPrice ? parseFloat(bookedRoom.extraBedPrice.toString()) : 0,
                extraBedsTotal: extraBedsTotal.toFixed(2),
            };
        });


        const serviceDetails = booking.services.map((service) => ({
            name: service.name,
            price: parseFloat(service.price.toString()),
        }));

        const serviceCharges = serviceDetails.reduce((sum, service) => sum + service.price, 0);

        const subtotal = roomCharge + serviceCharges + extraBedCharge;
        const totalAmount = subtotal + totalTax;

        // Calculate total paid from payments
        const totalPaid = booking.payments.reduce((sum, payment) => {
            return sum + parseFloat(payment.amount.toString());
        }, 0);

        const invoiceData = {
            bookingId: booking.id,
            invoiceDate: new Date().toISOString(),
            invoiceid: booking.bill?.invoiceId,
            invoideate: booking.bill?.createdAt,
            hotelInfo: {
                name: hotelInfo.name,
                address: hotelInfo.address,
                contact: hotelInfo.contact,
                logo: hotelInfo.logo,
                gst: hotelInfo.gst
            },
            customer: {
                name: booking.customer.name,
                company: booking.customer.companyName || '',
                phone: booking.customer.phoneNumber,
                address: booking.customer.address || '',
                gst: booking.customer.gst_no || '',

            },
            bookingDetails: {
                checkIn: format(toZonedTime(earliestCheckIn, timeZone), 'dd MMM yyyy HH:mm'),
                checkOut: format(toZonedTime(latestCheckOut, timeZone), 'dd MMM yyyy HH:mm'),
                rooms: roomDetails,
                totalNights: nights,
            },
            charges: {
                room: roomCharge.toFixed(2),
                services: serviceDetails,
                extraBeds: extraBedCharge.toFixed(2),
                tax: totalTax.toFixed(2),
                subtotal: subtotal.toFixed(2),
                total: totalAmount.toFixed(2),
                totalPaid: totalPaid.toFixed(2),
                balance: (totalAmount - totalPaid).toFixed(2),
                tax_percentage: taxes?.percentage,

            },
            paymentHistory: booking.payments.map((payment) => ({
                date: format(new Date(payment.date), 'dd MMM yyyy HH:mm'),
                amount: parseFloat(payment.amount.toString()).toFixed(2),
                method: payment.method,
                note: payment.note || '',
            })),
        };

        return NextResponse.json(invoiceData, { status: 200 });
    } catch (error) {
        console.error('Invoice generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate invoice', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
