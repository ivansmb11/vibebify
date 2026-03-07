# CLAUDE.md — Vibebify

## Overview

Vibebify is a music-focused social media web app. Users sign in with Spotify, see their listening stats, share posts about songs, follow other users, view genre breakdowns, compete in song duels, and maintain daily posting streaks.

**Live:** https://vibebify.ivanmendoza.dev/

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **Package manager:** Bun (always use `bun` — never npm/yarn)
- **Backend:** Supabase (project ref: `ybpukaknozasydpdxajh`)
- **Auth:** Spotify OAuth via Supabase Auth provider
- **UI:** React Aria Components + Tailwind CSS v4
- **Styling:** Dark theme, punk/rock aesthetic with custom CSS variables
- **Font:** Clash Display (variable, `font-display` class)
- **Haptics:** Web Vibration API (`lib/haptics.ts`)

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Dev server
bun run build        # Production build
bun run lint         # ESLint
```

## Project Structure

```
app/
├── page.tsx                          # Entry: LandingPage (unauthed) or Dashboard (authed)
├── layout.tsx                        # Root layout, dark mode, Geist + Clash Display fonts
├── globals.css                       # Tailwind v4, punk CSS variables, animations
├── auth/
│   ├── callback/route.ts             # OAuth callback, stores Spotify provider_token
│   └── auth-code-error/page.tsx      # OAuth error page
└── api/                              # Only 3 routes (require server secrets)
    ├── spotify/
    │   ├── recently-played/route.ts  # GET — recently played tracks (auto token refresh)
    │   └── top/route.ts              # GET — top artists/tracks (?type=&time_range=)
    └── search/
        └── music/route.ts            # GET — search MusicBrainz recordings

components/
├── dashboard.tsx         # Main app shell: tabs, bottom nav, all feature orchestration
├── landing-page.tsx      # Hero with glitch text, Spotify OAuth CTA, marquee
├── punk-button.tsx       # React Aria Button (primary/outline/ghost/danger), skew option
├── marquee-bar.tsx       # Scrolling text banner
├── track-card.tsx        # Song list item with rank, album art
├── artist-card.tsx       # Artist card with rank badge, circular image, genres
├── section-header.tsx    # Section title with colored accent bar
├── time-range-tabs.tsx   # React Aria Tabs for short/medium/long term
├── stat-badge.tsx        # Skewed stat display
├── post-card.tsx         # Social post with song attachment, like/comment/delete
├── comments-sheet.tsx    # Bottom sheet modal for comments
├── compose-post.tsx      # Modal: create post, pick from Spotify or search MusicBrainz
├── user-search.tsx       # Debounced user search with follow/unfollow
├── user-profile.tsx      # Full profile view with stats, posts, follow button
├── streak-badge.tsx      # Flame icon + streak count, color tiers (3+/7+/30+)
├── genre-dna-card.tsx    # Pie chart DNA viz + Canvas story image generator (1080x1920)
├── duel-card.tsx         # Two-sided duel display with vote bars, accept button
└── create-duel.tsx       # Modal: create/accept duels, pick a song

lib/
├── db.ts                 # Client service layer (18 direct Supabase operations)
├── validations.ts        # Zod v4 input validation schemas
├── api.ts                # API route helpers (for remaining 3 server routes)
├── supabase/client.ts    # Browser Supabase client
├── supabase/server.ts    # Server Supabase client (cookies)
├── supabase/middleware.ts # Session refresh helper
├── spotify.ts            # Spotify API helpers (token refresh, fetch, getRecentlyPlayed, etc.)
├── musicbrainz.ts        # MusicBrainz search/get recordings
└── haptics.ts            # Web Vibration API wrapper (light/medium/heavy/success/error)

middleware.ts             # Next.js middleware — Supabase session refresh

