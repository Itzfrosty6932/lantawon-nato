# 🧪 REAL-WORLD TEST PROTOCOL

**BEFORE TESTING**: Make sure build passes (`npm run build` ✅)

---

## TEST 1: Duplicate Prevention ✅

### Step 1A: Try signing up with existing email
1. Go to `/signup`
2. Username: `alice2`
3. Email: `setupgaming278@gmail.com` (already exists)
4. Password: `Test1234!`
5. Click "Continue to Payment"

**Expected Result:**
- ❌ Error: "Email already registered. Please log in instead."
- Do NOT proceed to payment step

### Step 1B: Try signing up with existing username
1. Go to `/signup`
2. Username: `JuanMember` (already exists)
3. Email: `alice2@test.local` (new)
4. Password: `Test1234!`
5. Click "Continue to Payment"

**Expected Result:**
- ❌ Error: "Username already taken. Choose another one."
- Do NOT proceed to payment step

---

## TEST 2: Username Persistence ✅

### Step 2: Sign up with custom username
1. Go to `/signup`
2. Username: `alice99` (unique)
3. Email: `alice99@test.local` (new)
4. Password: `Test1234!`
5. Click "Continue to Payment"
6. Enter Reference: `TEST-002`
7. Click "Submit Payment"

**Expected Results:**
- ✅ Payment submitted successfully
- ✅ User appears in admin Users tab with username `alice99` (NOT "Lantawon Viewer")
- ✅ Payment appears in admin Payments tab (status: "pending")

**Verify**: Go to `/admin` → Users → Look for `alice99` user

---

## TEST 3: Payment Blocks Streaming ✅

### Step 3: Try to watch before payment approval
1. Click "Start Watching Now" (after payment submit)
2. You should be logged in
3. Click on a movie/series
4. Click the play button

**Expected Result:**
- ⚠️ Toast: "Payment under review — streaming unlocks once an admin approves it"
- ❌ Mirrors DO NOT load
- ❌ Player shows message about pending payment
- User should NOT be able to select a server and play

---

## TEST 4: Payment Approval Unblocks Streaming ✅

### Step 4: Admin approves payment
1. Go to `/admin`
2. Click "Payments" (under Money section)
3. Click "Pending" tab (should see `alice99`'s payment)
4. Click the payment row
5. Click "Approve & Activate Subscription"
6. Should see toast: "Payment approved!"

### Step 5: User can now watch
1. Go back to the watch page
2. Click the same movie/series
3. Click play button

**Expected Result:**
- ✅ Mirrors load (blue server badges appear)
- ✅ User can select a mirror
- ✅ NO "payment under review" warning
- ✅ Video starts playing

---

## TEST 5: Duplicate Email Rejection ✅

### Step 6: Try to create second account with same email
1. Open incognito window
2. Go to `/signup`
3. Username: `bob`
4. Email: `alice99@test.local` (SAME as alice99)
5. Password: `Test1234!`
6. Click "Continue to Payment"

**Expected Result:**
- ❌ Error: "Email already registered. Please log in instead."

---

## ✅ CHECKLIST

- [ ] **Duplicate email blocked** → Can't proceed to payment
- [ ] **Duplicate username blocked** → Can't proceed to payment
- [ ] **Username persists** → Shows `alice99`, not "Lantawon Viewer"
- [ ] **Payment appears in admin** → Shows in Payments tab pending
- [ ] **Streaming blocked before approval** → Toast warning + no mirrors
- [ ] **Streaming works after approval** → Mirrors load + can play
- [ ] **Admin can approve payment** → Status changes to "approved"
- [ ] **User displays correctly** → Shows in Users tab with correct name + subscription

---

## 🚨 IF TEST FAILS

**Duplicate check not working:**
- Check `/api/auth/check-signup` is being called from signup page
- Check console for errors when clicking "Continue"
- Manually test: `curl -X POST http://localhost:3000/api/auth/check-signup -H "Content-Type: application/json" -d '{"email":"existing@gmail.com","username":"newname"}'`

**Username still shows "Lantawon Viewer":**
- Clear IndexedDB + localStorage
- Check profiles table: `SELECT display_name, username FROM profiles WHERE email='alice99@test.local';`
- Should show `alice99` in both columns
- If shows "Lantawon Viewer" — database trigger is still using wrong value

**Payment not in admin:**
- Check `payment_submissions` table: `SELECT * FROM payment_submissions WHERE status='pending' ORDER BY created_at DESC LIMIT 5;`
- If empty — payment was never inserted
- If exists — check AdminPaymentsTab query

**Can watch before approval:**
- Check stream/resolve: `GET /api/stream/resolve?id=123&type=movie`
- Should return 403 if subscription.status = "pending_payment"
- Should return 402 if subscription expired

---

## 📊 SUCCESS CRITERIA

✅ All 8 tests pass → Backend is production-ready
✅ Username displays correctly
✅ Duplicates blocked at registration
✅ Payments show in admin
✅ Streaming is blocked until approval
✅ No data corruption or orphaned accounts

---

If all pass, we're ready to ship! 🚀
