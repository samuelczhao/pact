"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const errorMsg = searchParams.get("error");

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-xl bg-card p-8 ring-1 ring-foreground/10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Pact</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>
      {errorMsg && (
        <p className="text-sm text-red-400">
          Sign in failed. Please try again.
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Continue with Google"}
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
