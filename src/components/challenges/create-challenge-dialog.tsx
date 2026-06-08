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

interface CreateChallengeDialogProps {
  onCreated: () => void;
}

export function CreateChallengeDialog({ onCreated }: CreateChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stake, setStake] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [proofRequirement, setProofRequirement] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setStake("");
    setStartDate("");
    setEndDate("");
    setProofRequirement("");
    setFrequency("daily");
    setMaxParticipants("10");
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const parsedStake = parseFloat(stake);
    if (isNaN(parsedStake) || parsedStake <= 0) {
      toast.error("Valid stake amount required");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and end dates required");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          stake: parsedStake,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          proof_requirement: proofRequirement.trim() || null,
          proof_frequency: frequency,
          max_participants: parseInt(maxParticipants) || 10,
          is_public: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create");
      }

      const challenge = await res.json();
      toast.success(`Challenge created! Join code: ${challenge.join_code}`);
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        New Challenge
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pool Challenge</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ch-title">Title</Label>
            <Input
              id="ch-title"
              placeholder="e.g., Gym 4x/week for 30 days"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ch-desc">Description (optional)</Label>
            <Textarea
              id="ch-desc"
              placeholder="Rules and details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ch-stake">Stake per person ($)</Label>
              <Input
                id="ch-stake"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="20.00"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ch-max">Max participants</Label>
              <Input
                id="ch-max"
                type="number"
                min="2"
                max="50"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ch-start">Start date</Label>
              <Input
                id="ch-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ch-end">End date</Label>
              <Input
                id="ch-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ch-proof">Proof requirement (optional)</Label>
            <Input
              id="ch-proof"
              placeholder="e.g., Selfie at the gym with timestamp"
              value={proofRequirement}
              onChange={(e) => setProofRequirement(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Check-in frequency</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={frequency === "daily" ? "default" : "outline"}
                onClick={() => setFrequency("daily")}
              >
                Daily
              </Button>
              <Button
                size="sm"
                variant={frequency === "weekly" ? "default" : "outline"}
                onClick={() => setFrequency("weekly")}
              >
                Weekly
              </Button>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={submitting} className="mt-2">
            {submitting ? "Creating..." : "Create Challenge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
