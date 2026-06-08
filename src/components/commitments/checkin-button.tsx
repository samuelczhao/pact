"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CheckinButtonProps {
  commitmentId: string;
  onCheckedIn?: () => void;
}

export function CheckinButton({ commitmentId, onCheckedIn }: CheckinButtonProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckin() {
    if (!text.trim()) {
      toast.error("Write what you did today");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/commitments/${commitmentId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_text: text.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Check-in failed");
      }
      toast.success("Checked in!");
      setText("");
      setOpen(false);
      onCheckedIn?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="xs" variant="outline" onClick={(e) => e.stopPropagation()} />
        }
      >
        <CheckCircle className="size-3" />
        Check in
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Daily Check-in</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Input
            placeholder="What did you do today?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCheckin();
              }
            }}
          />
          <Button onClick={handleCheckin} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Check-in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
