# LANTAWON LANG — SECURITY AUDIT & BACKEND EXPOSURE HARDENING

You are working on the EXISTING Lantawon Lang web application.

Do NOT redesign the application.
Do NOT create another architecture proposal.
Do NOT explain generic security theory.

Your task is:

1. AUDIT the current implementation.
2. IDENTIFY anything sensitive currently exposed to users/browser/DevTools.
3. FIX the exposure directly in the existing codebase.
4. Re-test the affected flows.
5. Report only what was actually found and fixed.

==================================================
# PRIMARY SECURITY GOAL
==================================================

I do NOT want normal users to be able to discover or obtain:

- private API keys
- secret API keys
- service-role keys
- payment secrets
- database credentials
- signing secrets
- private provider credentials
- server environment variables
- admin credentials
- internal backend configuration
- secret source-resolution credentials
- privileged Supabase credentials
- internal implementation secrets

especially through:

- View Source
- DevTools
- Network tab
- JavaScript bundles
- browser console
- source maps
- client-side environment variables
- API responses
- request headers
- request bodies
- exposed configuration endpoints

==================================================
# IMPORTANT REALITY
==================================================

Do NOT falsely claim that a browser-visible playback URL can be made completely invisible.

If the browser must request a media resource directly, a determined user may be able to inspect the network request.

Therefore:

PROTECT SECRETS AND BACKEND CREDENTIALS.

For playback:

- use authorized sources
- use server-side resolution
- use short-lived authorization/signed URLs where supported
- avoid permanent secret URLs
- do not expose provider API credentials
- do not expose internal source resolver credentials
- do not expose unnecessary provider APIs directly to the client

Do NOT implement tricks intended merely to hide information that the browser necessarily needs to receive.

==================================================
# CURRENT STACK
==================================================

Frontend:

Next.js

Backend/application layer:

Next.js server-side Route Handlers / Server Actions where appropriate

Database:

Supabase PostgreSQL

Authentication:

Supabase Auth

Production:

Vercel

Supabase Edge Functions may be used where appropriate.

DO NOT introduce Laravel.

==================================================
# STEP 1 — FULL EXPOSURE AUDIT
==================================================

Search the ENTIRE codebase.

Check for:

NEXT_PUBLIC_

SUPABASE_SERVICE_ROLE_KEY
service_role
sb_secret_
secret
api_key
apikey
API_KEY
token
TOKEN
password
PASSWORD
private_key
PRIVATE_KEY
client_secret
CLIENT_SECRET
signing_secret
webhook_secret

Also inspect:

.env
.env.local
.env.development
.env.production
.env.example
vercel configuration
supabase functions
API routes
server actions
client components
hooks
utils
services
lib
middleware
configuration files
JSON config
static files
public/
source maps
browser bundles

==================================================
# STEP 2 — IDENTIFY CLIENT CODE
==================================================

Find files containing:

"use client"

Determine whether they import or indirectly depend on:

- secret keys
- server-only modules
- service-role Supabase clients
- provider credentials
- payment credentials
- private environment variables
- sensitive source resolver logic

If a Client Component imports a server-only secret or secret-bearing module:

FIX IT.

==================================================
# STEP 3 — ENVIRONMENT VARIABLE AUDIT
==================================================

Determine which environment variables are:

PUBLIC
vs
SERVER ONLY

PUBLIC variables may be exposed only when genuinely safe.

Examples of potentially public:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

DO NOT expose:

SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
PAYMENT_SECRET
PAYMENT_WEBHOOK_SECRET
PROVIDER_API_KEY
PROVIDER_SECRET
SIGNING_SECRET
DATABASE_URL
PRIVATE_API_KEY

Never rename a secret to:

NEXT_PUBLIC_SOMETHING

just to make the code work.

==================================================
# STEP 4 — SUPABASE SECURITY
==================================================

Inspect EVERY Supabase client.

Determine:

Browser client
Server client
Admin/service-role client

The browser must NEVER receive a secret/service-role key.

Check:

- RLS enabled
- policies exist
- user-owned tables protected
- account/member permissions enforced
- admin permissions enforced
- subscription data protected
- payment data protected
- support tickets protected
- session data protected

Never rely only on frontend route protection.

Authorization must be server-side/database-side.

==================================================
# STEP 5 — PLAYBACK API AUDIT
==================================================

This is extremely important.

Find every API related to:

- movie playback
- episode playback
- source resolution
- provider lookup
- stream URL
- embed URL
- server selection
- playback source
- mirror/source fallback
- player configuration

Determine whether the browser currently receives:

- provider API keys
- provider credentials
- internal source IDs that expose secrets
- permanent authenticated URLs
- private API URLs
- backend credentials
- unnecessary source metadata

==================================================
# STEP 6 — PLAYBACK ARCHITECTURE
==================================================

The preferred flow is:

Browser
  ↓
POST /api/playback/resolve
  ↓
Authenticate user
  ↓
Validate account
  ↓
Validate subscription
  ↓
Validate package/session entitlement
  ↓
Validate content availability
  ↓
Server resolves eligible playback source
  ↓
