import { Inbox } from "lucide-react";
import { PactCard } from "@/components/commitments/pact-card";
import type { Commitment } from "@/lib/types/database";

interface PactListProps {
  commitments: Commitment[];
  emptyMessage: string;
  onCardClick?: (id: string) => void;
}

export function PactList({ commitments, emptyMessage, onCardClick }: PactListProps) {
  if (commitments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Inbox className="size-8 text-zinc-600" />
        <p className="text-sm text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {commitments.map((c) => (
        <PactCard key={c.id} commitment={c} onCardClick={onCardClick} />
      ))}
    </div>
  );
}
