"use client";

import { createClient } from "@/lib/supabase/client";
import { PunkButton } from "./punk-button";
import { MarqueeBar } from "./marquee-bar";

const marqueeWords = [
  "YOUR VIBE",
  "YOUR SOUND",
  "YOUR DNA",
  "NO SKIPS",
  "VOLUME UP",
  "MAIN CHARACTER ENERGY",
  "CERTIFIED BANGER",
  "ON REPEAT",
];

export function LandingPage() {
  const supabase = createClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "spotify",
      options: {
        scopes:
          "user-read-recently-played user-top-read user-read-playback-state user-read-currently-playing",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-svh flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Background accent blobs */}
        <div className="absolute top-1/4 -left-20 w-60 h-60 bg-punk-pink/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-punk-cyan/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-punk-purple/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          {/* Logo / Brand */}
          <div className="mb-8">
            <div className="inline-block bg-punk-pink px-3 py-1 -rotate-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                Beta
              </span>
            </div>
            <h1 className="font-display text-6xl sm:text-7xl font-bold tracking-tighter leading-none glitch-text">
              VIBE
              <br />
              <span className="text-punk-pink">BIFY</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-2 max-w-xs">
            Discover your{" "}
            <span className="text-punk-yellow font-bold">music DNA</span>. See
            what you actually listen to — not what you tell people you do.
          </p>

          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-8">
            <span className="punk-strike">basic playlists</span> → real stats
          </p>

          {/* CTA */}
          <PunkButton onPress={signIn} size="lg" skew>
            <SpotifyIcon />
            Connect Spotify
          </PunkButton>

          <p className="text-[10px] text-muted-foreground mt-4">
            We only read your listening data. Never post or modify anything.
          </p>
        </div>
      </main>

      {/* Marquee */}
      <MarqueeBar items={marqueeWords} speed="fast" />

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Made with noise & distortion
        </p>
      </footer>
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
