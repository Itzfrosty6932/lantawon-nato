88. DATABASE QUALITY RULES
    Every external record must have:
    source
    external_id
    fetched_at
    updated_at
    Every relationship must have:
    foreign key
    unique constraint where appropriate
    Every user-owned record must have:
    user_id
    Every sensitive user table must have:
    RLS
    Every payment/subscription record must have:
    external provider reference
    server-side verification
89. DUPLICATE PREVENTION
    Create uniqueness rules such as:
    content_external_ids:
    UNIQUE(source, external_id)
    user_watchlist:
    UNIQUE(user_id, content_id)
    user_favorites:
    UNIQUE(user_id, content_id)
    user_followed_people:
    UNIQUE(user_id, person_id)
    user_followed_companies:
    UNIQUE(user_id, company_id)
90. INDEXING
    Important database indexes:
    content:
    release_date
    popularity_score
    vote_average
    content_type
    status
    content_external_ids:
    source
    external_id
    content_people:
    person_id
    content_id
    content_companies:
    company_id
    content_id
    content_availability:
    country_code
    provider_id
    availability_type
    content_id
    watch_progress:
    user_id
    last_watched_at
    analytics_events:
    user_id
    event_type
    occurred_at
91. SOFT DELETES / DATA LIFECYCLE
    For catalog records:
    Do not immediately delete.
    Use:
    is_active
    archived_at
    For user data:
    Use actual deletion according to account deletion requirements.
92. AUDIT LOG
    Create:
    audit_logs
    Fields:
    id
    actor_user_id
    action
    entity_type
    entity_id
    old_data
    new_data
    created_at
    Actions:
    catalog_updated
    content_removed
    subscription_changed
    admin_login
    user_banned
    source_disabled
93. CONTENT AVAILABILITY REFRESH
    Provider availability is time-sensitive.
    Store:
    last_checked_at
    Use jobs:
    refresh popular titles frequently
    refresh less popular titles less frequently
    refresh when user opens the title
    refresh when region changes
    Never assume provider availability is permanent.
94. PROVIDER CLICK TRACKING
    If the user clicks:
    "Watch on provider"
    create analytics event:
    provider_clicked
    Track:
    provider
    content
    region
    user
    timestamp
    This provides useful product analytics without pretending that the external provider is your own playback source.
95. DATA MODEL FOR TECHNICAL SPECS
    Create:
    content_media_specs
    Fields:
    content_id
    source_id nullable
    resolution
    width
    height
    hdr_type
    codec
    audio_codec
    audio_channels
    aspect_ratio
    frame_rate
    bitrate
    subtitle_support
    Important:
    Technical specs should be tied to an actual source/version when possible.
    Do not say a movie is automatically "4K" just because one provider has a 4K version.
96. CONTENT ADVISORY MODEL
    Create:
    content_advisories
    Fields:
    content_id
    advisory_type
    severity
    source
    notes
    Types:
    violence
    gore
    nudity
    sexual_content
    profanity
    substance_use
    frightening_content
    mature_themes
    Use:
    severity = none / mild / moderate / severe
97. COLLECTION MODEL
    Create:
    collections
    id
    name
    description
    poster_path
    backdrop_path
    collection_type
    Types:
    franchise
    universe
    saga
    editorial
    genre_collection
    decade
    country
    seasonal
    Then:
    collection_items
    collection_id
    content_id
    position
    relationship_type