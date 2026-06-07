"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Target, CheckCircle, XCircle, FileText } from "lucide-react";
import type { FeedEvent } from "@/lib/types/database";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created: <Target className="size-4 text-blue-400" />,
  proof_submitted: <FileText className="size-4 text-purple-400" />,
  completed: <CheckCircle className="size-4 text-green-400" />,
  failed: <XCircle className="size-4 text-red-400" />,
};

const EVENT_COLORS: Record<string, string> = {
  created: "border-l-blue-500/50",
  proof_submitted: "border-l-purple-500/50",
  completed: "border-l-green-500/50",
  failed: "border-l-red-500/50",
};

type FeedEventWithProfile = FeedEvent & {
  profile?: { display_name: string | null; avatar_url: string | null };
};

interface SocialFeedProps {
  onCardClick?: (id: string) => void;
}

export function SocialFeed({ onCardClick }: SocialFeedProps) {
  const router = useRouter();
  const [events, setEvents] = useState<FeedEventWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("feed_events")
        .select("*, profile:profiles!user_id(display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setEvents(data as FeedEventWithProfile[]);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("social-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_events" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Target className="size-8 text-zinc-600" />
        <p className="text-sm text-zinc-400">No activity yet</p>
        <p className="text-xs text-zinc-500">
          Public pacts will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => {
        const name = event.profile?.display_name ?? "Someone";
        const icon = EVENT_ICONS[event.event_type] ?? EVENT_ICONS.created;
        const borderColor = EVENT_COLORS[event.event_type] ?? "";

        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onCardClick ? onCardClick(event.commitment_id) : router.push(`/commitments/${event.commitment_id}`)}
            className={`flex items-start gap-3 rounded-lg border border-zinc-800 border-l-2 ${borderColor} bg-zinc-900/50 px-3 py-3 text-left transition-colors hover:bg-zinc-800/50`}
          >
            <Avatar>
              {event.profile?.avatar_url && (
                <AvatarImage
                  src={event.profile.avatar_url}
                  alt={name}
                />
              )}
              <AvatarFallback>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {icon}
                <p className="text-sm text-zinc-100 truncate">
                  {event.message}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatDistanceToNow(new Date(event.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
