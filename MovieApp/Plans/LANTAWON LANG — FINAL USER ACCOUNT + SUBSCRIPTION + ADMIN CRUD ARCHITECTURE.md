
# 1. CORE BUSINESS MODEL

Lantawon Lang has:

ONE ACCOUNT
    ↓
ONE SUBSCRIPTION
    ↓
ONE CURRENT PACKAGE

Packages:

Solo = ₱199/month
Plus = ₱399/month
Max  = ₱599/month

# 2. PACKAGE MEANING

The package determines how many PEOPLE/MEMBERS can belong to the subscription.

Solo:
1 member

Plus:
1 leader + 2 additional members
= 3 people total

Max:
1 leader + 4 additional members
= 5 people total

# 3. IMPORTANT DISTINCTION

ACCOUNT
= billing/subscription container

MEMBER
= individual person using the account

DEVICE
= browser/device currently used by a member

SESSION
= authentication session

PLAYBACK SESSION
= an active viewing session

Therefore:

ACCOUNT
 ├── MEMBERS
 │     ├── Leader
 │     ├── Member
 │     └── Member
 │
 ├── SUBSCRIPTION
 │
 └── BILLING

MEMBER
 ├── Profile
 ├── Watch History
 ├── Watchlist
 ├── Favorites
 ├── Playlists
 ├── Achievements
 ├── XP
 ├── Analytics
 └── Sessions

# 4. ACCOUNT DOES NOT EQUAL AUTH USER

Do NOT make this assumption:

auth.users = subscription account

Instead:

auth.users
    ↓
member identity

account
    ↓
subscription owner/group

# 5. EXAMPLE

John creates an account.

AUTH:

John's email
john@gmail.com

John becomes:

Leader

ACCOUNT:

Account #A1001

Subscription:

Solo
₱199/month

Member structure:

Account A1001
    ↓
John
    ↓
Leader

# 6. JOHN UPGRADES TO PLUS

John has already been Solo for one week.

Nothing is recreated.

Before:

Account A1001

Package:
Solo

Leader:
John

Achievements:
18

XP:
2450

Watch History:
47 movies

John upgrades.

After:

Account A1001

Package:
Plus

Leader:
John

Achievements:
18

XP:
2450

Watch History:
47 movies

The ACCOUNT ID remains identical.

The MEMBER ID remains identical.

Only the package/entitlement changes.

# 7. BILLING RULE

Do not immediately restart the user's entire subscription.

Example:

August 1:
Solo starts

August 8:
John requests Plus

Current Solo period:

August 1 → August 31

Recommended behavior:

Current Solo remains valid until August 31.

Plus becomes the next package.

September 1:

Plus ₱399/month begins.

Database:

current_package = Solo
next_package = Plus
package_change_at = August 31

# 8. PACKAGE CHANGE STATES

Support:

current package
pending package
effective_at

Example:

current_package:
solo

pending_package:
plus

effective_at:
2026-09-01

When the billing period ends:

solo
    ↓
expires
    ↓
plus becomes active

# 9. DOWNGRADE

Example:

Max → Plus

Same account.

Same leader.

Same member data.

Existing member profiles are NOT deleted.

But access is adjusted based on the new package capacity.

Example:

MAX:

John
Anna
Mark
Peter
Sarah

Downgrade to PLUS:

Capacity = 3

DO NOT automatically delete members.

Instead:

John = Active Leader
Anna = Active Member
Mark = Active Member

Peter = Inactive due to capacity
Sarah = Inactive due to capacity

This prevents accidental data loss.

# 10. MEMBER DATA

Each member must have independent personalization.

John:

Achievements
Watch History
Watchlist
Favorites
XP
Recommendations
Analytics

Anna:

Achievements
Watch History
Watchlist
Favorites
XP
Recommendations
Analytics

Therefore members do NOT share personal viewing data.

# 11. MEMBER AUTHENTICATION

Recommended model:

Each person can have their own Auth identity.

Leader invites:

anna@gmail.com

Anna accepts invitation.

Anna becomes a member of John's account.

This is much cleaner than sharing one Gmail/password with everyone.

# 12. AUTH STRUCTURE

Supabase Auth:

auth.users

Application layer:

profiles

Account membership:

account_members

Relationship:

auth.users
     ↓
profiles
     ↓
account_members
     ↓
accounts

# 13. ACCOUNTS TABLE

accounts

