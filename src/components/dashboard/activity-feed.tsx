"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Commitment } from "@/lib/types/database";

const MAX_FEED_ITEMS = 20;

const ACTION_MAP: Record<string, string> = {
  active: "created",
  pending_proof: "needs proof for",
  awaiting_verification: "submitted proof for",
  completed: "completed",
  failed: "failed",
};

type FeedCommitment = Commitment & {
  creator?: { display_name: string | null; avatar_url: string | null };
};

export function ActivityFeed() {
  const [items, setItems] = useState<FeedCommitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("commitments")
        .select(
          "*, creator:profiles!creator_id(display_name, avatar_url), commitment_partners(partner_name, profile:profiles!partner_id(display_name))",
        )
        .order("updated_at", { ascending: false })
        .limit(MAX_FEED_ITEMS);

      if (data) setItems(data as FeedCommitment[]);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commitments" },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-zinc-800" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-400">No activity yet</p>
        ) : null}
        {items.map((item) => {
          const name =
            item.creator?.display_name ?? "Someone";
          const action = ACTION_MAP[item.status] ?? item.status;

          return (
            <div key={item.id} className="flex items-start gap-2">
              <Avatar size="sm">
                {item.creator?.avatar_url && (
                  <AvatarImage
                    src={item.creator.avatar_url}
                    alt={name}
                  />
                )}
                <AvatarFallback>
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm">
                <p className="text-zinc-100">
                  <span className="font-medium">{name}</span>{" "}
                  {action}{" "}
                  <span className="text-zinc-300">
                    &quot;{item.title}&quot;
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(item.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