supabase/migrations/
├── 20260306000000_create_profiles_and_history.sql  # profiles, listening_history, top_items, RLS
├── 20260306010000_social_features.sql              # follows, posts, likes, comments, triggers
├── 20260306020000_streaks_dna_duels.sql            # streaks, duels, duel_votes, triggers
├── 20260306030000_fix_duel_accept_rls.sql          # RLS fix for duel acceptance
├── 20260306040000_music_catalog.sql                # normalized genres, artists, songs tables
├── 20260306050000_catalog_functions.sql            # upsert_genre, upsert_artist, upsert_song
└── 20260306060000_query_functions.sql              # get_user_profile, accept_duel
```

## Database Schema (Supabase)

### Core Tables
- **profiles** — extends auth.users (id, display_name, avatar_url, created_at, current_streak, longest_streak, last_post_date). Auto-created via trigger on signup.
- **follows** — follower_id → following_id (unique constraint)
- **posts** — user_id, content (500 char), song fields (title, artist, image_url, spotify_track_id, musicbrainz_id), denormalized likes_count/comments_count
- **likes** — user_id + post_id (unique constraint)
- **comments** — post_id, user_id, content (300 char)
- **duels** — creator/opponent songs, status (open/active/finished), vote counts, 24h expiry
- **duel_votes** — duel_id, user_id, voted_for (unique per user/duel)

### Triggers
- **Post insert** → streak calculation (consecutive days → increment, else reset to 1)
- **Like insert/delete** → update posts.likes_count
- **Comment insert/delete** → update posts.comments_count
- **Duel vote insert** → update duels.creator_votes/opponent_votes

### RLS
- Profiles: publicly readable, self-update only
- Posts/comments/likes: authenticated insert, self-delete
- Follows: authenticated insert, self-delete
- Duels: authenticated create, status-gated accept/vote

## Key Features

### 1. Spotify Integration
- OAuth via Supabase Auth (provider_token stored in user metadata)
- Auto token refresh on 401 in API routes
- Recently played, top artists, top tracks (short/medium/long term)

### 2. Social Feed
- Tabs: Feed (following) / Discover (global)
- Posts with optional song attachments (Spotify recent tracks or MusicBrainz search)
- Likes, comments (bottom sheet modal), delete own posts
- User search, profiles, follow/unfollow

### 3. Streaks
- Daily posting streak tracked via DB trigger
- StreakBadge with color tiers: default → orange (3+) → cyan (7+) → purple (30+)
- Displayed in feed banner and profile

### 4. Genre DNA Card
- Donut pie chart from top artist genres with profile pic in center
- Animated SVG in-app (scale/rotate entrance, spinning accent ring, staggered genre pills)
- Share generates 1080x1920 Canvas image (IG story size)
- Watermarks: VIBEBIFY logo, @ivannsmb, vibebify.ivanmendoza.dev
- Shows top 3 artists with medal icons

### 5. Song Duels
- Create duel → pick a song → wait for opponent
- Opponent accepts → picks their song → duel goes "active" (24h)
- Community votes, vote bar visualization
- Status: open → active → finished

## Design System

### CSS Variables (globals.css)
```
--punk-pink: #ff2d7b    --punk-yellow: #f5e642
--punk-cyan: #00f0ff    --punk-purple: #b44dff
--punk-orange: #ff6b2b
```

### Patterns
- Skewed elements (`-skew-x-3` with inner `skew-x-3`) for punk feel
- `font-display` for headings (Clash Display)
- Uppercase tracking-wider labels for section headers
- Bottom sheet modals with drag handle on mobile
- Web haptics on all interactive elements

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
MUSICBRAINZ_CLIENT_ID
MUSICBRAINZ_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL
```

## External Services
- **Supabase** — DB, Auth, RLS
- **Spotify Web API** — listening data, OAuth
- **MusicBrainz API** — music search (fallback when Spotify track not in recents)

## Architecture Notes

### Client-first with direct Supabase calls
- Most CRUD operations go through `lib/db.ts` (browser Supabase client) — no API middleman
- Only 3 API routes remain, all requiring server secrets (Spotify token refresh, MusicBrainz proxy)
- Supabase RLS handles authorization at the database level
- DB functions (`security definer`, `plpgsql`) handle atomic operations (e.g., `accept_duel` with row locking)
- Zod v4 schemas in `lib/validations.ts` validate all user inputs before DB calls

### General
- Spotify token refresh happens automatically in API routes on 401
- Supabase queries use foreign key hints for joins (e.g., `profiles!posts_user_id_fkey`)
- The app is a single-page client component — `app/page.tsx` renders LandingPage or Dashboard based on auth state
- Dashboard uses client-side tab navigation (MainTab: feed/discover/search/duels/stats/profile)
