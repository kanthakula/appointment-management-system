# DarshanFlow - Appointment Management System

A production-ready appointment, booking, and check‑in platform for organizations (temples, churches, venues). It includes a modern React frontend, an Express/Prisma backend, robust RBAC, timezone-aware slot management, cron jobs for auto-publish/auto-archive, and configurable organization settings.

## 🌟 Features

### ✨ Core Functionality

- **Dynamic Theming**: Organization name, colors, logo, and branding
- **Multi-Role Authentication (RBAC)**: Super Admin, Admin, CheckIn User, Reporting; users can have multiple roles
- **Time Slot Management**: Create, draft, publish, archive; auto-publish options; auto-archive for past slots
- **Mobile Check-In**: Manual search and QR scanning for quick attendance
- **Stats & Activity**: Admin dashboard tiles, recent bookings, recent check-ins
- **Timezone-Aware Logic**: All comparisons use configured organization timezone
- **Configurable Limits**: Maximum attendees per booking (`maxAttendees`)

### 🎨 Customization

- **Organization Branding**: Name, colors, logo
- **Theme Colors**: Primary, secondary, accent, background, text
- **Timezone**: Single source of truth used by backend logic and UI
- **Email Whitelist**: Optional domain restriction for registrations
- **Max Attendees**: Per‑booking cap enforced server- and client-side
- **Responsive UI**: Mobile-first, accessible interface

### 📱 User Experience

- **Guest Booking**: Fast, public booking flow
- **Recurring Visitors**: Easier repeated booking with prefilled info
- **Party Size Support**: Validated against `maxAttendees`
- **QR Code Integration**: Confirmation with QR; scan at check-in
- **Confirmation System**: Clear slot details and party size

### 🔧 Admin Features

- **Dashboard**: Tiles for Slots, Published, Bookings, Check‑Ins
- **Time Slots**: Create, edit, draft/publish, archive/restore, filters
- **Archived Slots**: Restore as draft, with "Archived By" indicator (auto vs admin vs legacy)
- **User Management**: Multi-role assignment (Super Admin, Admin, CheckIn User, Reporting)
- **Settings**: Theme, timezone, allow user registration, email whitelist, max attendees, logo upload
- **Activity & Audit**: Recent actions and audit logs (where available)

---

## 🧩 Architecture

```
Vite/React (src/) ── build → dist/ ── served by Express
Context: AuthContext, ThemeContext
Components: Admin dashboard, TimeslotManagement, Bookings, ArchivedSlots, Settings, Header

Express/Node (server.js)
  • REST API under /api
  • Auth via JWT in httpOnly cookie
  • Cron jobs: auto-publish, auto-archive, reminders, startup checks
  • Static hosting for dist/

Database: PostgreSQL (Prisma)
  • Timeslot, Registration, User, Role, UserRole (M2M), OrganizationConfig
```

Key principles:

- Timezone correctness: All server comparisons use `OrganizationConfig.timezone`.
- Immutable audit trail: Archived slots record `archivedBy` as 'system' or user ID.
- Cache-busting: Frontend fetches add `_t=${Date.now()}` to avoid stale data.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm

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

## 🗂️ Codebase Overview

Frontend (`src/`):

- `pages/`: `HomePage`, `AdminDashboard`, `BookingPage`, `CheckInPage`, `LoginPage`, `RegisterPage`, `ConfirmationPage`
- `components/`: `TimeslotManagement`, `ArchivedSlotsManagement`, `AdminUserManagement`, `AuditLogs`, `SettingsPage`, `Header`, `Footer`, `Layout`, `ProtectedRoute`
- `contexts/`: `AuthContext`, `ThemeContext`
- `styles/`: global CSS

Backend:

- `server.js`: Express app, auth middleware, API routes, cron jobs, static hosting
- `prisma/schema.prisma`: models, relations, defaults
- `prisma/migrations/`: applied Prisma migrations
- `prisma/seed.js`: sample data seeding
- `scripts/`: utilities (migration helpers, PG checks)

