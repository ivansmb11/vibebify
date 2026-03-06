import { z } from "zod/v4";

// ─── Primitives ───

export const uuid = z.uuid();

export const spotifyId = z.string().max(64).optional();

export const imageUrl = z.url().max(2048).optional();

export const cursor = z.iso.datetime().optional();

// ─── Posts ───

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(500, "Content too long (max 500)"),
  song_title: z.string().min(1, "Song title is required").max(300),
  song_artist: z.string().min(1, "Song artist is required").max(300),
  song_album: z.string().max(300).optional(),
  song_image_url: imageUrl,
  spotify_track_id: spotifyId,
  musicbrainz_id: z.string().max(64).optional(),
});

// ─── Comments ───

export const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required").max(300, "Comment too long (max 300)"),
});

// ─── Follow ───

export const followSchema = z.object({
  following_id: uuid,
});

// ─── Duels ───

export const createDuelSchema = z.object({
  opponent_id: uuid.optional(),
  creator_song_title: z.string().min(1, "Song title is required").max(300),
  creator_song_artist: z.string().min(1, "Song artist is required").max(300),
  creator_song_image_url: imageUrl,
  creator_spotify_track_id: spotifyId,
});

export const acceptDuelSchema = z.object({
  opponent_song_title: z.string().min(1, "Song title is required").max(300),
  opponent_song_artist: z.string().min(1, "Song artist is required").max(300),
  opponent_song_image_url: imageUrl,
  opponent_spotify_track_id: spotifyId,
});

export const voteDuelSchema = z.object({
  voted_for: z.enum(["creator", "opponent"]),
});

// ─── Spotify ───

export const spotifyTopQuerySchema = z.object({
  type: z.enum(["artists", "tracks"]).default("artists"),
  time_range: z.enum(["short_term", "medium_term", "long_term"]).default("medium_term"),
});

// ─── Search ───

export const searchQuerySchema = z.object({
  q: z.string().min(2, "Query too short").max(100, "Query too long"),
});

// ─── Music catalog: upsert payloads ───

export const upsertSongSchema = z.object({
  title: z.string().min(1).max(500),
  artist_names: z.array(z.string().min(1).max(300)).min(1),
  album_name: z.string().max(300).optional(),
  image_url: imageUrl,
  spotify_track_id: spotifyId,
  musicbrainz_id: z.string().max(64).optional(),
  preview_url: z.url().max(2048).optional(),
  duration_ms: z.number().int().positive().optional(),
});

export const upsertArtistSchema = z.object({
  name: z.string().min(1).max(300),
  spotify_artist_id: spotifyId,
  image_url: imageUrl,
  genres: z.array(z.string().min(1).max(100)).optional(),
});