id
name
owner_member_id
status
created_at
updated_at

Example:

id:
A1001

name:
John's Lantawon Account

status:
active

# 14. ACCOUNT MEMBERS

account_members

id
account_id
user_id
role
status
joined_at
removed_at

Roles:

owner
member

Status:

invited
active
suspended
removed

# 15. ONLY ONE OWNER

An account can have:

1 owner

The owner is the billing leader.

Members cannot become owner automatically.

Ownership transfer must be an explicit admin/security operation.

# 16. PROFILE

profiles

id
user_id
display_name
username
avatar_url
bio
created_at
updated_at

A profile represents the person's identity inside Lantawon Lang.

# 17. PERSONAL DATA

Tables referencing:

member_id

instead of only:

account_id

Examples:

member_watchlist
member_favorites
member_playlists
member_achievements
member_xp
member_watch_history
member_analytics

This is what prevents John's history from mixing with Anna's.

# 18. SUBSCRIPTIONS

subscriptions

id
account_id
plan_package_id

status

current_period_start
current_period_end

current_package_id
pending_package_id
package_change_at

created_at
updated_at

IMPORTANT:

Subscription belongs to ACCOUNT.

# 19. PACKAGES

subscription_packages

id
code
name
price
currency
billing_interval

member_limit
concurrent_stream_limit

active

Seed:

SOLO
199
1 member
1 concurrent playback

PLUS
399
3 members
2 concurrent playback

MAX
599
5 members
3 concurrent playback

# 20. WHY PACKAGE IS NOT THE ACCOUNT

John:

Account ID:
A1001

Solo:
package_id = SOLO

Then:

Plus:
package_id = PLUS

Account ID stays:

A1001

Member ID stays:

John

Achievements stay.

# 21. DEVICE MODEL

DO NOT treat device as membership.

Member:

John

Current device:

MacBook

Later:

iPhone

The person's identity remains John.

# 22. MEMBER SESSIONS

member_sessions

id
member_id
device_id
session_identifier
created_at
last_seen_at
expires_at
revoked_at
status

Status:

active
expired
revoked

# 23. DEVICE RECORD

user_devices

id
member_id

device_name
device_type
platform

created_at
last_seen_at

status

But this is a convenience/security record.

It is NOT the permanent identity of the member.

# 24. DEVICE SWITCHING

Your simplified business rule:

A member may log into another device.

The old session can be logged out/revoked according to the package/session rules.

Example Solo:

John
MacBook
    ↓
login on iPhone
    ↓
old session revoked
    ↓
iPhone becomes active

No need to prove whether the iPhone belongs to John or someone else.

# 25. PLUS / MAX

The package controls MEMBER CAPACITY.

Plus:

3 members maximum

Max:

5 members maximum

Separate from:

Concurrent Playback

Plus example:

3 members
2 concurrent playback sessions

Max example:

5 members
3 concurrent playback sessions

# 26. PLAYBACK SESSION

playback_sessions

id
member_id
device_id

content_id
episode_id

started_at
last_heartbeat_at
ended_at

status

Status:

active
ended
expired

# 27. WATCH RULE

Before WATCH:

Authenticate member
        ↓
Find account
        ↓
Find active subscription
        ↓
Get current package
        ↓
Check entitlement
        ↓
Check concurrent playback
        ↓
Create playback session
        ↓
Start playback

# 28. ENTITLEMENT ENGINE

Never do:

frontend:
isPremium = true

Instead:

checkEntitlement(
    member_id,
    feature_code
)

Example:

premium_playback

Server checks:

member
    ↓
account
    ↓
subscription
    ↓
package
    ↓
feature

Result:

allowed = true

# 29. USER ACCOUNT DASHBOARD

Route:

/account

Sections:

Profile
My Library
Statistics
Achievements
Subscription
Members
Devices
Security
Support
Settings

# 30. PROFILE PAGE

/account/profile

Display:

Name
Username
Avatar
Email

Personal:

Watchlist
Favorites
Achievements
XP
Statistics

# 31. SUBSCRIPTION PAGE

/account/subscription

Display:

Current Package

Solo
₱199/month

Status:

Active

Billing period:

Aug 1 → Aug 31

Upcoming Package:

Plus

Next change:

Sep 1

Actions:

Upgrade
Downgrade
Cancel
View Billing

# 32. PACKAGE SELECTION

/account/subscription/packages

Cards:

SOLO

