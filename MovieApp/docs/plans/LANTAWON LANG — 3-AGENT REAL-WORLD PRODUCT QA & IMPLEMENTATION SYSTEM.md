
# LANTAWON LANG — 3-AGENT REAL-WORLD PRODUCT QA & IMPLEMENTATION SYSTEM

You are operating on the existing Lantawon Lang codebase.

DO NOT redesign the entire architecture.

DO NOT repeatedly generate architecture proposals.

DO NOT start from zero.

Inspect the EXISTING implementation first, including:

- current pages
- routes
- components
- API/server logic
- Supabase integration
- existing authentication
- existing subscription implementation
- existing Plans directory
- existing admin portal
- existing user account portal
- existing guest/public portal
- current movie/series/anime features
- existing search
- existing watchlist
- existing achievements
- existing statistics
- existing support features
- existing payment flow

Your job is to evaluate and improve the CURRENT system.

==================================================

# LOCKED BUSINESS RULES

==================================================

Lantawon Lang is a WEB SYSTEM.

Production target:

- Vercel
- Supabase

Subscription packages:

SOLO
₱199/month
1 active session

PLUS
₱399/month
3 active sessions

MAX
₱599/month
5 active sessions

Important:

- Solo, Plus, Max are PACKAGE OPTIONS under the same subscription/account concept.
- Upgrading does not create a new account.
- Downgrading does not create a new account.
- User keeps:
  - achievements
  - XP
  - watch history
  - watchlist
  - favorites
  - statistics
  - account identity
  - personal data
- Users may switch devices.
- Users may lend/share the account.
- The system does NOT permanently bind a user to one physical device.
- Active session limits are enforced server-side.
- If the active session limit is exceeded, the appropriate old session is automatically logged out/revoked according to the implemented session policy.
- Manual payment verification is initially supported.
- User can change password.
- User can recover/reset password through email/support recovery flow.
- User can create support tickets.
- Admin can see basic operational usage.
- Admin should NOT need detailed movie titles watched.
- Admin should NOT see passwords.
- Business data such as package price, limits, status, and payment state must come from the database.
- Do not hardcode business values into components.

==================================================

# AGENT SYSTEM

==================================================

Operate as THREE DIFFERENT QA/IMPLEMENTATION AGENTS.

AGENT 1:
SYSTEM ADMIN

AGENT 2:
USER ACCOUNT

AGENT 3:
GUEST / PUBLIC VISITOR

Each agent has a different point of view.

Do not merge their perspectives.

Every agent must identify problems that the others may not notice.

==================================================

# AGENT 1 — SYSTEM ADMIN

==================================================

## ROLE

Act as the real person operating Lantawon Lang's back office.

You are NOT the developer.

You are NOT the end user.

You are the person responsible for:

- accounts
- subscriptions
- payments
- package management
- support
- user management
- operational analytics
- account status
- basic system management

Your priority is:

CORRECTNESS
+
EFFICIENCY
+
DATA SAFETY
+
OPERATIONAL CLARITY

==================================================

## ADMIN SCENARIO 1 — NEW USER

==================================================

A new person registers.

Simulate:

User registration
→ Account appears in Admin
→ User selects package
→ Payment submission appears
→ Admin reviews payment
→ Admin approves
→ Subscription becomes active

Check:

- Is the user easy to find?
- Is the requested package obvious?
- Is the payment amount obvious?
- Is payment status obvious?
- Is payment proof easy to inspect?
- Is approval action obvious?
- Does approval update the actual database?
- Does the user receive the correct new state?
- Is the package correctly activated?

Fix anything confusing.

==================================================

## ADMIN SCENARIO 2 — PAYMENT REJECTION

==================================================

Simulate:

User submits incorrect payment proof.

Admin:

Rejects payment.

Check:

- Does Admin have a reason field?
- Does user see that payment was rejected?
- Does subscription remain inactive?
- Can user submit another payment?
- Does duplicate payment data remain manageable?

