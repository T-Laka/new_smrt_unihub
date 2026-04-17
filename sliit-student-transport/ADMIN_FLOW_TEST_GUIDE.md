# 🧪 Complete Admin-Student Booking Flow Test Guide

## **Test Environment**
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:5174 (or 5173)
- **MongoDB:** Connected ✅

---

## **Test Credentials** 🔐
```
STUDENT ACCOUNT:
  Email: student@test.com
  Password: test123

ADMIN ACCOUNT:
  Email: admin@test.com
  Password: admin123
```

---

## **Complete Flow Test Steps** 📋

### **STEP 1: Verify Test Data Seeded** ✓
Run this command (already done):
```bash
node seedTestData.js
```

Should see:
- ✅ 1 pending arrival (student marked I Arrived)
- ✅ 1 unpaid fine (from previous no-show)

---

### **STEP 2: Student Logs In & Books Seat** 👨‍💻

#### **2A. Login as Student**
1. Navigate to: `http://localhost:5174/login`
2. Enter: `student@test.com` / `test123`
3. Click "Login"
4. **Expected:** Redirected to dashboard/home page

#### **2B. Navigate to Study Area**
1. From navbar, click "Study Area"
2. Should navigate to: `/study-area`
3. **Expected:** See grid of 70 tables × 4 seats

#### **2C. Select Time & Browse Availability**
1. Click "Select Date" → today's date
2. Click "Start Time" → "09:00"
3. Click "End Time" → "11:00"
4. Click "Browse Availability"
5. **Expected:** Grid shows available seats (light green) and booked seats (red)

#### **2D. Click Available Seat to Book**
1. Click any light green seat
2. Confirmation dialog appears
3. Click "Confirm Booking"
4. **Expected:** 
   - Booking created ✅
   - Seat turns red for others
   - Success message shown

---

### **STEP 3: Student Marks "I Arrived"** 🚪

#### **3A. See Active Booking Banner**
1. Should see banner: "Active Booking: Table X, Seat Y"
2. Shows time and status
3. **Expected:** Three buttons visible:
   - "I Arrived" 🟢
   - "Complete" 🟡
   - "Cancel" 🔴

#### **3B. Click "I Arrived" Button**
1. Click "I Arrived" button
2. **Expected:**
   - Message: "Arrival marked. Waiting for admin confirmation"
   - Button becomes disabled

---

### **STEP 4: Admin Logs In & Sees Pending Arrival** 👨‍💼

#### **4A. Logout Student & Login Admin**
1. Click user menu → "Logout"
2. Navigate to: `http://localhost:5174/login`
3. Enter: `admin@test.com` / `admin123`
4. Click "Login"
5. **Expected:** Logged in as admin

#### **4B. Navigate to Admin Dashboard**
1. From navbar (or admin menu), click "Study Area Admin" 
   - OR navigate to `/admin-study-area`
2. **Expected:** Admin dashboard loads with two tabs:
   - "Pending Arrivals" (shows 1)
   - "Fine Management" (shows 1)

#### **4C. View Pending Arrivals Tab** 📋
1. "Pending Arrivals" tab should be active
2. **Expected to see:**
   - Student name: "Test Student"
   - Student email: "student@test.com"
   - Table #: (the booked table)
   - Seat #: (the booked seat)
   - Booking Date: Today
   - Time: "09:00 – 11:00"
   - Status badge: "PENDING" (yellow)
   - Two buttons:
     - ✓ "Confirm Present" (green)
     - ✗ "No Show" (red)

---

### **STEP 5: Admin Confirms or Rejects Arrival** ⚖️

#### **TEST CASE A: Admin Confirms Student Arrived**
1. Click **"✓ Confirm Present"** button
2. **Expected:**
   - Loading state
   - Request sent to: `PUT /api/bookings/admin-confirm/:bookingId`
   - Arrival removed from pending list
   - Arrival status changed to "confirmed" in database
   - Student's booking status: "occupied"

#### **TEST CASE B: Admin Marks as No-Show** ❌
1. (Instead) Click **"✗ No Show"** button
2. **Expected:**
   - Loading state
   - Request sent to: `PUT /api/bookings/admin-no-show/:bookingId`
   - Automatically creates a FINE record
   - Fine amount: Rs. 100
   - Fine reason: "Student was not present at booked study seat"
   - Arrival removed from pending list
   - Arrival status: "no_show"
   - Fine status: "unpaid"

---

### **STEP 6: Admin Views & Manages Fines** 💰

#### **6A. Switch to Fine Management Tab**
1. Click **"Fine Management"** tab
2. **Expected to see:**
   - Card showing: "Unpaid Fines" with count badge
   - If Step 5B was done, should see 1 fine:
     - Student name: "Test Student"
     - Amount: "Rs. 100"
     - Reason: "Student was not present at booked study seat"
     - Status badge: "UNPAID" (orange/yellow)
     - Button: "Confirm Payment Received"