₱199/month
1 member
1 concurrent stream

PLUS

₱399/month
3 members
2 concurrent streams

MAX

₱599/month
5 members
3 concurrent streams

# 33. UPGRADE FLOW

John:

Solo

Clicks:

Upgrade to Plus

System:

Current package:
Solo

New package:
Plus

Effective:
Next renewal

Confirm:

[Schedule Upgrade]

Database:

current_package = Solo

pending_package = Plus

package_change_at = renewal_timestamp

# 34. MEMBER MANAGEMENT

/account/members

ONLY OWNER CAN MANAGE.

Display:

👑 John Doe
Owner

👤 Anna
Member

👤 Mark
Member

Actions:

Invite Member
Remove Member
Suspend Member

# 35. INVITE MEMBER

Owner enters:

Email

System creates:

account_member invitation

Status:

invited

Email/in-app invitation:

"You have been invited to join an account."

After acceptance:

status = active

# 36. MEMBER LEAVE

Members may:

Leave Account

Owner cannot simply leave.

Owner must:

Transfer ownership
OR
Cancel account/subscription

# 37. ACCOUNT DELETION

Owner requests deletion.

System should not immediately destroy everything.

Use:

deletion_requested_at

Then:

verification
    ↓
grace period
    ↓
delete/anonymize according to policy

# 38. SUPPORT TICKETS

Support belongs to the MEMBER who opened it.

support_tickets

id
ticket_number

account_id
member_id

subject
category
priority
status

assigned_to

created_at
updated_at
closed_at

# 39. TICKET CATEGORIES

Account
Subscription
Payment
Playback
Watch History
Watchlist
Technical Issue
Bug Report
Content Information
Other

# 40. TICKET MESSAGES

support_messages

id
ticket_id
sender_user_id
message
attachment_url
created_at

# 41. SUPPORT LOGIC

Member:

Create ticket
    ↓
Ticket status = OPEN

Admin/Support:

Assign ticket
    ↓
status = IN_PROGRESS

Admin replies:

message inserted

Member replies:

message inserted

Resolution:

RESOLVED

Final:

CLOSED

# 42. OWNER SUPPORT VS MEMBER SUPPORT

Both owner and members can create tickets.

But account/billing issues may require:

OWNER permission

Example:

Member:

"Movie isn't playing."

Allowed.

Member:

"Change billing method."

Require Owner.

# 43. ADMIN PORTAL

Route:

/admin

NOT accessible to normal members.

Admin dashboard:

Dashboard
Users
Accounts
Subscriptions
Packages
Members
Payments
Tickets
Content
Providers
Playback
Analytics
Audit Logs
Settings

# 44. ADMIN DASHBOARD

Metrics:

Total Users
Total Accounts
Active Subscriptions
Solo Accounts
Plus Accounts
Max Accounts
Monthly Revenue
Failed Payments
Open Tickets
Active Playback Sessions
New Users
Churn

# 45. ADMIN USERS CRUD

/admin/users

CREATE:

Admin can create/invite users when necessary.

READ:

Search
Filter
View profile

UPDATE:

Profile status
Role
Account membership

DELETE:

Use deactivation/anonymization where possible rather than blindly deleting authentication records.

# 46. USER DETAIL

/admin/users/[id]

Show:

User ID
Email
Name
Role
Account
Member Role
Subscription
Package
Status
Achievements
Watch statistics
Devices
Sessions
Tickets

# 47. ADMIN ACCOUNTS CRUD

/admin/accounts

CREATE

READ

UPDATE

ARCHIVE

Show:

Account ID
Owner
Current package
Subscription status
Member count
Created date
Renewal date

# 48. ADMIN ACCOUNT DETAIL

/admin/accounts/[id]

Sections:

Overview
Owner
Members
Subscription
Billing
Devices/Sessions
Tickets
Audit Log

# 49. ADMIN PACKAGE CRUD

/admin/packages

Admin can:

Create package
Edit price
Change member limit
Change concurrent stream limit
Activate/deactivate package

Example:

SOLO
₱199
1 member
1 stream

PLUS
₱399
3 members
2 streams

MAX
₱599
5 members
3 streams

Never hard-code these values in the frontend.

# 50. ADMIN SUBSCRIPTION CRUD

/admin/subscriptions

Admin can:

View
Search
Filter
Suspend
Reactivate
Cancel
Change package
View payment status

Changing subscriptions should create an audit log.