Database models (high level):

- `User`, `Role`, `UserRole` (many-to-many), password hashing, audit fields
- `Timeslot` with `archived`, `published`, `archivedBy`, auto-publish fields
- `Registration` with `partySize`, `checkedIn`, `actualCheckInCount`
- `OrganizationConfig` with theme, timezone, flags, `maxAttendees`

## 📋 API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /logout` - Direct logout route used by header actions

### Configuration

- `GET /api/config/theme` - Get organization theme
- `PUT /api/config/theme` - Update theme (admin only)
  - Body supports: `organizationName`, colors, `timezone`, `emailWhitelist`, `allowUserRegistration`, `maxAttendees` (int)

### Time Slots

- `GET /api/timeslots` - Get published slots
- `GET /api/timeslots/:id` - Get specific slot
- `POST /api/admin/timeslots` - Create slot (admin only)
- `PUT /api/admin/timeslots/:id/publish` - Publish/unpublish (admin only)
- `PUT /api/admin/timeslots/:id` - Update slot (admin only)
- `PUT /api/admin/timeslots/:id/archive` - Archive manually; sets `archivedBy` to user ID
- `POST /api/admin/trigger-auto-archive` - Manual trigger (sets `archivedBy`='system')
- `GET /api/admin/timeslots` - Admin list; supports `archived=true|false`, `archivedBy=system|admin`
- `GET /api/admin/timeslots/archived` - Archived listing for UI

### Registration

- `POST /api/register/:timeslotId` - Book appointment
- `POST /api/checkin/qr` - Check-in via QR code
- `POST /api/checkin/search` - Check-in via search
- `POST /api/registrations` - Public booking endpoint (alternate), enforces `maxAttendees`

### Admin

- `GET /api/admin/timeslots` - Get all slots (admin only)
- `GET /api/admin/stats` - Get dashboard statistics (admin only)
- `GET /api/admin/recent-activity` - Recent activity for dashboard
- `GET /api/admin/audit-logs` - Audit log stream (if enabled)
- `GET /api/admin/users` `POST /api/admin/users` `PUT /api/admin/users/:id` - User management with multi-role payloads

### Response Conventions

- Errors are JSON with `{ error: string }`.
- Auth-required endpoints use secure cookies with JWT (`token`).

---

## 🔐 Roles & Permissions (RBAC)

Roles (users can have multiple):

- **Super Admin**: Full access; manage admins; system settings; all actions
- **Admin**: Manage slots, bookings; manage CheckIn/Reporting roles
- **CheckIn User**: Access bookings/check-in tools only
- **Reporting**: Read-only reporting (future expansion)

Frontend checks derive from `AuthContext` using multi-role arrays. Backend enforces with middleware and endpoint-specific checks.

---

## 🕒 Timezone & Date/Time Handling

- The single source of truth for timezone is `OrganizationConfig.timezone` (e.g., `America/Chicago`).
- Helper function `isPastDateInUserTimezone(date, start)` compares slot date+start against "now" in org timezone.
- Publishing rules:
  - Cannot publish a slot whose date/time is in the past (relative to org timezone).
  - Restoring an archived past slot returns it to Draft; cannot be published until moved to a future date/time.
- Auto-archive:
  - Startup check and cron job archive any past slots, set `published=false`, `archived=true`, `archivedBy='system'`.

---

## ⚙️ Background Jobs (Cron)

- Auto-archive job: archives past slots (published or not) using timezone-aware comparisons.
- Auto-publish job: publishes slots based on configured auto-publish settings (scheduled datetime or hours-before).
- Reminder job: placeholder/job to send reminders (if enabled externally).
- Startup check: on server boot, archives any already-past published slots.

Jobs log to the server console with detailed traces for debugging.

---

## 🧭 Frontend Highlights

