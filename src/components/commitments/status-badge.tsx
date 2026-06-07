"use client";

import { STATUS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CommitmentStatus } from "@/lib/types/database";

interface StatusBadgeProps {
  status: CommitmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