# 51. ADMIN MEMBER CRUD

/admin/members

Admin can:

View
Suspend
Reactivate
Remove from account
Transfer membership
View activity

But destructive operations must require confirmation.

# 52. ADMIN PAYMENT CRUD

/admin/payments

Read:

Transaction ID
Account
Owner
Package
Amount
Currency
Status
Payment Provider
Date

Statuses:

pending
paid
failed
refunded
void

# 53. ADMIN TICKET CRUD

/admin/tickets

Views:

All
Open
In Progress
Waiting
Resolved
Closed

Filters:

Priority
Category
Assigned Agent
Package
Date

Actions:

Assign
Reply
Change Priority
Change Status
Close
Reopen

# 54. ADMIN CONTENT CRUD

/admin/content

CRUD:

Movies
Series
Episodes
People
Companies
Collections
Providers
Availability

But external metadata should be imported through adapters/sync services rather than manually maintaining everything.

# 55. ADMIN PLAYBACK CRUD

/admin/playback

Manage:

Authorized source records
Source status
Health
Provider
Availability
Priority

Actions:

Enable
Disable
Inspect health
Change priority

Do not expose internal source-management functionality to ordinary users.

# 56. ADMIN ANALYTICS

/admin/analytics

Metrics:

Users
Members
Accounts
Subscriptions
Package distribution
Upgrade rate
Downgrade rate
Cancellation rate
Retention
Watch time
Playback failures
Ticket volume

# 57. ADMIN AUDIT LOG

audit_logs

id
actor_user_id
action
entity_type
entity_id

old_data
new_data

created_at

Example:

Admin changed:

Account A1001

Solo → Plus

Audit:

actor:
Admin ID

action:
subscription.package_change

old:
Solo

new:
Plus

# 58. ADMIN ROLES

super_admin
admin
support_manager
support_agent
content_editor
analyst

Permissions should be based on roles/capabilities.

Do not rely on a frontend boolean such as:

isAdmin = true

# 59. USER PERMISSION MODEL

OWNER:

Manage subscription
Manage members
Billing
Account settings
Support

MEMBER:

Personal profile
Personal library
Personal analytics
Achievements
Watch history
Playback
Support

ADMIN:

System management

# 60. RLS

User/member-owned data must be protected with RLS.

Examples:

watchlist
watch_history
favorites
playlists
achievements
analytics
devices
sessions
tickets

A member can read/write only their own personal data.

Supabase RLS policies should use the authenticated user's identity and explicit role checks; Supabase recommends RLS on exposed tables plus appropriate grants, with service-role access kept server-side. :contentReference[oaicite:1]{index=1}

# 61. ACCOUNT-LEVEL RLS

For tables that belong to the whole account:

Example:

subscriptions

Only the owner should be able to read sensitive billing/subscription information.

# 62. MEMBER TABLE POLICY

account_members:

Member can view their own membership.

Owner can view/manage members belonging to their account.

Admin can manage all.

# 63. SECURITY RULE

Never trust:

member_id
account_id
role
subscription status
package

sent by the browser.

The server should derive:

authenticated user
    ↓
member
    ↓
account
    ↓
subscription
    ↓
package
    ↓
permissions

# 64. DATABASE RELATIONSHIP

AUTH:

auth.users
    ↓
profiles

ACCOUNT:

accounts
    ↓
account_members
    ↓
profiles

SUBSCRIPTION:

accounts
    ↓
subscriptions
    ↓
subscription_packages

USER PERSONAL DATA:

profiles
    ├── watchlist
    ├── favorites
    ├── playlists
    ├── watch_history
    ├── achievements
    ├── analytics
    └── sessions

SUPPORT:

accounts
    ↓
support_tickets
    ↓
support_messages

BILLING:

accounts
    ↓
subscriptions
    ↓
payments
    ↓
invoices

# 65. COMPLETE LOGIC

USER SIGNUP:

Auth
 ↓
Create profile
 ↓
Create account
 ↓
Create account_member
 ↓
role = owner
 ↓
Create subscription
 ↓
Package = Solo

# 66. SOLO → PLUS

Current:

Account A1001
Package = Solo

User requests:

Plus

System:

Validate account owner
 ↓
Validate payment/billing
 ↓
Create package change
 ↓
pending_package = Plus
 ↓
effective_at = renewal date

At renewal:

current_package = Plus
pending_package = null

No account migration.

# 67. PLUS → MAX