==================================================

## ADMIN SCENARIO 3 — SOLO

==================================================

Find a Solo user.

Admin should see:

- name
- email
- account status
- subscription
- package
- payment
- current billing period
- last active
- basic usage
- support tickets
- session summary

Admin should NOT need to see:

- passwords
- private personal credentials
- detailed title-by-title watch history

==================================================

## ADMIN SCENARIO 4 — PLUS

==================================================

Find Plus account.

Check:

- leader
- current member count
- package limit
- active sessions
- subscription status
- payment status

Simulate:

Leader has:

3 active sessions.

A fourth login occurs.

Verify:

Old session gets revoked according to the configured session rule.

Admin should be able to understand what happened.

==================================================

## ADMIN SCENARIO 5 — MAX

==================================================

Find Max account.

Check:

- 5 active-session capability
- account status
- package information

Simulate:

6th active login.

Verify:

System enforces configured session limit.

Do NOT manually edit database records to make this work.

==================================================

## ADMIN SCENARIO 6 — PACKAGE UPGRADE

==================================================

User:

Solo

Requests:

Plus

Check:

- Same account
- Same user identity
- Same achievements
- Same XP
- Same watch history
- Same watchlist
- New package scheduling
- Billing period handling

Do not create duplicate user records.

==================================================

## ADMIN SCENARIO 7 — PACKAGE DOWNGRADE

==================================================

User:

Max

Requests:

Plus

Check:

- Subscription remains same account
- Package change is recorded
- Existing personal data remains
- Members are not unnecessarily deleted
- Package capacity is enforced correctly

Do not destroy personal/member data unnecessarily.

==================================================

## ADMIN SCENARIO 8 — PASSWORD SUPPORT

==================================================

User forgets password.

User sends:

"Forgot password"

support ticket.

Admin should:

- verify identity using the existing recovery process
- trigger password recovery
- NEVER see old password
- NEVER store password in a ticket
- NEVER send plaintext credentials casually

Check the actual recovery flow.

==================================================

## ADMIN SCENARIO 9 — SUPPORT

==================================================

Simulate:

User creates playback issue ticket.

Admin:

- opens ticket
- replies
- changes status
- resolves ticket

Check:

- status consistency
- user visibility
- timestamps
- messages
- attachments if implemented

==================================================

## ADMIN SCENARIO 10 — ADMIN BASIC ANALYTICS

==================================================

Admin dashboard should answer:

How many users?

How many active subscriptions?

How many Solo?

How many Plus?

How many Max?

How many pending payments?

How much approved payment volume?

How many active sessions?

How many open tickets?

Basic usage:

- total watch sessions
- total watch hours
- completed watches
- last active
- login/session activity

Admin DOES NOT need:

"John watched Movie X."

==================================================

## ADMIN SCENARIO 11 — WRONG HUMAN BEHAVIOR

==================================================

Pretend Admin is tired, busy, and processing many accounts.

Check:

- Can they accidentally approve the wrong payment?
- Can they accidentally activate the wrong account?
- Can they accidentally change a package?
- Are confirmation dialogs used for destructive actions?
- Is important information visible before action?
- Are statuses clearly differentiated?

Fix UX where needed.

==================================================

# AGENT 2 — USER ACCOUNT

==================================================

## ROLE

Act as a REAL Lantawon Lang subscriber.

Do not behave like a developer.

Assume you are:

- busy
- impatient
- sometimes confused
- using a phone or laptop
- not reading documentation
- likely to make mistakes
- potentially sharing the account with family/friends
- interested in watching, not understanding the backend

==================================================

## USER PERSONAS TO TEST

==================================================

Test all three:

PERSON A:
Solo user

PERSON B:
Plus owner who shares with friends

PERSON C:
Max owner who shares with more people

==================================================

## SCENARIO 1 — SOLO

==================================================

User:

John

Package:

Solo
₱199/month

Simulate:

Register
→ payment
→ approval
→ login
→ browse
→ search
→ watch
→ add to watchlist
→ finish something
→ gain achievement
→ check statistics
→ logout
→ login again

Check that everything persists.

==================================================

## SCENARIO 2 — SWITCH DEVICE

==================================================

John is logged in on:

Laptop

Then logs in on:

Phone

Check:

- New session is created.
- Session limit is respected.
- Old session is automatically logged out if required.
- User understands WHY they were logged out.
- No confusing "device registration" process.
- No requirement to identify whether the phone is actually theirs.

User expectation:

"I can switch devices."

==================================================

## SCENARIO 3 — LEND ACCOUNT

==================================================

John lends the account to a friend.

Friend logs in.

Check:

- System permits login according to package limits.
- Existing session behavior works.
- If capacity is exceeded, correct existing session gets logged out.
- The user receives a clear explanation.
- The system does not incorrectly delete account data.

==================================================

## SCENARIO 4 — PLUS

==================================================

John upgrades:

Solo
→ Plus

Verify:

- Same account
- Same achievements
- Same XP
- Same watch history
- Same watchlist
- Same statistics
- Same identity
- Package changes correctly

Then invite friends if member functionality exists.

==================================================

## SCENARIO 5 — PLUS SHARING

==================================================

Plus:

₱399/month

3 active sessions.

Simulate:

John
Friend A
Friend B

All active.

Then:

Friend C logs in.

Check:

- Session-limit logic
- Automatic session handling
- User-facing message
- No silent data loss
- No duplicate account creation

==================================================

## SCENARIO 6 — MAX

==================================================

Max:

₱599/month

5 active sessions.

Simulate:

5 active users/sessions.

Then sixth login.

Check:

- Session limit enforced.
- New login behavior is understandable.
- Existing session handling is consistent.
- No corruption of personal data.

==================================================

## SCENARIO 7 — UPGRADE MID-CYCLE

==================================================

John has:

Solo subscription

for one week.

Then wants:

Plus

because sharing with friends is more economical.

Check:

- Existing account remains.
- Existing achievements remain.
- Existing history remains.
- Existing watchlist remains.
- Package transition is clearly explained.
- Current billing period behavior is understandable.
- Future package activation is clear if using next-renewal activation.

User should NOT ask:

"Did I lose my account?"

==================================================

## SCENARIO 8 — DOWNGRADE

==================================================

Max:

→ Plus

Check:

- Personal data preserved.
- Package change understandable.
- Member/session restrictions explained.
- No unexpected data deletion.
- User understands when the new package becomes active.

==================================================

## SCENARIO 9 — CHANGE PASSWORD

==================================================

User:

Account
→ Security
→ Change Password

Check:

- Easy to find
- Clear validation
- Success state
- Logout/re-auth behavior if required

==================================================

## SCENARIO 10 — FORGOT PASSWORD

==================================================

User:

Forgot Password

Check:

- Email recovery works
- User knows what to do
- Reset link works
- New password can be set
- Old password is not exposed
- User can log back in

If support recovery exists:

Test:

Forgot Password
→ Support Ticket
→ Admin assistance
→ Recovery email
→ New password

==================================================

## SCENARIO 11 — SUPPORT

==================================================

User has playback problem.

Create ticket.

Check:

- category selection
- description
- status
- reply
- notification
- resolution

Do not make user search through the entire account to find support.

==================================================

## SCENARIO 12 — PAYMENT

==================================================

Pretend user has never paid before.

Check:

- price
- package
- amount
- payment instructions
- screenshot upload
- reference number
- confirmation
- pending state
- approval state

The user should ALWAYS know:

"Did I submit my payment?"

==================================================

## SCENARIO 13 — REAL-WORLD CONFUSION

==================================================

Pretend user makes mistakes:

- uploads wrong screenshot
- closes browser before upload finishes
- submits payment twice
- uses wrong reference number
- forgets password
- logs in on another laptop
- changes phone
- opens multiple tabs
- refreshes during payment
- loses network
- returns later

The system must recover gracefully.

==================================================

# AGENT 3 — GUEST

==================================================

## ROLE

Act as someone who has NEVER used Lantawon Lang.

You have no account.

You do not know:

- the architecture
- the product roadmap
- the developer
- the plans
- the database

You are judging only what appears in the browser.

==================================================

## GUEST SCENARIO 1 — FIRST IMPRESSION

==================================================

Open:

/

Ask:

"What is this website?"

"Why should I use it?"

"Can I browse for free?"

"How much does it cost?"

"What do I actually get for the subscription?"

If answers are unclear:

Fix landing-page messaging.

==================================================

## GUEST SCENARIO 2 — DISCOVERY

==================================================

Browse without signing in.

Try:

Movies
Series
Anime
Documentaries
Search
People
Studios
Where to Watch
Timelines

Check:

- navigation clarity
- search
- filtering
- detail pages
- back navigation
- loading
- empty states
- responsiveness

==================================================

## GUEST SCENARIO 3 — PRICING

==================================================

Open pricing.

A normal user must immediately understand:

Solo:
₱199/month

Plus:
₱399/month

Max:
₱599/month

And:

1 active session
3 active sessions
5 active sessions

Do NOT make the user interpret confusing technical terms.

==================================================

## GUEST SCENARIO 4 — REGISTRATION

==================================================

Pretend:

"I want Solo."

Test:

Register
→ select Solo
→ payment instructions
→ upload payment proof

Check:

- no unnecessary fields
- clear explanation
- clear confirmation
- responsive UI
- no confusing redirects

==================================================

## GUEST SCENARIO 5 — TRUST

==================================================

Pretend you are deciding:

"Should I give this website my email?"

Check:

- branding
- page consistency
- clear pricing
- clear account behavior
- payment transparency
- support availability
- privacy cues
- trustworthy UI

Fix anything that feels sketchy, inconsistent, or unfinished.

==================================================

# CROSS-AGENT REAL-WORLD SCENARIOS

==================================================

All three agents must also test these.

---

SCENARIO A — FAMILY/FRIENDS
----------------------------

Owner:

John

Package:

Plus

John
Friend A
Friend B

They use different devices.

Test:

- sessions
- login
- logout
- switching
- personal data isolation
- support
- achievements
- subscription visibility

---

SCENARIO B — ACCOUNT SHARING
-----------------------------

Someone logs into a shared account.

Exceed session capacity.

Verify:

Automatic logout/session revocation.

The user should understand:

"The account is already being used on another session."

Do not show unnecessary technical information.

---

SCENARIO C — MULTIPLE TABS
---------------------------

Same account opens multiple browser tabs.

Verify:

Authentication/session handling remains stable.

Do not unexpectedly duplicate sessions unless intended.

---

SCENARIO D — NETWORK LOSS
--------------------------

During:

login
payment upload
watching
ticket submission

simulate network interruption where feasible.

Check recovery.

---

SCENARIO E — REFRESH
---------------------

Refresh during:

- checkout
- subscription page
- profile
- watch page
- support ticket

State must not be accidentally lost.

---

SCENARIO F — BACK BUTTON
-------------------------

Use browser Back.

Verify the user doesn't get trapped in strange navigation states.

---

SCENARIO G — TABLET
--------------------

Test:

portrait
landscape

Check:

header
cards
filters
forms
modals
tables
player
account portal
admin portal

---

SCENARIO H — HIGH WIDTH
------------------------

Test:

1440px
1600px
1920px
2560px+

Do not allow:

- absurd whitespace
- stretched cards
- microscopic content
- long unreadable text lines
- broken layout

Use controlled max widths.

---

# DATABASE CROSS-CHECK

---

For every business feature inspect:

UI
↓
service/API
↓
Supabase query
↓
database
↓
RLS
↓
returned state
↓
UI

Identify hardcoded values such as:

₱199
₱399
₱599
1
3
5
subscription status
payment state
member count
account state

If these represent business data:

MOVE THEM TO SUPABASE.

Do not create duplicate tables if equivalent tables already exist.

==================================================

# SECURITY CROSS-CHECK

==================================================

Verify:

- passwords are never stored as plaintext
- passwords are never visible to Admin
- service-role keys are never exposed to browser
- RLS exists on private user-owned tables
- users cannot read other users' private information
- members cannot perform owner actions
- admin authorization is server-side
- payment approval is server-side
- subscription state is server-side
- package limits are server-side

==================================================

# ADMIN PRIVACY CROSS-CHECK

==================================================

Admin SHOULD see:

- user
- email
- package
- subscription
- payment
- payment proof
- account status
- basic usage
- active sessions
- login/logout information
- session switch count
- support tickets

Admin SHOULD NOT need:

- user's password
- private watchlist
- exact titles watched
- personal recommendations
- private member data unrelated to administration

==================================================

# REAL-USER UX CROSS-CHECK

==================================================

For every page ask:

1. What is the user trying to accomplish?
2. Is the next action obvious?
3. Is the important information visible?
4. Is the page too crowded?
5. Is anything confusing?
6. Is anything misleading?
7. Does the action actually persist?
8. Does the UI correctly reflect database state?
9. What happens if something fails?
10. What happens if the user makes a mistake?

If a normal user would struggle:

FIX IT.

==================================================

# NO HARD-CODED DEMO DATA

==================================================

Do not use fake production-looking data such as:

John Doe
random payments
fake subscriptions
fake revenue
fake ticket counts
fake active sessions

unless intentionally seeded as development data.

Production UI must come from Supabase/API/calculated data.

==================================================

# NO UNNECESSARY REFACTOR

==================================================

If existing code works:

KEEP IT.

Only modify if:

- broken
- insecure
- inconsistent
- hardcoded business logic
- duplicated
- inaccessible
- non-responsive
- causing bugs
- violating the locked requirements

==================================================

# EXECUTION ORDER

==================================================

Do not spend the entire task talking.

Execute:

1. Inspect existing implementation
2. Inspect Plans
3. Cross-check requirements
4. Identify actual gaps
5. Fix high-impact problems
6. Connect hardcoded business data to Supabase
7. Test Admin
8. Test User
9. Test Guest
10. Test responsive layouts
11. Test failure cases
12. Re-test after fixes

==================================================

# FINAL REPORT

==================================================

Do NOT return a giant architecture explanation.

Return:

# AGENT 1 — ADMIN

IMPLEMENTED
FIXED
TESTED
REMAINING

# AGENT 2 — USER

IMPLEMENTED
FIXED
TESTED
REMAINING

# AGENT 3 — GUEST

IMPLEMENTED
FIXED
TESTED
REMAINING

# DATABASE

Tables added:
Tables modified:
Hardcoded business data removed:

# SECURITY

RLS checked:
Authentication checked:
Password handling checked:
Admin authorization checked:

# RESPONSIVE QA

Tablet:
Laptop:
Desktop:
High-width:
Ultra-wide:

# FINAL REMAINING ISSUES

Only genuine remaining issues.

Do not invent issues.

Do not propose another architecture unless something fundamentally blocks implementation.

==================================================

# FINAL INSTRUCTION

==================================================

You are not here to tell me what I COULD build.

You are here to inspect what I ALREADY BUILT and make it work like a real product.

Act like:

AGENT 1:
The person running the service.

AGENT 2:
The person paying and using the service.

AGENT 3:
The person discovering the service for the first time.

Think practically.

Make decisions based on actual user behavior.

Do not over-engineer.

Do not loop through the same architecture discussion.

Inspect → implement → test → fix → retest.
