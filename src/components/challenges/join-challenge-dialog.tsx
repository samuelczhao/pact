"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function JoinChallengeDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    if (!code.trim() || !challengeId.trim()) {
      toast.error("Challenge ID and join code are required");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId.trim()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ join_code: code.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to join");
      }
      toast.success("Joined challenge!");
      setOpen(false);
      router.push(`/challenges/${challengeId.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Join
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Challenge</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Challenge link or ID</Label>
            <Input
              placeholder="Paste challenge URL or ID"
              value={challengeId}
              onChange={(e) => {
                const val = e.target.value;
                const match = val.match(/challenges\/([a-f0-9-]+)/);
                setChallengeId(match ? match[1] : val);
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Join code</Label>
            <Input
              placeholder="e.g., ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
              maxLength={6}
            />
          </div>
          <Button onClick={handleJoin} disabled={joining}>
            {joining ? "Joining..." : "Join Challenge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