- `TimeslotManagement.jsx`:

  - Prevents publishing past-dated slots (button disabled with tooltip)
  - Filters: status filters include All, Draft, Published, Will Auto-Archive, Archived (All/Auto/Admin)
  - Cache-busted requests to avoid stale UI data

- `ArchivedSlotsManagement.jsx`:

  - Restore as Draft; clear messaging for past slots
  - "Archived By" column shows 🤖 Auto-Archived, 👤 Admin Archived, or 📁 Legacy Archived
  - Filters by archived type/date; cache-busted fetching

- `Header.jsx`:

  - Profile dropdown: Change Profile Picture, Logout, Emergency Logout
  - Uses `onMouseDown`/`stopPropagation` to ensure actions fire reliably

- `SettingsPage.jsx` and `ThemeContext.jsx`:
  - Manage theme, logo, timezone, `maxAttendees`, allow user registration, whitelist
  - `maxAttendees` is enforced in backend booking endpoints

---

## 🧪 Example Requests

Login (admin):

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"pass"}'
```

Create timeslot:

```bash
curl -i -X POST http://localhost:3000/api/admin/timeslots \
  -H 'Content-Type: application/json' --cookie "token=..." \
  -d '{"date":"2025-11-01","start":"08:05","end":"10:05","capacity":50,"published":false}'
```

Publish timeslot (will fail if past by org timezone):

```bash
curl -i -X PUT http://localhost:3000/api/admin/timeslots/<id>/publish \
  -H 'Content-Type: application/json' --cookie "token=..." \
  -d '{"publish":true}'
```

Book slot (server enforces `maxAttendees`):

```bash
curl -i -X POST http://localhost:3000/api/register/<timeslotId> \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex","email":"a@e.com","phone":"123","partySize":3}'
```

---

## 🧰 Local Development & Scripts

Common scripts:

- `npm run dev`: Vite dev for frontend (if used separately)
- `npm run build`: Build React to `dist/`
- `npm run server`: Start Express server serving `dist/`

Prisma:

- `npx prisma migrate dev` (dev migration)
- `npx prisma migrate deploy` (prod)
- `npx prisma studio` (DB viewer)

Postgres helpers: see `scripts/` (connect tests, env checks, direct migrations).

---

## 🔒 Security

- Password hashing, JWT in httpOnly cookies, input validation
- Rate limits (add via middleware if deploying internet-exposed)
- Always set strong `JWT_SECRET` and secure cookie flags in production

---

## 🚀 Deployment

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

## 🧭 Troubleshooting

1. Address already in use (EADDRINUSE: :::3000)

- A previous server is running. Kill and restart:

```bash
pkill -f "node server.js" && sleep 2 && npm run server
```

2. Max Attendees error (Prisma Int vs String)

- Ensure backend parses `maxAttendees` to integer in the settings update handler. Current code does this; if you see `Expected Int, provided String`, re-save Settings after a hard refresh.

3. Past slots still shown as Published in UI

- Perform a hard refresh; the app adds cache-busting to API calls but your browser may cache old JS bundles. Rebuild (`npm run build`) and restart the server.

4. Timezone mismatches

- Confirm `Settings → Timezone`. All validations and cron checks use this value. Publishing past slots is blocked; past published slots are auto-archived.

5. Dropdown actions not firing

- The profile menu uses `onMouseDown` and `stopPropagation()` to ensure actions (Logout, Emergency Logout, Change Profile Picture) trigger before outside-click closes the menu.

---

## 🧱 Git & Release Workflow

Initial setup:

```bash
git init -b main
git remote add origin git@github.com:<owner>/<repo>.git
```

Daily flow:

```bash
git pull --rebase origin main
git add -A
git commit -m "feat/fix: concise message"
git push -u origin main
```

Tagging a release:

```bash
git tag -a v1.0.0 -m "First stable"
git push origin v1.0.0
```

---

**DarshanFlow** — Streamlining appointments and attendance with modern technology ✨