#### **6B. Confirm Fine Payment**
1. Click **"Confirm Payment Received"** button
2. **Expected:**
   - Loading state
   - Request sent to: `PUT /api/fines/pay/:fineId`
   - Fine status changed to "paid" in database
   - Fine disappears from unpaid list
   - Unpaid count decreases to 0

---

### **STEP 7: Student Cannot Book Until Fine Paid** 🔐

#### **7A. Logout Admin & Login Student Again**
1. Logout admin
2. Login as student
3. Navigate to `/study-area`
4. Try to book another seat
5. **Expected (if Step 5B + 6B done):**
   - Booking is blocked if fine is unpaid
   - Error message: "You have unpaid fines. Please clear them before booking"
   - (This assumes StudentDashboard checks for unpaid fines)

#### **7B. View Fine in Student Dashboard**
1. Click on "Dashboard" or profile link
2. Should see fines section showing:
   - Previous fine marked as "PAID"
   - Can now book again ✅

---

## **API Endpoints Verification** 🔌

Test these endpoints directly (using Postman/curl/browser):

### **1. Get Pending Arrivals** 📥
```
GET http://localhost:5000/api/bookings/pending-arrivals
Expected Response:
[
  {
    arrival_id: "...",
    booking_id: "...",
    student_name: "Test Student",
    student_email: "student@test.com",
    table_id: X,
    seat_number: Y,
    booking_date: "2026-04-05T00:00:00.000Z",
    start_time: "09:00",
    end_time: "11:00",
    status: "pending"
  }
]
```

### **2. Confirm Arrival by Admin** ✅
```
PUT http://localhost:5000/api/bookings/admin-confirm/:bookingId
Body: { "admin_id": "..." }
Expected Response Status: 200
Message: "Arrival confirmed successfully"
```

### **3. Mark No-Show by Admin** ❌
```
PUT http://localhost:5000/api/bookings/admin-no-show/:bookingId
Body: { "admin_id": "...", "fine_amount": 100 }
Expected Response Status: 200
Message: "Marked as no-show and fine created successfully"
```

### **4. Get Unpaid Fines** 💸
```
GET http://localhost:5000/api/fines/unpaid
Expected Response:
[
  {
    fine_id: "...",
    student_name: "Test Student",
    student_email: "student@test.com",
    amount: 100,
    reason: "Student was not present at booked study seat",
    status: "unpaid",
    created_at: "2026-04-05T..."
  }
]
```

### **5. Confirm Payment** 💳
```
PUT http://localhost:5000/api/fines/pay/:fineId
Expected Response Status: 200
Message: "Payment confirmed successfully"
```

---

## **Troubleshooting** 🔧

| Issue | Solution |
|-------|----------|
| Admin page shows no pending arrivals | Run `node seedTestData.js` to create test data |
| Button clicks don't work | Check browser console for errors; ensure backend is running |
| Fine doesn't auto-create when marking no-show | Check backend logs; ensure Fine model is imported |
| Student can still book with unpaid fine | Implement fine check in studyArea booking logic |
| "Cannot connect to API" | Verify `.env` has `MONGO_URI` and backend is on port 5000 |
| Login fails | Verify email/password matches test credentials above |

---

## **Flow Diagram** 📊

```
STUDENT VIEW:
  1. Browse seats & select time
  2. Click available seat → Book
  3. See active booking banner
  4. Click "I Arrived" → Creates pending arrival
  5. Waits for admin confirmation
  6. (If no-show) See fine in dashboard
  7. Pay fine via admin confirmation
  8. Can book again ✅

ADMIN VIEW:
  1. Login → Admin Dashboard
  2. See pending arrivals count
  3. Click "Pending Arrivals" tab
  4. Review student arrival details
  5. Option A: Click "✓ Confirm Present" → Mark occupied
     OR
     Option B: Click "✗ No Show" → Auto-create fine
  6. Switch to "Fine Management" tab
  7. Review unpaid fines
  8. Click "Confirm Payment Received" → Mark paid ✅
```

---

## **Summary of Implemented Flow** ✨

✅ **Student clicks "I Arrived"**
  → Creates ArrivalConfirmation with status='pending'

✅ **Admin sees pending arrivals**
  → Fetches from /api/bookings/pending-arrivals

✅ **Admin confirms OR marks no-show**
  → Confirm: status='confirmed', booking='occupied'
  → No-show: status='no_show', booking='completed', auto-create Fine

✅ **Fine shows in admin's Fine Management tab**
  → Fetches from /api/fines/unpaid

✅ **Admin confirms payment**
  → Updates fine status='paid'

✅ **Student cannot rebook until fine paid**
  → (To be implemented in StudentDashboard)

---

## **Next Steps** 🚀

1. ✅ Verify all endpoints working with API tests
2. ✅ Test complete UI flow as documented above
3. ⏳ Add fine payment check before allowing new bookings
4. ⏳ Add real-time notifications when fine is paid
5. ⏳ Add fine history to student dashboard

---

**Last Updated:** April 5, 2026
**Test Data Status:** ✅ Ready
**Backend Status:** ✅ Running on 5000
**Frontend Status:** ✅ Running on 5174
