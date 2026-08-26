-- ============================================================================
-- MIGRATION 09: ROW-LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- Lantawon Lang Master Database Schema (Section 64, 65)
-- ============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_external_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playback_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followed_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. PUBLIC READ-ONLY POLICIES (Catalog & Global Registries)
-- ----------------------------------------------------------------------------

CREATE POLICY "Public profiles can be viewed by everyone"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Public catalog content is readable by all"
    ON public.content FOR SELECT USING (true);

CREATE POLICY "Public external IDs are readable by all"
    ON public.content_external_ids FOR SELECT USING (true);

CREATE POLICY "Public genres are readable by all"
    ON public.content_genres FOR SELECT USING (true);

CREATE POLICY "Public origin countries are readable by all"
    ON public.content_countries FOR SELECT USING (true);

CREATE POLICY "Public seasons are readable by all"
    ON public.seasons FOR SELECT USING (true);

CREATE POLICY "Public episodes are readable by all"
    ON public.episodes FOR SELECT USING (true);

CREATE POLICY "Public people profiles are readable by all"
    ON public.people FOR SELECT USING (true);

CREATE POLICY "Public credits are readable by all"
    ON public.credits FOR SELECT USING (true);

CREATE POLICY "Public companies are readable by all"
    ON public.companies FOR SELECT USING (true);

CREATE POLICY "Public content companies are readable by all"
    ON public.content_companies FOR SELECT USING (true);

CREATE POLICY "Public collections are readable by all"
    ON public.collections FOR SELECT USING (true);

CREATE POLICY "Public collection items are readable by all"
    ON public.collection_items FOR SELECT USING (true);

CREATE POLICY "Public watch providers are readable by all"
    ON public.watch_providers FOR SELECT USING (true);

CREATE POLICY "Public content availability is readable by all"
    ON public.content_availability FOR SELECT USING (true);

CREATE POLICY "Active playback sources are readable by authenticated users"
    ON public.playback_sources FOR SELECT USING (is_active = true);

CREATE POLICY "Public achievements registry is readable by all"
    ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Public subscription plans are readable by all"
    ON public.subscription_plans FOR SELECT USING (is_active = true);

CREATE POLICY "Public reviews are readable by all"
    ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Public playlists are readable if marked public or owned"
    ON public.playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. USER TENANT-ISOLATION POLICIES (Read & Write Own Data)
-- ----------------------------------------------------------------------------

-- Profiles & Preferences
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own preferences"
    ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- User Watchlist
CREATE POLICY "Users can manage their own watchlist"
    ON public.user_watchlist FOR ALL USING (auth.uid() = user_id);

-- User Favorites
CREATE POLICY "Users can manage their own favorites"
    ON public.user_favorites FOR ALL USING (auth.uid() = user_id);

-- Playlists & Items
CREATE POLICY "Users can manage their own playlists"
    ON public.playlists FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items in their own playlists"
    ON public.playlist_items FOR ALL USING (
        EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
    );

-- Followed Entities
CREATE POLICY "Users can manage their own followed entities"
    ON public.user_followed_entities FOR ALL USING (auth.uid() = user_id);

-- Watch Progress & Sessions
CREATE POLICY "Users can manage their own watch progress"
    ON public.watch_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert and view their own watch sessions"
    ON public.watch_sessions FOR ALL USING (auth.uid() = user_id);

-- Gamification (Achievements & XP Events)
CREATE POLICY "Users can view and claim their own achievements"
    ON public.user_achievements FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP events"
    ON public.xp_events FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions & Entitlements
CREATE POLICY "Users can view their own subscriptions"
    ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own entitlements"
    ON public.entitlements FOR SELECT USING (auth.uid() = user_id);

-- Social & Reviews
CREATE POLICY "Users can manage their own reviews"
    ON public.reviews FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own review likes"
    ON public.review_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their following graph"
    ON public.user_followers FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can view their own activity feed"
    ON public.activity_feed FOR SELECT USING (auth.uid() = user_id);
