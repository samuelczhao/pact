"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeadlinePicker } from "@/components/commitments/deadline-picker";
import {
  PartnerPicker,
  type PartnerEntry,
} from "@/components/commitments/partner-picker";

interface CreatePactDialogProps {
  onCreated: () => void;
}

export function CreatePactDialog({ onCreated }: CreatePactDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [partners, setPartners] = useState<PartnerEntry[]>([]);
  const [proofRequirement, setProofRequirement] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  function resetForm() {
    setTitle("");
    setDescription("");
    setAmount("");
    setDeadline(undefined);
    setPartners([]);
    setProofRequirement("");
    setIsPublic(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!deadline) {
      toast.error("Deadline is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          amount: parsedAmount,
          deadline: deadline.toISOString(),
          proof_requirement: proofRequirement.trim() || null,
          is_public: isPublic,
          partners: partners.map((p) => ({
            partner_id: p.partner_id ?? null,
            partner_name: p.partner_name ?? null,
            partner_email: p.partner_email ?? null,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create pact");
      }

      toast.success("Pact created");
      resetForm();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New Pact
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new pact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pact-title">Title</Label>
            <Input
              id="pact-title"
              placeholder="What are you committing to?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pact-desc">Description (optional)</Label>
            <Textarea
              id="pact-desc"
              placeholder="More details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pact-amount">Amount ($)</Label>
            <Input
              id="pact-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="25.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Deadline</Label>
            <DeadlinePicker value={deadline} onChange={setDeadline} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Accountability Partner</Label>
            <PartnerPicker value={partners} onChange={setPartners} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pact-proof">
              Proof requirement (optional)
            </Label>
            <Textarea
              id="pact-proof"
              placeholder="What counts as proof? e.g., screenshot of completed assignment"
              value={proofRequirement}
              onChange={(e) => setProofRequirement(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-zinc-200">Public pact</p>
              <p className="text-xs text-zinc-400">Show on the social feed</p>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Creating..." : "Create Pact"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