Exactly the same:

Plus
 ↓
Max

Same account.

# 68. MAX → PLUS

Same account.

But if there are 5 members:

Do NOT delete members immediately.

Mark members beyond allowed capacity:

inactive_due_to_package

Then allow owner to choose who remains active.

# 69. MEMBER INVITATION

Owner:

Plus

Invites:

friend@gmail.com

System:

Create invitation.

Friend accepts.

Auth:

Friend user

Profile:

Friend

Membership:

account_member

role = member

status = active

# 70. MEMBER ACHIEVEMENTS

Every member owns personal achievements.

John:

20 achievements.

Anna:

5 achievements.

Mark:

12 achievements.

If Anna leaves:

Anna's achievement history stays attached to Anna's member/profile.

Whether you eventually allow her to join another account is a separate business rule.

# 71. DEVICE SWITCH

John:

MacBook
 ↓
Login from iPhone

The web system does NOT need to determine:

"is this John's phone?"

It only manages:

session

The previous session can be revoked according to the active-session rule.

# 72. CONCURRENT STREAM

Package:

Solo

limit = 1

If:

John's MacBook = active playback

Second playback:

deny or replace according to your chosen playback policy.

Plus:

2 concurrent streams

Max:

3 concurrent streams

# 73. SUPPORT FLOW

MEMBER:

Support
 ↓
Create Ticket

ADMIN:

Ticket Queue
 ↓
Assign Agent
 ↓
Reply

MEMBER:

View Reply
 ↓
Respond

ADMIN:

Resolve

MEMBER:

Close

# 74. ADMIN CRUD PRINCIPLE

CRUD is NOT the same for every object.

PUBLIC CATALOG:

Create
Read
Update
Archive

USER DATA:

Read own
Update own

ACCOUNT:

Owner manage own account

SUBSCRIPTION:

Owner request package changes
Admin can override

BILLING:

Owner can view
Admin/payment service can update

TICKETS:

Member can create/read own
Support can manage assigned tickets

# 75. WEB APPLICATION ARCHITECTURE

BROWSER
    ↓
Next.js Web App
    ↓
Server/API Layer
    ↓
Domain Services
    ├── Auth
    ├── Account
    ├── Membership
    ├── Subscription
    ├── Billing
    ├── Entitlement
    ├── Device/Session
    ├── Playback
    ├── Library
    ├── Analytics
    └── Support
    ↓
Supabase
    ├── Auth
    ├── PostgreSQL
    ├── RLS
    ├── Storage
    └── Edge Functions
    ↓
External Services
    ├── Metadata APIs
    ├── Availability APIs
    └── Payment Provider

# 76. IMPORTANT DOMAIN SEPARATION

DO NOT create one huge:

users table

Instead separate:

Authentication
Profiles
Accounts
Memberships
Subscriptions
Packages
Sessions
Playback
Billing
Support

# 77. FINAL BUSINESS RULE

A USER does not buy a new account when upgrading.

The USER keeps the same identity.

The ACCOUNT stays the same.

The SUBSCRIPTION stays the same.

Only the PACKAGE changes.

SOLO:
1 member

PLUS:
3 members

MAX:
5 members

Everything personal stays attached to the individual member.

# 78. FINAL USER JOURNEY

John:

SIGN UP
 ↓
Solo ₱199
 ↓
Watch
 ↓
Earn achievements
 ↓
Build watchlist
 ↓
Build history
 ↓
One week later
 ↓
Upgrade to Plus
 ↓
Same account
 ↓
Same achievements
 ↓
Same history
 ↓
Same watchlist
 ↓
Invite friends
 ↓
Friends become members
 ↓
Each gets separate personal profile/history
 ↓
Subscription shared

# 79. FINAL ADMIN JOURNEY

ADMIN LOGIN
 ↓
Dashboard
 ↓
Accounts
 ↓
Open Account
 ↓
View Owner
 ↓
View Members
 ↓
View Subscription
 ↓
View Package
 ↓
View Billing
 ↓
View Tickets
 ↓
View Sessions
 ↓
View Audit Log

# 80. MOST IMPORTANT TABLES

AUTH:

auth.users

CORE:

profiles
accounts
account_members

SUBSCRIPTION:

subscription_packages
subscriptions
subscription_package_changes

BILLING:

payments
invoices

SESSION:

user_devices
member_sessions
playback_sessions

LIBRARY:

watchlist
favorites
playlists
playlist_items
watch_history
watch_progress

GAMIFICATION:

achievements
member_achievements
xp_events

SUPPORT:

support_tickets
support_messages

SYSTEM:

notifications
audit_logs

# 81. FINAL MENTAL MODEL

AUTH USER
     ↓
PROFILE
     ↓
ACCOUNT MEMBERSHIP
     ↓
ACCOUNT
     ↓
SUBSCRIPTION
     ↓
PACKAGE

PACKAGE controls:

MEMBER LIMIT
CONCURRENT PLAYBACK
FEATURE ENTITLEMENTS

MEMBER controls:

PERSONAL DATA
WATCH HISTORY
WATCHLIST
ACHIEVEMENTS
XP
ANALYTICS
SESSIONS

OWNER controls:

MEMBERS
SUBSCRIPTION
BILLING

ADMIN controls:

SYSTEM CRUD
CATALOG
ACCOUNTS
SUBSCRIPTIONS
SUPPORT
BILLING OVERSIGHT
AUDIT





NEW 1:

**Now the rule is completely clear.** The package does **not** restrict who can use the account or permanently bind people/devices.

The only restriction is  **how many active sessions/people can be using the subscription at the same time** .

### Final rule

| Package        | Price/month | Concurrent active sessions |
| -------------- | ----------- | -------------------------- |
| **Solo** | ₱199       | 1                          |
| **Plus** | ₱399       | 3                          |
| **Max**  | ₱599       | 5                          |

And  **any package can switch devices or let someone else use the account** .

Example — Solo:

<pre class="overflow-visible! px-0!" data-start="500" data-end="634"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>John → Laptop
        ↓
Friend logs in on another PC
        ↓
John's session → AUTO LOGOUT
        ↓
Friend's PC → ACTIVE</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

No device registration drama.

No permanent device ownership.

No "this is John's laptop" detection.

### Plus

<pre class="overflow-visible! px-0!" data-start="748" data-end="840"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Plus — ₱399

John     → Active
Maria    → Active
Pedro    → Active

3 / 3 active</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

A fourth login:

<pre class="overflow-visible! px-0!" data-start="859" data-end="982"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>New login
    ↓
3 sessions already active
    ↓
Oldest/previous session → AUTO LOGOUT
    ↓
New device → ACTIVE</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

### Max

<pre class="overflow-visible! px-0!" data-start="993" data-end="1111"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Max — ₱599

Session 1 → Active
Session 2 → Active
Session 3 → Active
Session 4 → Active
Session 5 → Active</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

Sixth login:

<pre class="overflow-visible! px-0!" data-start="1127" data-end="1250"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>New login
   ↓
5 active sessions
   ↓
Existing session automatically logged out
   ↓
New session becomes active</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

The exact rule for **which old session gets kicked out** should be:

> **The least recently active session is revoked.**

That is much simpler than device registration.

---

# The architecture changes accordingly

You actually  **don't need a `user_devices` system as a subscription limit** .

You mainly need:

<pre class="overflow-visible! px-0!" data-start="1563" data-end="1634"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>ACCOUNT
   ↓
SUBSCRIPTION
   ↓
PACKAGE
   ↓
ACTIVE SESSIONS</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

### Database concept

<pre class="overflow-visible! px-0!" data-start="1658" data-end="1748"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>accounts
subscriptions
subscription_packages
member_sessions
playback_sessions</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

A session contains:

<pre class="overflow-visible! px-0!" data-start="1771" data-end="1866"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>member_id
session_id
device_name
platform
last_seen_at
created_at
revoked_at
status</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

The `device_name` is just informational:

<pre class="overflow-visible! px-0!" data-start="1910" data-end="1974"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Chrome on Windows
Safari on iPhone
Chrome on MacBook</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

It is  **not a permanent registered device** .

---

# Login logic

<pre class="overflow-visible! px-0!" data-start="2042" data-end="2355"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>LOGIN
  ↓
Authenticate user
  ↓
Find account
  ↓
Find active subscription
  ↓
Get package session limit
  ↓
Count active sessions
  ↓
Is limit reached?
     │
     ├── NO → Create session
     │
     └── YES
           ↓
      Revoke least-recently-active session
           ↓
      Create new session</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

So:

### Solo

<pre class="overflow-visible! px-0!" data-start="2372" data-end="2408"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>1 active session maximum</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

### Plus

