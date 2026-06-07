"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface ProofSubmitFormProps {
  commitmentId: string;
  onSubmitted: () => void;
}

export function ProofSubmitForm({
  commitmentId,
  onSubmitted,
}: ProofSubmitFormProps) {
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadFile(f: File): Promise<string> {
    const supabase = createClient();
    const ext = f.name.split(".").pop();
    const path = `${commitmentId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("proofs")
      .upload(path, f);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage
      .from("proofs")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!proofText.trim() && !proofUrl.trim() && !file) {
      toast.error("Provide proof text, a URL, or upload a file");
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file && file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 10 MB");
      return;
    }

    setLoading(true);

    try {
      let finalUrl = proofUrl.trim() || undefined;

      if (file) {
        finalUrl = await uploadFile(file);
      }

      const res = await fetch(`/api/commitments/${commitmentId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof_text: proofText.trim() || null,
          proof_url: finalUrl || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to submit proof");
      }

      toast.success("Proof submitted");
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-zinc-400">
        Provide at least one form of proof below.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proof-text">Proof description</Label>
        <Textarea
          id="proof-text"
          placeholder="Describe what you did..."
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proof-url">Proof URL (optional)</Label>
        <Input
          id="proof-url"
          type="url"
          placeholder="https://..."
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proof-file">Screenshot (optional)</Label>
        <Input
          id="proof-file"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? (
          "Submitting..."
        ) : (
          <>
            <Upload className="size-4" />
            Submit Proof
          </>
        )}
      </Button>
    </form>
  );
}
