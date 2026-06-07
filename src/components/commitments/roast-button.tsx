"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RoastButtonProps {
  title: string;
  amount: number;
}

export function RoastButton({ title, amount }: RoastButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRoast() {
    setLoading(true);

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

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(roast);
        utterance.rate = 1.05;
        utterance.pitch = 0.8;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
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
