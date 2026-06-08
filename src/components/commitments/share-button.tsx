"use client";

import { useState } from "react";
import { Share2, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  commitmentId: string;
  title: string;
  size?: "sm" | "xs";
}

export function ShareButton({ commitmentId, title, size = "xs" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://pactlnl.vercel.app";
  const shareUrl = `${origin}/share/${commitmentId}`;

  async function handleShare() {
    const shareData = {
      title: `${title} — Pact`,
      text: `Check out this pact: "${title}"`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      className="text-zinc-400 hover:text-zinc-100"
    >
      {copied ? <Check className="size-3" /> : <Share2 className="size-3" />}
      <span className="ml-1">Share</span>
    </Button>
  );
}
