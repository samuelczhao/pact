"use client";

import { useParams } from "next/navigation";
import { PactDetailContent } from "@/components/commitments/pact-detail-content";

export default function CommitmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <PactDetailContent commitmentId={id} />
    </div>
  );
}
