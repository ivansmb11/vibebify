/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LandingPage } from "@/components/landing-page";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-punk-pink border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold">
            Loading
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Dashboard
      user={user}
      onSignOut={async () => {
        await supabase.auth.signOut();
        setUser(null);
      }}
    />
  );
}
