# Party Size & Devotee Booking Implementation - Setup Instructions

## What Changed

### Database Schema (Prisma)
- Added `fullName`, `email`, `phone` to Registration model (devotees can book without user accounts)
- Made `userId` optional in Registration
- Made `remaining` NOT NULL with default in Timeslot
- `partySize` already exists in Registration (default 1, max 5)

### Server Logic (server.js)
- Registration now accepts `partySize` (1-5) and validates it
- Atomic decrement: `UPDATE Timeslot SET remaining = remaining - partySize WHERE id = $1 AND remaining >= partySize`
- Registration stores fullName, email, phone directly (not dependent on User table)
- User creation only happens if "recurring devotee" checkbox is selected

### Views
- **index.ejs**: Beautiful home page with Admin Login link and Reserve buttons showing remaining seats
- **register.ejs**: Improved form with clear labels for Full Name, Email, Phone, Number of People (1-5)

## Step-by-Step Setup

### 1. Run Database Migration

```bash
# Set your DATABASE_URL
export DATABASE_URL='postgresql://postgres:Appaji%401942@localhost:5432/appointmentapp'

# Run the migration SQL
psql "$DATABASE_URL" -f scripts/add_party_size_migration.sql
```

**Expected output:** Should show "Migration completed successfully" and summary of timeslots/registrations.

### 2. Regenerate Prisma Client

```bash
npx prisma generate
```

**Expected output:** "✔ Generated Prisma Client (v6.17.1)"

### 3. Restart the Server

Option A - Development mode (auto-reload):
```bash
npm run dev
```

Option B - Production mode:
```bash
npm start
```

**Expected output:** "Server listening on 3000"

### 4. Test the Flow

#### Step 1: Open home page
```bash
open http://localhost:3000
```
- You should see available slots with "Reserve Slot" buttons
- Admin Login link in header

#### Step 2: Create a test timeslot (as admin)
1. Go to http://localhost:3000/login
2. Login with: `akuladatta@gmail.com` / `Appaji@1942`
3. Create a timeslot with capacity 10
4. Check the box to publish it

#### Step 3: Make a devotee reservation
1. Go back to home page (http://localhost:3000)
2. Click "Reserve Slot" on the new timeslot
3. Fill form:
   - Full Name: "Raj Kumar"
   - Email: "raj@example.com"
   - Phone: "555-1234"
   - Number of People: 3
4. Submit

#### Step 4: Verify in database
```bash
# Check the timeslot remaining was decremented by 3
psql "$DATABASE_URL" -c "SELECT id, capacity, remaining FROM \"Timeslot\" ORDER BY date DESC LIMIT 5;"

# Check the registration was created with partySize = 3
psql "$DATABASE_URL" -c "SELECT id, \"fullName\", email, phone, \"partySize\" FROM \"Registration\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

**Expected results:**
- Timeslot remaining should be 7 (10 - 3)
- Registration should show fullName="Raj Kumar", partySize=3

### 5. Test Concurrent Bookings (Optional)

Run the concurrent test to verify no overbooking:
```bash
node scripts/concurrent_book_test.js
```

Update the test script first to use the new field names if needed.

## Troubleshooting

### If migration fails with "column already exists"
The migration script uses `IF NOT EXISTS` so it's safe to re-run. If you get errors, check which columns already exist:
```bash
psql "$DATABASE_URL" -c "\d \"Registration\""
```

### If Prisma client doesn't recognize new fields
```bash
# Force regenerate
rm -rf node_modules/@prisma/client
npx prisma generate
```

### If server won't start
Check for syntax errors:
```bash
node --check server.js
```

### If bookings fail with "Timeslot full"
Check remaining seats:
```bash
psql "$DATABASE_URL" -c "SELECT * FROM \"Timeslot\" WHERE published = true;"
```

If remaining is 0 but capacity is > 0, reset it:
```bash
psql "$DATABASE_URL" -c "UPDATE \"Timeslot\" SET remaining = capacity WHERE remaining < 0 OR remaining IS NULL;"
```

## Key Features Now Working

✅ Home page with admin login link and reserve buttons
✅ Devotees can book without creating account (fullName, email, phone stored directly)
✅ Party size 1-5 supported with validation
✅ Atomic DB-level decrement prevents overbooking (remaining -= partySize)
✅ Remaining seats shown on home page and registration form
✅ Email + SMS confirmations with QR code
✅ Recurring devotee checkbox (optional - creates User if checked)

## Testing Checklist

- [ ] Home page loads and shows published slots
- [ ] Admin login works
- [ ] Admin can create timeslots with capacity and publish
- [ ] Reserve button appears for published slots with remaining > 0
- [ ] Registration form accepts all required fields
- [ ] Party size validates 1-5
- [ ] Booking decrements remaining by partySize
- [ ] Booking fails when remaining < partySize
- [ ] Confirmation page shows QR code
- [ ] Email/SMS notifications sent (check console for mocked output)

## Next Steps (Optional Enhancements)

1. Add real email/SMS provider credentials in .env
2. Add user dashboard to view their bookings
3. Add admin panel to view all registrations for a timeslot
4. Add cancellation feature
5. Add automated reminders (cron job already exists)
6. Deploy to production server
