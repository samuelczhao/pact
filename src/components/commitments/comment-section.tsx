"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Comment } from "@/lib/types/database";

export function CommentSection({ commitmentId }: { commitmentId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/commitments/${commitmentId}/comments`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [commitmentId]);

  async function handleSubmit() {
    const text = body.trim();
    if (!text) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/commitments/${commitmentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to post comment");
      }

      const newComment: Comment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-zinc-400">No comments yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="size-7 shrink-0">
                  {comment.profile?.avatar_url && <AvatarImage src={comment.profile.avatar_url} />}
                  <AvatarFallback className="text-xs">
                    {(comment.profile?.display_name ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-zinc-100">
                      {comment.profile?.display_name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={posting}
              className="resize-none"
              rows={1}
              maxLength={2000}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={posting || !body.trim() || body.length > 2000}
              className="shrink-0 self-end"
            >
              <Send className="size-4" />
            </Button>
          </div>
          {body.length > 1800 && (
            <p className={`text-xs text-right ${body.length > 2000 ? "text-red-400" : "text-zinc-500"}`}>
              {body.length}/2000
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
