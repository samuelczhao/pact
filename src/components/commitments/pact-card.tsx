"use client";

import { useRouter } from "next/navigation";
import { Clock, User, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/commitments/status-badge";
import { RoastButton } from "@/components/commitments/roast-button";
import { formatCurrency, formatDeadline, minutesRemaining } from "@/lib/utils";
import type { Commitment } from "@/lib/types/database";

interface PactCardProps {
  commitment: Commitment;
  onCardClick?: (id: string) => void;
  userId?: string | null;
}

export function PactCard({ commitment, onCardClick, userId }: PactCardProps) {
  const router = useRouter();

  const creatorName = commitment.creator?.display_name ?? "Unknown";

  const partnerNames: string[] = [];
  if (commitment.commitment_partners && commitment.commitment_partners.length > 0) {
    for (const cp of commitment.commitment_partners) {
      partnerNames.push(cp.profile?.display_name ?? cp.partner_name ?? "Unknown");
    }
  } else if (commitment.partner?.display_name || commitment.partner_name) {
    partnerNames.push(commitment.partner?.display_name ?? commitment.partner_name ?? "");
  }
  const partnerDisplay = partnerNames.length > 0 ? partnerNames.join(", ") : "No partner";

  const minsLeft = commitment.deadline ? minutesRemaining(commitment.deadline) : null;
  const isUrgent =
    commitment.status === "active" && minsLeft !== null && minsLeft > 0 && minsLeft <= 1440;
  const isOverdue =
    commitment.status === "active" && minsLeft !== null && minsLeft <= 0;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-zinc-800/50"
      onClick={() => onCardClick ? onCardClick(commitment.id) : router.push(`/commitments/${commitment.id}`)}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-100 leading-snug">
            {commitment.title}
          </h3>
          <StatusBadge status={commitment.status} />
        </div>

        <p className="text-base font-bold text-zinc-100">
          {formatCurrency(commitment.amount)}
        </p>

        {isUrgent && (
          <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400">
            <AlertTriangle className="size-3" />
            Due {minsLeft < 60
              ? `in ${minsLeft}m`
              : `in ${Math.round(minsLeft / 60)}h`}
            {userId === commitment.creator_id && " · submit proof soon"}
          </div>
        )}

        {isOverdue && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
            <AlertTriangle className="size-3" />
            Overdue{userId === commitment.creator_id && " · submit proof now"}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {commitment.deadline ? `Due ${formatDeadline(commitment.deadline)}` : "No deadline"}
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="size-3" />
              {creatorName} 👀 by {partnerDisplay}
            </span>
          </div>
          {(commitment.status === "active" || commitment.status === "pending_proof") && (
            <RoastButton title={commitment.title} amount={commitment.amount} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