<pre class="overflow-visible! px-0!" data-start="2420" data-end="2457"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>3 active sessions maximum</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

### Max

<pre class="overflow-visible! px-0!" data-start="2468" data-end="2505"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>5 active sessions maximum</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

---

# Password change

Since you want it simple:

<pre class="overflow-visible! px-0!" data-start="2558" data-end="2643"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Change Password
      ↓
Revoke ALL sessions
      ↓
User must login again</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

That's enough.

If John gives his login to somebody:

<pre class="overflow-visible! px-0!" data-start="2699" data-end="2799"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Friend logs in
     ↓
Friend's session becomes active
     ↓
John automatically logs out</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

No need to know whether that device belongs to John.

---

# Account sharing becomes extremely simple

Your product rule can literally be:

> **You may sign in on different devices, but your package determines the maximum number of active sessions. When the limit is exceeded, the least recently active session is automatically logged out.**

That applies equally to  **Solo, Plus, and Max** .

And because your  **subscription belongs to the account** , upgrading:

<pre class="overflow-visible! px-0!" data-start="3264" data-end="3287"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Solo → Plus</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

simply changes:

<pre class="overflow-visible! px-0!" data-start="3306" data-end="3344"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>max_active_sessions:
1 → 3</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

while everything else remains intact:

<pre class="overflow-visible! px-0!" data-start="3385" data-end="3478"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Achievements ✅
XP ✅
Watch History ✅
Watchlist ✅
Favorites ✅
Analytics ✅
Account ✅</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

This is considerably simpler than the previous device-registration architecture and fits what you're actually trying to build.




NEW 2:




### Recommended flow

<pre class="overflow-visible! px-0!" data-start="100" data-end="354"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>User
 ↓
"Forgot Password"
 ↓
Creates Ticket
 ↓
Admin verifies request
 ↓
Admin clicks "Reset Password"
 ↓
System generates password-reset action
 ↓
Email automatically sent to user's Gmail
 ↓
User opens reset link
 ↓
Sets NEW password
 ↓
Done</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

So **hindi na kailangan na ikaw ang mag-message manually** for normal forgot-password cases.

The email can say:

> **Your Lantawon Lang password has been reset**
>
> We received a password reset request for your account.
>
> Click the button below to create a new password.
>
> **[Reset Password]**
>
> If you did not request this, please contact support.

### Admin portal

Sa ticket:

<pre class="overflow-visible! px-0!" data-start="744" data-end="851"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>#LL-000123
John Doe
john@gmail.com

Category:
Forgot Password

Status:
Open

[ Reset Password ]</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

After clicking:

<pre class="overflow-visible! px-0!" data-start="870" data-end="939"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>✅ Password reset initiated

Email sent to:
john@gmail.com</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

Then ticket automatically becomes:

<pre class="overflow-visible! px-0!" data-start="977" data-end="1013"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Status: Waiting for User</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

Once the user successfully resets the password:

<pre class="overflow-visible! px-0!" data-start="1064" data-end="1092"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Status: Resolved</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

### Very important

I would **remove the idea of Admin setting `123` as the password** entirely.

Since the system can automatically email the user, there is no reason for your Admin to ever know or manually transmit a temporary password.

Your Admin only does:

<pre class="overflow-visible! px-0!" data-start="1357" data-end="1418"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>Verify user
→ Reset Password
→ System sends email</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

That is cleaner and safer.

### If the user doesn't have access to their Gmail

That is different. Then the ticket becomes an **account recovery** case, and you can have a manual verification process. Don't let an Admin simply set a known password and hand it over without verifying ownership.

So your final support system can have:

<pre class="overflow-visible! px-0!" data-start="1755" data-end="1958"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-(--code-block-surface) corner-superellipse/1.1 overflow-clip rounded-3xl [--code-block-surface:var(--bg-elevated-secondary)] dark:[--code-block-surface:var(--composer-surface-primary)] lxnfua_clipPathFallback"><div class="pointer-events-none absolute end-1.5 top-1 z-2 md:end-2 md:top-1"></div><div class="relative"><div class="pe-11 pt-3"><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span>SUPPORT

├── Forgot Password
│    └── Automatic email reset
│
├── Account Recovery
│    └── Manual Admin verification
│
├── Payment
├── Subscription
├── Playback
├── Technical Issue
└── Other</span></code></pre></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></pre>

This is the version I would put into your final User Account + Admin CRUD architecture.
