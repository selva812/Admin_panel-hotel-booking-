// lib/services/bookingService.js

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Service functions for managing bookings
 */
export const BookingService = {
  /**
   * Handles checkout process for a booking
   * @param {number} bookingId - The ID of the booking to checkout
   * @returns {Promise<Object>} - The updated booking
   */
  async checkoutBooking(bookingId) {
    try {
      // Get the current booking
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookedRooms: true,
          bill: true
        }
      })

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (!booking.activated) {
        throw new Error('Booking is not activated')
      }

      if (booking.bookingclosed) {
        throw new Error('Booking is already closed')
      }

      // Update the booking status to closed
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          bookingclosed: true,
          checkOut: new Date() // Update the checkout date to now
        }
      })

      // Update room status for all rooms in this booking
      for (const bookedRoom of booking.bookedRooms) {
        await prisma.room.update({
          where: { id: bookedRoom.roomId },
          data: {
            status: 'AVAILABLE'
          }
        })
      }

      return updatedBooking
    } catch (error) {
      console.error('Error during checkout:', error)
      throw error
    }
  },

  /**
   * Extends a booking's checkout date
   * @param {number} bookingId - The ID of the booking to extend
   * @param {Date} newCheckoutDate - The new checkout date
   * @returns {Promise<Object>} - The updated booking
   */
  async extendBooking(bookingId, newCheckoutDate) {
    try {
      // Validate the booking exists and is active
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookedRooms: true,
          bill: true
        }
      })

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (!booking.activated) {
        throw new Error('Booking is not activated')
      }

      if (booking.bookingclosed) {
        throw new Error('Booking is already closed')
      }

      // Ensure the new checkout date is after the current checkout date
      if (new Date(newCheckoutDate) <= new Date(booking.checkOut)) {
        throw new Error('New checkout date must be after the current checkout date')
      }

      // Update the booking with the new checkout date
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          checkOut: new Date(newCheckoutDate)
        }
      })

      // Calculate additional charges for extended stay
      const daysExtended = Math.ceil((new Date(newCheckoutDate) - new Date(booking.checkOut)) / (1000 * 60 * 60 * 24))

      // Add additional charges to the bill for each room
      if (booking.bill && daysExtended > 0) {
        for (const bookedRoom of booking.bookedRooms) {
          // Add room charge for extended days
          await prisma.billItem.create({
            data: {
              billId: booking.bill.id,
              bookingRoomId: bookedRoom.id,
              description: `Room extension (${daysExtended} days) - Room ${bookedRoom.roomId}`,
              quantity: daysExtended,
              price: bookedRoom.bookedPrice,
              amount: bookedRoom.bookedPrice * daysExtended,
              type: 'ROOM'
            }
          })
        }

        // Update the bill total
        const billItems = await prisma.billItem.findMany({
          where: { billId: booking.bill.id }
        })

        const totalAmount = billItems.reduce((sum, item) => sum + Number(item.amount), 0)

        await prisma.bill.update({
          where: { id: booking.bill.id },
          data: {
            totalAmount,
            balance: totalAmount - Number(booking.bill.totalPaid)
          }
        })
      }

      return updatedBooking
    } catch (error) {
      console.error('Error extending booking:', error)
      throw error
    }
  },

  /**
   * Retrieves booking statistics for a specific date range
   * @param {Date} startDate - The start date
   * @param {Date} endDate - The end date
   * @returns {Promise<Object>} - Booking statistics
   */
  async getBookingStats(startDate, endDate) {
    try {
      // Count total rooms
      const totalRooms = await prisma.room.count()

      // Get all bookings in the date range
      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            // Bookings that start within the range
            { checkIn: { gte: startDate, lte: endDate } },
            // Bookings that end within the range
            { checkOut: { gte: startDate, lte: endDate } },
            // Bookings that span the entire range
            {
              AND: [{ checkIn: { lte: startDate } }, { checkOut: { gte: endDate } }]
            }
          ],
          activated: true
        },
        include: {
          bookedRooms: true
        }
      })

      // Get all booking requests in the date range
      const requestedBookings = await prisma.requestBooking.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          status: 'PENDING'
        }
      })

      return {
        totalRooms,
        activeBookings: bookings.length,
        requestedBookings: requestedBookings.length,
        bookings,
        requestedBookings
      }
    } catch (error) {
      console.error('Error getting booking stats:', error)
      throw error
    }
  }
}

export default BookingService
