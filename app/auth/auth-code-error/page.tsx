"use client";

import { useEffect, useState } from "react";
import { PunkButton } from "@/components/punk-button";

export default function AuthCodeError() {
  const [errorInfo, setErrorInfo] = useState({
    error: "",
    description: "",
  });

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const search = new URLSearchParams(window.location.search);

    setErrorInfo({
      error: params.get("error") ?? search.get("error") ?? "Unknown error",
      description:
        params.get("error_description") ??
        search.get("error_description") ??
        "Something went wrong during authentication.",
    });
  }, []);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full flex flex-col items-center text-center gap-6">
        <div className="bg-punk-red/10 border-2 border-punk-red px-4 py-2 -skew-x-3">
          <span className="skew-x-3 block text-punk-red text-xs font-bold uppercase tracking-widest">
            Auth Error
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          {errorInfo.error.replace(/_/g, " ")}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {decodeURIComponent(errorInfo.description).replace(/\+/g, " ")}
        </p>

        <PunkButton
          onPress={() => (window.location.href = "/")}
          variant="outline"
          size="md"
        >
          Back to Home
        </PunkButton>
      </div>
    </div>
  );
}
