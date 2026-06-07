"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, venmo_username")
        .eq("id", user.id)
        .single<Pick<Profile, "display_name" | "venmo_username">>();

      if (error) {
        toast.error("Failed to load profile.");
        return;
      }

      if (data) {
        setDisplayName(data.display_name ?? "");
        setVenmoUsername(data.venmo_username ?? "");
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        venmo_username: venmoUsername,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("Failed to save settings.");
      return;
    }

    toast.success("Settings saved.");
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 pt-12">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 ring-1 ring-foreground/10">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Update your profile information.
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
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>
    </div>
  );
}
