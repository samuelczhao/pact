"use client";

import { useState, useEffect } from "react";
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
import { formatCurrency } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types/database";

export function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) setEntries(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-zinc-800" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-zinc-400">No data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-400">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2">User</th>
                  <th className="pb-2 pr-2 text-right">Rate</th>
                  <th className="pb-2 pr-2 text-right">Streak</th>
                  <th className="pb-2 pr-2 text-right">Lost</th>
                  <th className="pb-2 text-right">At Risk</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={entry.user_id}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="py-2 pr-2 text-zinc-400">
                      {i + 1}
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {entry.avatar_url && (
                            <AvatarImage
                              src={entry.avatar_url}
                              alt={entry.display_name}
                            />
                          )}
                          <AvatarFallback>
                            {entry.display_name
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-zinc-100 truncate max-w-[120px]">
                          {entry.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right text-zinc-100">
                      {entry.completion_rate}%
                    </td>
                    <td className="py-2 pr-2 text-right text-zinc-100">
                      {entry.current_streak}
                    </td>
                    <td className="py-2 pr-2 text-right font-medium text-red-400">
                      {formatCurrency(entry.money_lost)}
                    </td>
                    <td className="py-2 text-right font-medium text-yellow-400">
                      {formatCurrency(entry.money_at_risk)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
