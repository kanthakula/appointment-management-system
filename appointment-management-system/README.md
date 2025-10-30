# DarshanFlow - Appointment Management System

A comprehensive, customizable appointment and check-in system designed for religious organizations, temples, churches, and cultural venues. Built with React.js frontend and Node.js backend, featuring dynamic theming, mobile-friendly check-ins, and comprehensive admin controls.

## 🌟 Features

### ✨ Core Functionality

- **Dynamic Theming**: Fully customizable branding (organization name, colors, logo)
- **Multi-Role Authentication**: Admin and visitor roles with secure JWT authentication
- **Time Slot Management**: Create, publish, and manage appointment slots with capacity control
- **Mobile Check-In**: QR code scanning and manual search for easy check-ins
- **Real-time Updates**: Live capacity tracking and booking management
- **Email & SMS Notifications**: Automated confirmations and reminders

### 🎨 Customization

- **Organization Branding**: Customize name, colors, and appearance
- **Theme Colors**: Primary, secondary, accent, background, and text colors
- **Timezone Support**: Configurable timezone settings
- **Email Whitelisting**: Restrict registrations to specific domains
- **Responsive Design**: Mobile-first, accessible interface

### 📱 User Experience

- **Guest Booking**: Visitors can book without creating accounts
- **Recurring Visitors**: Save user information for future bookings
- **Party Size Support**: Book for 1-5 people per reservation
- **QR Code Integration**: Easy check-in with generated QR codes
- **Confirmation System**: Detailed booking confirmations with QR codes

### 🔧 Admin Features

- **Comprehensive Dashboard**: Overview of slots, bookings, and check-ins
- **Time Slot Management**: Create, edit, publish/unpublish slots
- **User Management**: Create additional admin accounts
- **Settings Panel**: Configure organization settings and themes
- **Real-time Statistics**: Track bookings, capacity, and attendance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd AppointmentApp
   npm install
   ```

2. **Database Setup**

   ```bash
   # Create .env file with your database URL
   echo "DATABASE_URL=postgresql://username:password@localhost:5432/appointmentapp" > .env

   # Run migrations and seed data
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Start the Application**

   ```bash
   # Build React frontend
   npm run build

   # Start the server
   npm start
   ```

4. **Access the Application**
   - **Main Site**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/admin
   - **Default Admin Login**:
     - Email: `admin@darshanflow.com`
     - Password: `admin123`

## 🏗️ Architecture

### Frontend (React.js)

- **Modern React**: Functional components with hooks
- **Routing**: React Router for navigation
- **State Management**: Context API for theme and auth
- **Build Tool**: Vite for fast development and building
- **Styling**: CSS-in-JS with dynamic theming

### Backend (Node.js + Express)

- **API-First**: RESTful API endpoints
- **Authentication**: JWT-based with secure cookies
- **Database**: PostgreSQL with Prisma ORM
- **File Structure**: Modular route organization
- **Security**: Password hashing, input validation

### Database Schema

- **Users**: Admin and visitor accounts
- **Timeslots**: Appointment slots with capacity
- **Registrations**: Booking records with check-in status
- **OrganizationConfig**: Dynamic theming and settings

## 📋 API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Configuration

- `GET /api/config/theme` - Get organization theme
- `PUT /api/config/theme` - Update theme (admin only)

### Time Slots

- `GET /api/timeslots` - Get published slots
- `GET /api/timeslots/:id` - Get specific slot
- `POST /api/admin/timeslots` - Create slot (admin only)
- `PUT /api/admin/timeslots/:id/publish` - Publish/unpublish (admin only)

### Registration

- `POST /api/register/:timeslotId` - Book appointment
- `POST /api/checkin/qr` - Check-in via QR code
- `POST /api/checkin/search` - Check-in via search

### Admin

- `GET /api/admin/timeslots` - Get all slots (admin only)
- `GET /api/admin/stats` - Get dashboard statistics (admin only)

## 🎨 Customization Guide

### Organization Settings

1. Login as admin
2. Navigate to Settings tab
3. Update organization name, colors, and timezone
4. Configure email whitelist if needed
5. Save changes

### Theme Colors

- **Primary**: Main brand color (headers, buttons)
- **Secondary**: Accent color (success actions)
- **Accent**: Highlight color (alerts, highlights)
- **Background**: Page background color
- **Text**: Main text color

### Adding New Features

1. **Frontend**: Add components in `src/components/`
2. **Backend**: Add routes in `server.js`
3. **Database**: Update schema in `prisma/schema.prisma`
4. **Migration**: Run `npx prisma migrate dev`

## 🔒 Security Features

- **Password Hashing**: Secure password storage with salt
- **JWT Authentication**: Stateless authentication tokens
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **CORS Configuration**: Controlled cross-origin requests
- **Email Whitelisting**: Optional domain restriction

## 📱 Mobile Support

- **Responsive Design**: Works on all device sizes
- **Touch-Friendly**: Large buttons and touch targets
- **QR Code Scanning**: Mobile-optimized check-in interface
- **Offline Capability**: Basic functionality works offline
- **Progressive Web App**: Can be installed on mobile devices

## 🚀 Deployment

### Production Setup

1. **Environment Variables**

   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db
   JWT_SECRET=your-secret-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   PORT=3000
   ```

2. **Database Migration**

   ```bash
   npx prisma migrate deploy
   ```

3. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- **Reporting System**: Daily, monthly, yearly analytics
- **Advanced Notifications**: SMS integration with Twilio
- **Recurring Schedules**: Auto-publish recurring time slots
- **Multi-language Support**: Internationalization
- **Advanced Analytics**: Detailed reporting and insights
- **API Documentation**: Swagger/OpenAPI documentation
- **Mobile App**: Native mobile applications
- **Integration**: Calendar sync, payment processing

---

**DarshanFlow** - Streamlining spiritual appointments with modern technology ✨
