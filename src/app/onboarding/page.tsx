"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name);
      }
    });
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!agreed) {
      toast.error("You must agree to the honor pledge");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        venmo_username: venmoUsername || null,
        onboarded: true,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save profile. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 ring-1 ring-foreground/10">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight">
            Complete your profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your account to get started.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="venmoUsername">Venmo username</Label>
            <div className="flex items-center gap-0">
              <span className="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="venmoUsername"
                className="rounded-l-none"
                value={venmoUsername}
                onChange={(e) => setVenmoUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="your-username"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Just the username, no @ needed
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 size-4 rounded border-zinc-600 accent-primary"
              />
              <span className="text-sm text-zinc-300">
                I pledge to honor every pact I make. If I fail a commitment,
                I will pay the agreed amount to my accountability partner
                via Venmo within 48 hours.
              </span>
            </label>
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading || !agreed}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
