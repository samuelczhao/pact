"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Trophy, Calendar, DollarSign } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Challenge, ChallengeCheckin } from "@/lib/types/database";

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [checkins, setCheckins] = useState<ChallengeCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const [challengeRes, checkinsRes] = await Promise.all([
        fetch(`/api/challenges/${id}`),
        fetch(`/api/challenges/${id}/checkin`),
      ]);

      if (challengeRes.ok) setChallenge(await challengeRes.json());
      if (checkinsRes.ok) setCheckins(await checkinsRes.json());
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-400">Challenge not found</p>
      </div>
    );
  }

  const isParticipant = challenge.participants?.some((p) => p.user_id === userId);
  const isActive = challenge.status === "active";
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(challenge.end_date).getTime() - Date.now()) / 86400000,
  ));

  const todayStr = new Date().toISOString().split("T")[0];
  const checkedInToday = checkins.some(
    (c) => c.user_id === userId && c.checkin_date === todayStr,
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{challenge.title}</CardTitle>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              challenge.status === "active" ? "bg-blue-500/20 text-blue-400" :
              challenge.status === "completed" ? "bg-green-500/20 text-green-400" :
              challenge.status === "open" ? "bg-amber-500/20 text-amber-400" :
              "bg-zinc-500/20 text-zinc-400"
            }`}>
              {challenge.status.toUpperCase()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {challenge.description && (
            <p className="text-sm text-zinc-300">{challenge.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Stake</p>
                <p className="text-sm font-medium text-zinc-100">
                  {formatCurrency(challenge.stake)} / person
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Participants</p>
                <p className="text-sm font-medium text-zinc-100">
                  {challenge.participants?.length ?? 0} / {challenge.max_participants}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Time Left</p>
                <p className="text-sm font-medium text-zinc-100">
                  {daysLeft > 0 ? `${daysLeft} days` : "Ended"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Frequency</p>
                <p className="text-sm font-medium text-zinc-100 capitalize">
                  {challenge.proof_frequency}
                </p>
              </div>
            </div>
          </div>

          {challenge.proof_requirement && (
            <div className="rounded-md bg-zinc-800/50 px-3 py-2">
              <p className="text-xs text-zinc-400">Proof required</p>
              <p className="text-sm text-zinc-200">{challenge.proof_requirement}</p>
            </div>
          )}

          <div className="rounded-md bg-zinc-800/30 px-3 py-2">
            <p className="text-xs text-zinc-400">Join Code</p>
            <p className="font-mono text-lg font-bold tracking-wider text-zinc-100">
              {challenge.join_code}
            </p>
          </div>
        </CardContent>
      </Card>

      {isParticipant && isActive && !checkedInToday && (
        <div className="mt-6">
          <CheckinForm challengeId={challenge.id} onCheckedIn={(c) => setCheckins([c, ...checkins])} />
        </div>
      )}

      {checkedInToday && (
        <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-center">
          <p className="text-sm font-medium text-green-400">Checked in today</p>
        </div>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {challenge.participants?.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {p.profile?.avatar_url && <AvatarImage src={p.profile.avatar_url} />}
                      <AvatarFallback>
                        {(p.profile?.display_name ?? "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-zinc-100">
                      {p.profile?.display_name ?? "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{p.proof_count} check-ins</span>
                    <span className={`rounded-full px-1.5 py-0.5 font-medium ${
                      p.status === "active" ? "bg-blue-500/20 text-blue-400" :
                      p.status === "completed" ? "bg-green-500/20 text-green-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckinForm({
  challengeId,
  onCheckedIn,
}: {
  challengeId: string;
  onCheckedIn: (c: ChallengeCheckin) => void;
}) {
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!proofText.trim() && !proofUrl.trim()) {
      toast.error("Provide proof text or a URL");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof_text: proofText.trim() || null,
          proof_url: proofUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Check-in failed");
      }
      const checkin = await res.json();
      toast.success("Checked in!");
      onCheckedIn(checkin);
      setProofText("");
      setProofUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Check-in</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          placeholder="What did you do today? (proof)"
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          rows={2}
        />
        <Input
          placeholder="Proof URL (optional)"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Check In"}
        </Button>
      </CardContent>
    </Card>
  );
}
