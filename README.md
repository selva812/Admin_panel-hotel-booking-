# 🏨 Hotel Booking Admin Panel

A comprehensive Next.js-based admin panel for hotel management with room booking, customer management, invoicing, and staff management capabilities.

![Next.js](https://img.shields.io/badge/Next.js-15.1.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-✓-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green?style=for-the-badge&logo=prisma)

## ✨ Features

### 🏠 Room Management

- **Dual Pricing System**: Online vs Walk-in prices for AC/Non-AC rooms
- **Real-time Status**: Available, Occupied, and Requested room statuses
- **Responsive Calendar**: Visual room availability calendar
- **Room Configuration**: AC/Non-AC pricing with tax configurations

### 📅 Booking System

- **Multi-room Booking**: Book multiple rooms under single customer
- **Customer Management**: Complete customer details and stay information
- **Check-in/Check-out**: Automated status updates
- **Booking Modal**: Comprehensive booking form with all necessary fields

### 💰 Checkout & Invoicing

- **Automated Calculations**: Tax, service charges, and total amount
- **Payment Processing**: Integrated payment handling
- **Invoice Generation**: Automatic PDF invoice generation
- **Downloadable Invoices**: Available in invoice management page

### 👥 Staff Management

- **Role-based Access**: Admin and Staff roles with different permissions
- **Admin Privileges**: Full CRUD operations (Create, Read, Update, Delete)
- **Staff Limitations**: Create-only access without edit/delete capabilities
- **User Management**: Add, edit, and manage staff accounts

### 📊 Dashboard & Analytics

- **Revenue Reports**: Financial analytics and reporting
- **Occupancy Rates**: Room occupancy statistics
- **Chart Visualizations**: Interactive charts using ApexCharts and Chart.js
- **Excel Export**: Data export capabilities

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling and responsive design
- **React Hook Form** - Form management
- **React Query** - Server state management

### Backend

- **Next.js API Routes** - Serverless functions
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Next-Auth** - Authentication system
- **Iron Session** - Session management

### Utilities

- **ExcelJS** - Excel file generation
- **jsPDF & pdfkit** - PDF generation and invoices
- **Date-fns & Day.js** - Date manipulation
- **Chart.js & Recharts** - Data visualization
- **React Toastify** - Notifications
