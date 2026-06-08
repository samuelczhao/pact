"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, DollarSign, User, FileText, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/commitments/status-badge";
import { ProofSubmitForm } from "@/components/commitments/proof-submit-form";
import { VerifyProofCard } from "@/components/commitments/verify-proof-card";
import { VenmoPayButton } from "@/components/commitments/venmo-pay-button";
import { CommentSection } from "@/components/commitments/comment-section";
import {
  formatCurrency,
  formatDeadline,
  isEditable,
} from "@/lib/utils";
import type { Commitment } from "@/lib/types/database";

async function fetchDetail(
  id: string,
  setCommitment: (c: Commitment) => void,
  setUserId: (id: string) => void,
  setLoading: (l: boolean) => void,
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) setUserId(user.id);

  const res = await fetch(`/api/commitments/${id}`);
  if (res.ok) {
    setCommitment(await res.json());
  }
  setLoading(false);
}

interface PactDetailContentProps {
  commitmentId: string;
  hideBackButton?: boolean;
}

export function PactDetailContent({ commitmentId, hideBackButton = false }: PactDetailContentProps) {
  const router = useRouter();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchDetail(
      commitmentId,
      (c) => { if (!cancelled) setCommitment(c); },
      (uid) => { if (!cancelled) setUserId(uid); },
      (l) => { if (!cancelled) setLoading(l); },
    );

    return () => { cancelled = true; };
  }, [commitmentId, refreshKey]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!commitment) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-sm text-zinc-400">Commitment not found</p>
      </div>
    );
  }

  const isCreator = userId === commitment.creator_id;
  const isLegacyPartner = userId === commitment.partner_id;
  const isJunctionPartner = commitment.commitment_partners?.some(
    (p) => p.partner_id === userId,
  );
  const isPartner = isLegacyPartner || !!isJunctionPartner;
  const canEdit = isCreator && isEditable(commitment.editable_until);
  const canSubmitProof =
    isCreator &&
    (commitment.status === "active" ||
      commitment.status === "pending_proof" ||
      commitment.status === "completed" ||
      commitment.status === "awaiting_verification");
  const canSelfReport =
    isCreator &&
    !commitment.deadline &&
    commitment.status === "active";
  const canVerify =
    isPartner && commitment.status === "awaiting_verification";
  const showVenmo = isCreator && commitment.status === "failed";

  const partners = commitment.commitment_partners ?? [];
  const partnerNames: string[] = [];
  if (partners.length > 0) {
    for (const cp of partners) {
      partnerNames.push(cp.profile?.display_name ?? cp.partner_name ?? "Unknown");
    }
  } else if (commitment.partner?.display_name || commitment.partner_name) {
    partnerNames.push(commitment.partner?.display_name ?? commitment.partner_name ?? "");
  }
  const partnerDisplay = partnerNames.length > 0 ? partnerNames.join(", ") : "No partner";
  const partnerCount = partners.length > 0 ? partners.length : (commitment.partner_id ? 1 : 0);
  const splitAmount = partnerCount > 0 ? commitment.amount / partnerCount : commitment.amount;

  const reload = () => setRefreshKey((k) => k + 1);

  return (
    <>
      {!hideBackButton && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">
              {commitment.title}
            </CardTitle>
            <StatusBadge status={commitment.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {commitment.description && (
            <p className="text-sm text-zinc-300">
              {commitment.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={<DollarSign className="size-4" />}
              label="Amount"
              value={formatCurrency(commitment.amount)}
            />
            <DetailItem
              icon={<Clock className="size-4" />}
              label="Deadline"
              value={commitment.deadline ? `Due ${formatDeadline(commitment.deadline)}` : "No deadline"}
            />
            <DetailItem
              icon={<User className="size-4" />}
              label="Creator"
              value={
                commitment.creator?.display_name ?? "Unknown"
              }
            />
            <DetailItem
              icon={<User className="size-4" />}
              label="Partner"
              value={partnerDisplay}
            />
          </div>

          {commitment.proof_requirement && (
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 size-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">
                  Proof required
                </p>
                <p className="text-sm text-zinc-200">
                  {commitment.proof_requirement}
                </p>
              </div>
            </div>
          )}

          {canEdit && (
            <>
              <Separator />
              <EditPactInline commitment={commitment} onSaved={reload} />
            </>
          )}

          {canSelfReport && (
            <>
              <Separator />
              <SelfReportButtons commitmentId={commitment.id} hasPartners={partnerCount > 0} onReported={reload} />
            </>
          )}
        </CardContent>
      </Card>

      {canSubmitProof && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{commitment.proof_text || commitment.proof_url ? "Update Proof" : "Submit Proof"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProofSubmitForm
                commitmentId={commitment.id}
                onSubmitted={reload}
                existingProofText={commitment.proof_text}
                existingProofUrl={commitment.proof_url}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {canVerify && (
        <div className="mt-6">
          <VerifyProofCard
            commitment={commitment}
            onVerified={reload}
          />
        </div>
      )}

      {showVenmo && partners.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-300">
            Pay {formatCurrency(splitAmount)} to each partner
          </h3>
          {partners.map((cp) => (
            <VenmoPayButton
              key={cp.id}
              venmoUsername={cp.profile?.venmo_username ?? null}
              amount={splitAmount}
              pactTitle={commitment.title}
              partnerName={cp.profile?.display_name ?? cp.partner_name ?? undefined}
            />
          ))}
        </div>
      ) : showVenmo ? (
        <div className="mt-6">
          <VenmoPayButton
            venmoUsername={commitment.partner?.venmo_username ?? null}
            amount={commitment.amount}
            pactTitle={commitment.title}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <CommentSection commitmentId={commitment.id} />
      </div>
    </>
  );
}

function EditPactInline({
  commitment,
  onSaved,
}: {
  commitment: Commitment;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(commitment.title);
  const [description, setDescription] = useState(commitment.description ?? "");
  const [amount, setAmount] = useState(String(commitment.amount));
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil className="size-4" />
        Edit Pact
      </Button>
    );
  }

  async function handleSave() {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Title and valid amount are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/commitments/${commitment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          amount: parsedAmount,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save");
      }
      toast.success("Pact updated");
      setEditing(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <Input
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SelfReportButtons({
  commitmentId,
  hasPartners,
  onReported,
}: {
  commitmentId: string;
  hasPartners: boolean;
  onReported: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function report(outcome: "completed" | "failed") {
    setLoading(true);
    try {
      if (outcome === "failed") {
        const res = await fetch(`/api/commitments/${commitmentId}/self-fail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Pact marked as failed.");
      } else if (hasPartners) {
        const res = await fetch(`/api/commitments/${commitmentId}/proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proof_text: "Self-reported: completed" }),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Marked as done. Waiting for partner verification.");
      } else {
        const res = await fetch(`/api/commitments/${commitmentId}/self-complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Pact completed!");
      }
      onReported();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1 bg-green-600 hover:bg-green-700"
        disabled={loading}
        onClick={() => report("completed")}
      >
        I did it
      </Button>
      <Button
        variant="destructive"
        className="flex-1"
        disabled={loading}
        onClick={() => report("failed")}
      >
        I failed
      </Button>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-zinc-400">{icon}</span>
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