Server returns ONLY the minimum playback information required
  ↓
Player starts

The browser must NOT directly call a secret external provider API.

BAD:

Browser
  ↓
Provider API + secret key

GOOD:

Browser
  ↓
Lantawon Lang server endpoint
  ↓
Provider API
  ↓
Lantawon Lang server
  ↓
Browser

==================================================
# STEP 7 — SOURCE RESOLVER
==================================================

Move provider-specific credentials and sensitive source-resolution logic to server-side code.

Example:

BAD:

Client Component
  ↓
import providerConfig
  ↓
providerConfig.API_KEY

GOOD:

Server-only module
  ↓
provider credentials
  ↓
resolveSource()
  ↓
return safe playback response

Use explicit server-only boundaries where supported.

If necessary, create:

src/lib/server/

for server-only modules.

DO NOT import server-only modules into Client Components.

==================================================
# STEP 8 — API RESPONSE MINIMIZATION
==================================================

Inspect API responses.

Return only what the browser actually needs.

Do NOT return:

- provider API keys
- internal database credentials
- private provider configuration
- unused environment values
- internal server paths
- admin metadata
- secret source credentials
- unnecessary source implementation details

Example:

BAD:

{
  apiKey: "...",
  providerSecret: "...",
  internalSourceResolver: "...",
  playbackUrl: "..."
}

BETTER:

{
  playbackUrl: "...",
  expiresAt: "..."
}

where the playback authorization is appropriately short-lived/controlled.

==================================================
# STEP 9 — SERVER-SIDE API ROUTES
==================================================

Audit:

