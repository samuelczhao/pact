"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeftPanel } from "@/components/dashboard/left-panel";
import { SocialFeed } from "@/components/dashboard/social-feed";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Tabs defaultValue="pacts">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="pacts">My Pacts</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="pacts">
          <LeftPanel />
        </TabsContent>

        <TabsContent value="feed">
          <SocialFeed />
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
