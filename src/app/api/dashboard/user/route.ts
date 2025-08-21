import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('📊 Starting Dashboard API fetch...')

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    console.log('🕒 Time Ranges:', { now, thirtyDaysAgo, sevenDaysAgo, startOfToday, endOfToday })

    // Wrap all promises with try/catch logging
    const [
      userCount,
      onlineUsers,
      newUsersThisMonth,
      totalBookings,
      activeBookings,
      bookingsThisMonth,
      todaysBookings,
      totalRevenue,
      monthlyRevenue,
      totalRooms,
      occupiedRooms,
      recentActivity,
      bookingTrends,
      topStaffData,
      dailyRevenue
      // roomUtilization
    ] = await Promise.all([
      prisma.user.count({ where: { status: true } }).catch(e => {
        console.error('❌ userCount error:', e)
        throw e
      }),
      prisma.user.count({ where: { isOnline: true, status: true } }).catch(e => {
        console.error('❌ onlineUsers error:', e)
        throw e
      }),
      prisma.user
        .count({
          where: { createdAt: { gte: thirtyDaysAgo }, status: true }
        })
        .catch(e => {
          console.error('❌ newUsersThisMonth error:', e)
          throw e
        }),

      prisma.booking.count({ where: { status: true } }).catch(e => {
        console.error('❌ totalBookings error:', e)
        throw e
      }),
      prisma.booking
        .count({
          where: { status: true, bookingstatus: 1, date: { gte: startOfToday } }
        })
        .catch(e => {
          console.error('❌ activeBookings error:', e)
          throw e
        }),

      prisma.booking
        .count({
          where: { createdAt: { gte: thirtyDaysAgo }, status: true }
        })
        .catch(e => {
          console.error('❌ bookingsThisMonth error:', e)
          throw e
        }),

      prisma.booking
        .count({
          where: { date: { gte: startOfToday, lte: endOfToday }, status: true }
        })
        .catch(e => {
          console.error('❌ todaysBookings error:', e)
          throw e
        }),

      prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { status: true } }).catch(e => {
        console.error('❌ totalRevenue error:', e)
        throw e
      }),

      prisma.bill
        .aggregate({
          _sum: { totalAmount: true },
          where: { createdAt: { gte: thirtyDaysAgo }, status: true }
        })
        .catch(e => {
          console.error('❌ monthlyRevenue error:', e)
          throw e
        }),

      prisma.room.count({ where: { status: true } }).catch(e => {
        console.error('❌ totalRooms error:', e)
        throw e
      }),
      prisma.bookingRoom
        .count({
          where: { checkIn: { lte: now }, checkOut: { gte: now }, isCheckedOut: false, status: true }
        })
        .catch(e => {
          console.error('❌ occupiedRooms error:', e)
          throw e
        }),

      prisma.userActivityLog
        .findMany({
          orderBy: { timestamp: 'desc' },
          take: 15,
          include: { user: { select: { name: true, role: true } } },
          where: { timestamp: { gte: sevenDaysAgo } }
        })
        .catch(e => {
          console.error('❌ recentActivity error:', e)
          throw e
        }),

      prisma.$queryRaw`
        SELECT DATE(date) as booking_date, COUNT(*) as booking_count,
        SUM(CASE WHEN bookingstatus = 1 THEN 1 ELSE 0 END) as confirmed_count
        FROM booking 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND status = true
        GROUP BY DATE(date) ORDER BY booking_date DESC
      `.catch(e => {
        console.error('❌ bookingTrends error:', e)
        throw e
      }),

      prisma.booking
        .groupBy({
          by: ['bookedById'],
          where: { bookedById: { not: null }, createdAt: { gte: thirtyDaysAgo }, status: true },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        })
        .catch(e => {
          console.error('❌ topStaff error:', e)
          throw e
        }),

      prisma.$queryRaw`
        SELECT DATE(b.createdAt) as revenue_date,
        COALESCE(SUM(bill.totalAmount), 0) as daily_revenue,
        COUNT(DISTINCT b.id) as bookings_count
        FROM booking b
        LEFT JOIN bill ON b.id = bill.bookingId
        WHERE b.createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND b.status = true
        GROUP BY DATE(b.createdAt)
        ORDER BY revenue_date DESC
      `.catch(e => {
        console.error('❌ dailyRevenue error:', e)
        throw e
      })

      // Fixed roomUtilization query with correct field names
      // prisma.$queryRaw`
      //   SELECT rt.name as room_type, COUNT(DISTINCT r.id) as total_rooms,
      //   COUNT(DISTINCT br.roomId) as occupied_rooms,
      //   ROUND((COUNT(DISTINCT br.roomId) / COUNT(DISTINCT r.id)) * 100, 2) as occupancy_rate
      //   FROM roomtype rt
      //   LEFT JOIN room r ON rt.id = r.typeId AND r.status = true
      //   LEFT JOIN bookingRoom br ON r.id = br.roomId
      //     AND br.checkIn <= NOW()
      //     AND br.checkOut >= NOW()
      //     AND br.isCheckedOut = false
      //     AND br.status = true
      //   WHERE rt.status = true
      //   GROUP BY rt.id, rt.name
      //   ORDER BY occupancy_rate DESC
      // `.catch(e => {
      //   console.error('❌ roomUtilization error:', e)
      //   return []
      // })
    ])

    console.log('✅ All DB queries executed successfully')

    // Debug topStaff data
    console.log('👥 Top staff raw data:', topStaffData)

    const topStaffWithDetails = await Promise.all(
      topStaffData.map(async staff => {
        const userDetails = await prisma.user.findUnique({
          where: { id: staff.bookedById! },
          select: { name: true, role: true }
        })
        return { ...staff, user: userDetails, bookingCount: staff._count.id }
      })
    )
    console.log('👥 Top staff with details:', topStaffWithDetails)

    const stats = {
      userCount,
      onlineUsers,
      newUsersThisMonth,
      totalBookings,
      activeBookings,
      bookingsThisMonth,
      todaysBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      recentActivity: recentActivity.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
        user: { name: log.user.name, role: log.user.role }
      })),
      bookingTrends: (bookingTrends as any[]).map(trend => ({
        date: trend.booking_date,
        bookings: Number(trend.booking_count),
        confirmed: Number(trend.confirmed_count)
      })),
      dailyRevenue: (dailyRevenue as any[]).map(day => ({
        date: day.revenue_date,
        revenue: Number(day.daily_revenue),
        bookings: Number(day.bookings_count)
      })),
      topStaff: topStaffWithDetails.filter(staff => staff.user),
      // roomUtilization: (roomUtilization as any[]).map(room => ({
      //   roomType: room.room_type,
      //   totalRooms: Number(room.total_rooms),
      //   occupiedRooms: Number(room.occupied_rooms),
      //   occupancyRate: Number(room.occupancy_rate)
      // })),
      averageBookingsPerDay: bookingsThisMonth > 0 ? Math.round(bookingsThisMonth / 30) : 0,
      revenueGrowth:
        totalRevenue._sum.totalAmount && monthlyRevenue._sum.totalAmount
          ? Math.round((Number(monthlyRevenue._sum.totalAmount) / Number(totalRevenue._sum.totalAmount)) * 100)
          : 0
    }

    console.log('✅ Final Stats Object:', stats)

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    console.error('🚨 Dashboard fetch failed:', error)
    return NextResponse.json({ message: 'Failed to fetch dashboard data', error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
