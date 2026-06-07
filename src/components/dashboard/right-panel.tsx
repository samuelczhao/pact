"use client";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";

export function RightPanel() {
  return (
    <div className="flex flex-col gap-4">
      <ActivityFeed />
      <LeaderboardTable />
    </div>
  );
}
