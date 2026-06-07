"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CreatePactDialog } from "@/components/commitments/create-pact-dialog";
import { PactList } from "@/components/commitments/pact-list";
import { SocialFeed } from "@/components/dashboard/social-feed";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import type { Commitment } from "@/lib/types/database";

const MY_PACT_STATUSES = new Set([
  "active",
  "pending_proof",
  "awaiting_verification",
]);
const HISTORY_STATUSES = new Set(["completed", "failed"]);

async function fetchCommitments(
  setCommitments: (c: Commitment[]) => void,
  setUserId: (id: string) => void,
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  setUserId(user.id);

  const { data: partnerCommitmentIds } = await supabase
    .from("commitment_partners")
    .select("commitment_id")
    .eq("partner_id", user.id);

  const partnerIds = (partnerCommitmentIds ?? []).map((r) => r.commitment_id);
  const idFilter = partnerIds.length > 0
    ? `creator_id.eq.${user.id},partner_id.eq.${user.id},id.in.(${partnerIds.join(",")})`
    : `creator_id.eq.${user.id},partner_id.eq.${user.id}`;

  const { data } = await supabase
    .from("commitments")
    .select(
      "*, creator:profiles!creator_id(*), partner:profiles!partner_id(*), commitment_partners(*, profile:profiles!partner_id(*))",
    )
    .or(idFilter)
    .order("created_at", { ascending: false });

  if (data) {
    const now = new Date();
    const expired = data.filter(
      (c) => c.status === "active" && c.deadline && new Date(c.deadline) < now,
    );
    if (expired.length > 0) {
      await supabase
        .from("commitments")
        .update({ status: "pending_proof" })
        .in("id", expired.map((c) => c.id))
        .eq("status", "active");
      for (const c of expired) {
        (c as Commitment).status = "pending_proof";
      }
    }
    setCommitments(data as Commitment[]);
  }
}

export function LeftPanel() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const wrappedSet = (c: Commitment[]) => {
      if (!cancelled) {
        setCommitments(c);
        setLoading(false);
      }
    };
    const wrappedSetId = (id: string) => {
      if (!cancelled) setUserId(id);
    };

    fetchCommitments(wrappedSet, wrappedSetId);

    const supabase = createClient();
    const refetch = () => fetchCommitments(wrappedSet, wrappedSetId);
    const channel = supabase
      .channel("my-commitments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commitments" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commitment_partners" },
        refetch,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [refreshKey]);

  const myPacts = commitments.filter(
    (c) => c.creator_id === userId && MY_PACT_STATUSES.has(c.status),
  );
  const watching = commitments.filter(
    (c) =>
      c.creator_id !== userId &&
      (c.partner_id === userId ||
        c.commitment_partners?.some((p) => p.partner_id === userId)),
  );
  const history = commitments.filter(
    (c) => c.creator_id === userId && HISTORY_STATUSES.has(c.status),
  );

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="my-pacts">
        <div className="flex items-center justify-between gap-4">
          <TabsList variant="line" className="flex-1">
          <TabsTrigger value="my-pacts">
            Active{myPacts.length > 0 ? ` (${myPacts.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="watching">
            Watching{watching.length > 0 ? ` (${watching.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="leaderboard">Board</TabsTrigger>
          </TabsList>
          <CreatePactDialog
            onCreated={() => setRefreshKey((k) => k + 1)}
          />
        </div>

        <TabsContent value="my-pacts" className="mt-4">
          {loading ? (
            <Skeleton />
          ) : (
            <PactList
              commitments={myPacts}
              emptyMessage="No active pacts. Create one to get started."
            />
          )}
        </TabsContent>

        <TabsContent value="watching" className="mt-4">
          {loading ? (
            <Skeleton />
          ) : (
            <PactList
              commitments={watching}
              emptyMessage="No pacts where you're a partner."
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {loading ? (
            <Skeleton />
          ) : (
            <PactList
              commitments={history}
              emptyMessage="No completed or failed pacts yet."
            />
          )}
        </TabsContent>

        <TabsContent value="feed" className="mt-4">
          <SocialFeed />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-800/50" />
      ))}
    </div>
  );
}
