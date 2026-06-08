"use client";

import { useRouter } from "next/navigation";
import { Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Challenge } from "@/lib/types/database";

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const router = useRouter();
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(challenge.end_date).getTime() - Date.now()) / 86400000,
  ));
  const participantCount = challenge.participants?.length ?? 0;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-zinc-800/50"
      onClick={() => router.push(`/challenges/${challenge.id}`)}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug text-zinc-100">
            {challenge.title}
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            challenge.status === "active" ? "bg-blue-500/20 text-blue-400" :
            challenge.status === "completed" ? "bg-green-500/20 text-green-400" :
            challenge.status === "open" ? "bg-amber-500/20 text-amber-400" :
            "bg-zinc-500/20 text-zinc-400"
          }`}>
            {challenge.status}
          </span>
        </div>

        <p className="text-base font-bold text-zinc-100">
          {formatCurrency(challenge.stake)} / person
        </p>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {participantCount}/{challenge.max_participants}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" />
            {daysLeft > 0 ? `${daysLeft}d left` : "Ended"}
          </span>
          <span className="capitalize">{challenge.proof_frequency}</span>
        </div>
      </CardContent>
    </Card>
  );
}
