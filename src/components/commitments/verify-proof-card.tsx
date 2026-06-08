"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { Commitment } from "@/lib/types/database";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

function isImageUrl(url: string): boolean {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
  return ext ? IMAGE_EXTENSIONS.has(ext) : false;
}

interface VerifyProofCardProps {
  commitment: Commitment;
  onVerified: () => void;
}

export function VerifyProofCard({
  commitment,
  onVerified,
}: VerifyProofCardProps) {
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function handleVerify(approved: boolean) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/commitments/${commitment.id}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approved,
            ...(!approved && rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Verification failed");
      }

      toast.success(approved ? "Proof approved" : "Proof rejected");
      setRejectOpen(false);
      onVerified();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Proof</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {commitment.proof_requirement && (
          <div className="rounded-md bg-zinc-800/50 px-3 py-2">
            <p className="text-xs font-medium text-zinc-400">Required proof</p>
            <p className="text-sm text-zinc-300">{commitment.proof_requirement}</p>
          </div>
        )}

        {commitment.proof_text && (
          <div>
            <p className="mb-1 text-xs font-medium text-zinc-400">Submitted proof</p>
            <p className="text-sm text-zinc-100">{commitment.proof_text}</p>
          </div>
        )}

        {commitment.proof_url && (
          <div className="flex flex-col gap-2">
            {isImageUrl(commitment.proof_url) && (
              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src={commitment.proof_url}
                  alt="Proof"
                  width={500}
                  height={300}
                  className="w-full object-contain"
                  unoptimized
                />
              </div>
            )}
            <a
              href={commitment.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
            >
              <ExternalLink className="size-3" />
              View proof
            </a>
          </div>
        )}

        {commitment.ai_verdict !== null && commitment.ai_verdict !== undefined && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              commitment.ai_verdict
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <span className="font-medium">
              {commitment.ai_verdict ? "AI: Likely valid" : "AI: Insufficient"}
            </span>
            {commitment.ai_confidence !== null && (
              <span className="text-xs opacity-70">
                ({Math.round(commitment.ai_confidence * 100)}% confidence)
              </span>
            )}
            {commitment.ai_reason && (
              <span className="ml-1 text-xs opacity-70">
                — {commitment.ai_reason}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={loading}
            onClick={() => handleVerify(true)}
          >
            <CheckCircle className="size-4" />
            Approve
          </Button>

          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={loading}
                />
              }
            >
              <XCircle className="size-4" />
              Reject
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject proof?</DialogTitle>
                <DialogDescription>
                  This will mark the pact as failed. The creator will owe{" "}
                  {formatCurrency(commitment.amount)}. This cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reject-reason">
                  Reason (optional — creator will see this)
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Why are you rejecting? e.g., 'proof doesn't match the requirement'"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRejectOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={loading}
                  onClick={() => handleVerify(false)}
                >
                  Confirm Reject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
