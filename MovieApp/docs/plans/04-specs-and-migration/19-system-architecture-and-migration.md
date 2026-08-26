98. USER EXPERIENCE PRINCIPLE
    The platform should answer these questions immediately:
    1.What should I watch?
    2.Where can I watch it?
    3.Is it free or paid?
    4.Who is in it?
    5.Who created it?
    6.What else did they make?
    7.Is it part of a franchise?
    8.Is it appropriate for me?
    9.What quality is available?
    10.Where did I stop watching?
    11.What should I watch next?
    12.What have I watched before?
99. FINAL INFORMATION ARCHITECTURE
    PRIMARY:
    Home
    Explore
    Movies
    Shows
    Discover
    Timelines
    My Library
    DISCOVER:
    People
    Studios
    Networks
    Where to Watch
    Collections
    Genres
    Countries
    Providers
    ACCOUNT:
    Statistics
    Achievements
    Profile
    Settings
    Devices
    Subscription
    ADMIN:
    Dashboard
    Users
    Catalog
    Companies
    Providers
    Availability
    Playback Sources
    Moderation
    Billing
    Audit Logs
100. FINAL SYSTEM ARCHITECTURE
     USER
     ↓
     NEXT.JS APP
     ↓
     AUTHENTICATION
     ↓
     SUPABASE AUTH
     ↓
     APPLICATION SERVICES
     ├── Search Service
     ├── Catalog Service
     ├── People Service
     ├── Company Service
     ├── Availability Service
     ├── Playback Service
     ├── Recommendation Service
     ├── Library Service
     ├── Analytics Service
     ├── Achievement Service
     ├── Subscription Service
     └── Notification Service
     ↓
     SUPABASE POSTGRES
     ├── Content
     ├── People
     ├── Companies
     ├── Providers
     ├── Availability
     ├── Collections
     ├── TV Seasons
     ├── Episodes
     ├── Users
     ├── Library
     ├── Watch History
     ├── Analytics
     ├── Achievements
     ├── Subscriptions
     └── Audit Logs
     ↓
     EXTERNAL PROVIDERS
     Metadata APIs
     Availability APIs
     Payment Provider
     Email/Notification Provider
     Authorized Playback Sources
101. GOLDEN ARCHITECTURE RULE
     The system must never have this assumption:
     "TMDB ID = the movie"
     Instead:
     Internal Content ID
     ↓
     External IDs
     ↓
     Metadata
     ↓
     Availability
     ↓
     Playback Sources
     ↓
     User Entitlement
     This gives Lantawon Lang a real platform architecture instead of an API-dependent website.
102. SUPABASE MIGRATION ORDER
     Do NOT migrate everything at once.
     Phase 1:
     Supabase Auth
     Profiles
     User Settings
     Phase 2:
     Canonical Content
     External IDs
     Genres
     People
     Companies
     Phase 3:
     Library
     Watchlist
     Favorites
     Playlists
     Phase 4:
     Watch Progress
     Watch Sessions
     Phase 5:
     Providers
     Availability
     Regions
     Phase 6:
     Achievements
     XP
     Analytics
     Phase 7:
     Subscriptions
     Plans
     Entitlements
     Phase 8:
     Admin
     Audit Logs
     Phase 9:
     Recommendations
103. FINAL SUCCESS CRITERIA
     Before calling the Supabase migration complete:
     [ ] Auth works
     [ ] Profile works
     [ ] RLS works
     [ ] Catalog has stable internal IDs
     [ ] External IDs are separate
     [ ] Movies work
     [ ] TV works
     [ ] Episodes work
     [ ] People work
     [ ] Filmography works
     [ ] Companies work
     [ ] Provider availability works
     [ ] Region switching works
     [ ] Search works
     [ ] Filters work
     [ ] Watchlist works
     [ ] Favorites work
     [ ] Playlists work
     [ ] Watch progress works
     [ ] Continue Watching works
     [ ] Statistics work
     [ ] Achievements work
     [ ] XP events are auditable
     [ ] Subscriptions are server verified
     [ ] Entitlements are centralized
     [ ] Admin roles work
     [ ] Audit logs work
     [ ] Offline Local Vault remains separate
     [ ] External API failures do not destroy core app functionality
     [ ] No client-side secret/service-role key
     [ ] No unauthorized playback source is treated as an entitled source
104. FINAL DESIGN DIRECTION
     Visual language:
     Premium cinematic dark UI
     OLED-friendly backgrounds
     Large cinematic backdrops
     Clean typography
     High information density
     Minimal border noise
     Strong hierarchy
     Smooth hover states
     No unnecessary popups
     No intrusive UI while watching
     Fullscreen player remains clean
     Account and discovery complexity stays outside playback
     PLAYER PAGE MUST BE DIFFERENT FROM THE REST OF THE APP.
     While watching:
     NO intrusive modal
     NO random promotional popup
     NO unnecessary navigation
     NO distracting recommendation overlays
     The movie/show should dominate the screen.
105. FINAL PRODUCT POSITIONING
     Lantawon Lang should be architected as:
     "Cinematic Discovery + Personal Media Library + Availability Intelligence + Authorized Playback + Personalization"
     NOT:
     "Website containing every movie from random servers."
     The database, UI, subscription system, and backend should all follow that distinction.
