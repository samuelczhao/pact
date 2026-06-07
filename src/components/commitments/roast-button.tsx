"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RoastButtonProps {
  title: string;
  amount: number;
}

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  const preferred = [
    "Samantha", "Karen", "Tessa", "Moira", "Fiona",
    "Google US English", "Google UK English Female",
    "Microsoft Zira", "Microsoft Hazel",
    "Yuna", "Sora",
  ];

  for (const name of preferred) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  const female = voices.find(
    (v) =>
      /female/i.test(v.name) ||
      /woman/i.test(v.name) ||
      /samantha|karen|tessa|zira|hazel|fiona|moira|victoria|alice|ellen|kate/i.test(v.name),
  );
  if (female) return female;

  const english = voices.find((v) => v.lang.startsWith("en"));
  return english ?? voices[0] ?? null;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const voice = pickFemaleVoice();
  if (voice) utterance.voice = voice;

  utterance.rate = 0.95;
  utterance.pitch = 1.3;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
}

export function RoastButton({ title, amount }: RoastButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRoast() {
    setLoading(true);

    // Pre-load voices (some browsers need this)
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate roast");
      }

      const { roast } = await res.json();

      toast(roast, { duration: 8000 });
      speak(roast);
    } catch {
      toast.error("Roast machine is down");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={(e) => {
        e.stopPropagation();
        handleRoast();
      }}
      disabled={loading}
      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
    >
      <Flame className="size-3" />
      {loading ? "..." : "Roast me"}
    </Button>
  );
}
