// types/reports.ts
export interface DailyReportStatistics {
    totalBookings: number;
    checkIns: number;
    checkOuts: number;
    currentStays: number;
    totalRevenue: number;
    averageRevenuePerBooking: number;
    occupancyRate: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
}

export interface BookingDetail {
    id: number;
    customerName: string;
    phoneNumber: string;
    companyName: string;
    checkIn: string;
    checkOut: string;
    purpose: string;
    bookingType: string;
    reference: string;
    roomNumbers: string;
    totalRooms: number;
    totalAmount: number;
    amountPaid: number;
    balance: number;
    status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
    occupancy: number;
    extras: {
        extraBeds: number;
    };
}

export interface ServiceDetail {
    name: string;
    price: number;
}

export interface PaymentMethodBreakdown {
    CASH: number;
    CARD: number;
    ONLINE: number;
    cashCount: number;
    cardCount: number;
    onlineCount: number;
}

export interface DailyReport {
    date: string;
    statistics: DailyReportStatistics;
    bookings: BookingDetail[];
    services: ServiceDetail[];
    paymentMethods: PaymentMethodBreakdown;
}

// Additional utility types that might be useful for the frontend
export type BookingStatusType = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface DateRangeFilter {
    startDate: Date;
    endDate: Date;
}

export interface ReportFilter {
    dateRange?: DateRangeFilter;
    bookingType?: string;
    bookingStatus?: BookingStatusType;
}