app/api/**

For every route determine:

- public?
- authenticated?
- leader only?
- admin only?
- server-only?

Sensitive routes must verify authorization.

Examples:

/api/playback/*
/api/subscription/*
/api/payment/*
/api/admin/*
/api/support/*
/api/source/*
/api/provider/*

Do not trust:

user_id
account_id
role
subscription status
package
member_id

sent by the browser.

Derive identity from the authenticated session/server context.

==================================================
# STEP 10 — ADMIN ENDPOINT SECURITY
==================================================

Admin APIs must NEVER rely on:

frontend route hiding
hidden buttons
localStorage role
client-side "isAdmin"

Verify admin authorization server-side.

A normal user must not be able to call:

/api/admin/users
/api/admin/payments
/api/admin/subscriptions
/api/admin/packages

even if they manually type the endpoint.

==================================================
# STEP 11 — PAYMENT SECURITY
==================================================

Payment proof may be uploaded by users.

Audit:

- file type validation
- file size validation
- access permissions
- storage policies
- private/public bucket configuration

Payment screenshots should NOT automatically become publicly accessible.

Admin can view them through authorized access.

Payment provider secrets remain server-side.

==================================================
# STEP 12 — SUPPORT SECURITY
==================================================

A member must only access:

their own tickets

An admin/support agent may access tickets according to role.

Test:

User A cannot access:

/support/ticket/<User B ticket>

by changing the ID.

==================================================
# STEP 13 — BROWSER DEVTOOLS TEST
==================================================

Act like a malicious but ordinary user.

Open:

DevTools
→ Network
→ Sources
→ Application
→ Console

Check:

Network Requests:

Look for:

api_key
apikey
secret
token
password
service_role
private
client_secret
authorization
provider credentials

Sources:

Search loaded scripts for:

SUPABASE_SERVICE_ROLE_KEY
sb_secret
API_KEY
PROVIDER_API_KEY
PAYMENT_SECRET
DATABASE_URL

Application:

Inspect:

localStorage
sessionStorage
IndexedDB
cookies

Make sure sensitive secrets are not stored there.

Cookies containing authentication/session state should use secure appropriate settings.

==================================================
# STEP 14 — SOURCE MAP AUDIT
==================================================

Check production builds.

Determine whether source maps expose:

- server-only source files
- secrets
- credentials
- internal backend implementation

Do not disable source maps blindly.

Instead verify that sensitive server-side modules are not shipped to client bundles.

==================================================
# STEP 15 — NETWORK REQUEST AUDIT
==================================================

For each request from the browser classify:

PUBLIC DATA
AUTHENTICATED DATA
SENSITIVE SERVER OPERATION

Find direct browser → third-party API calls.

For sensitive providers:

Move the request behind the server.

Especially inspect:

Movie source APIs
Provider APIs
Payment APIs
Subscription APIs

==================================================
# STEP 16 — NO SECURITY BY OBFUSCATION
==================================================

Do NOT:

- rename secrets
- Base64 encode secrets
- hide keys in JavaScript
- split keys into strings
- encrypt keys with a client-side key
- put secrets in obscure objects
- hide URLs in environment variables exposed to client

These do not make browser-visible secrets secret.

Move them server-side.

==================================================
# STEP 17 — VERCEL ENVIRONMENT VARIABLES
==================================================

Verify:

Production secrets are stored in Vercel Environment Variables.

They must NOT be committed to Git.

They must NOT appear in:

public/
static assets
client bundles
NEXT_PUBLIC_ variables

Check:

Development
Preview
Production

for correct secret configuration.

==================================================
# STEP 18 — SUPABASE EDGE FUNCTIONS
==================================================

If an operation requires a secret and is better isolated:

consider Supabase Edge Functions.

Use them for:

- sensitive provider integrations
- payment webhooks
- secret API integrations
- special server-only operations

Secrets must be stored as server-side function secrets.

Do not expose them to the browser.

==================================================
# STEP 19 — SECURITY HEADERS / BASIC WEB HARDENING
==================================================

Inspect Next.js configuration.

Implement appropriate security headers where compatible:

Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Frame protections where appropriate

Do not blindly deploy an overly restrictive CSP that breaks:

- Supabase
- legitimate providers
- video playback
- images
- fonts
- required scripts

Test after implementation.

==================================================
# STEP 20 — RATE LIMITING
==================================================

Identify sensitive endpoints:

login/recovery
payment submission
playback resolution
support creation
admin endpoints
metadata proxy endpoints

Implement practical rate limiting where appropriate.

Do not create an unnecessarily complicated infrastructure layer.

Use the simplest approach compatible with Vercel/Supabase.

==================================================
# STEP 21 — LOGGING
==================================================

Do NOT log:

passwords
API keys
tokens
payment secrets
authorization headers
secret URLs

Logs should contain only useful diagnostic metadata.

==================================================
# STEP 22 — VERIFY AUTHORIZATION
==================================================

Test these attack scenarios.

USER A attempts:

GET User B data

GET User B watchlist

GET User B tickets

GET User B subscription

GET Admin data

GET payment submissions

GET another account's members

GET another user's private data

All must fail.

==================================================
# STEP 23 — VERIFY PLAYBACK AUTHORIZATION
==================================================

Test:

Unauthenticated user
→ playback endpoint

Expected:

DENY if playback requires authentication.

Expired subscription
→ playback

Expected:

DENY.

Invalid account/member
→ playback

Expected:

DENY.

Exceed session limit
→ playback

Expected:

enforce configured session behavior.

==================================================
# STEP 24 — IMPORTANT PLAYBACK LIMITATION
==================================================

Do NOT falsely promise:

"Nobody can inspect the video URL."

A browser ultimately needs enough information to request media.

Instead ensure:

- no provider API secrets are exposed
- no permanent secret credentials are exposed
- playback authorization is short-lived where supported
- backend entitlement checks happen before playback
- sensitive provider communication stays server-side
- direct provider API calls are not made from browser code when secrets are required

==================================================
# STEP 25 — HARDENING IMPLEMENTATION
==================================================

After the audit:

FIX the actual problems.

Examples:

Move:

provider API client

from:

client component

to:

server-only service.

Replace:

direct provider call

with:

/api/provider/*

server endpoint.

Replace:

client subscription check

with:

server entitlement check.

Replace:

exposed secret env variable

with:

server-only environment variable.

Add RLS/policies where missing.

Add admin server-side authorization.

Fix insecure storage.

Fix API responses that contain unnecessary sensitive data.

==================================================
# STEP 26 — DO NOT BREAK EXISTING APPLICATION
==================================================

Preserve:

movies
series
anime
documents
search
filters
watchlist
achievements
statistics
subscriptions
support
admin
player

Only change the security boundaries and implementation where necessary.

==================================================
# STEP 27 — TEST AFTER EVERY SECURITY CHANGE
==================================================

Run:

npm list
npm run lint
npm run typecheck
npm test
git status
git diff

Also run the project's actual build command if it exists.

Check that:

- frontend builds
- server routes work
- authentication works
- Supabase works
- player works
- subscription works
- admin works
- guest browsing works

==================================================
# STEP 28 — FINAL BROWSER SECURITY TEST
==================================================

Pretend you are an ordinary user.

Open DevTools.

Search:

API
KEY
SECRET
TOKEN
PASSWORD
SUPABASE
SERVICE
PROVIDER
PAYMENT

Determine exactly what is visible.

Classify each finding:

SAFE PUBLIC DATA
or
SENSITIVE EXPOSURE

If sensitive:

FIX IT.

Do not simply hide it in JavaScript.

==================================================
# STEP 29 — FINAL REPORT
==================================================

Do NOT give me generic security advice.

Return:

# SECURITY AUDIT

## EXPOSED
List actual sensitive things found.

## SAFE
List things checked and confirmed safe.

## FIXED
List exact files/modules/routes changed.

## PLAYBACK
Explain exactly what is visible to the browser and what is now server-side.

## SUPABASE
RLS / Auth / secret-key findings.

## VERCEL
Environment variable findings.

## TESTED
List actual tests performed.

## REMAINING
Only genuine remaining risks.

==================================================
# FINAL RULE
==================================================

If something sensitive is currently exposed:

DO NOT JUST TELL ME.

FIX IT.

If something cannot technically be hidden from the browser because the browser must receive it to function:

EXPLAIN THAT SPECIFIC LIMITATION.

Otherwise:

MOVE IT SERVER-SIDE.

Do not add Laravel.

Use the existing:

Next.js
+
Supabase
+
Vercel

architecture.