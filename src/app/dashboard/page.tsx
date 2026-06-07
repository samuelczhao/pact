"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeftPanel } from "@/components/dashboard/left-panel";
import { SocialFeed } from "@/components/dashboard/social-feed";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <LeftPanel />
    </div>
  );
}
