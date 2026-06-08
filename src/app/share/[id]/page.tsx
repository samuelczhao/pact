import { createServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("title, amount, status, creator_id")
    .eq("id", id)
    .single();

  if (!commitment) return {};

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", commitment.creator_id)
    .single();

  const creator = profile?.display_name ?? "Someone";
  const status = commitment.status === "completed" ? "completed" : "failed";
  const description = `${creator} ${status} a $${commitment.amount.toFixed(2)} pact: "${commitment.title}"`;

  const ogUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "https://pactlnl.vercel.app" : "http://localhost:3000"}/api/og/${id}`;

  return {
    title: `${commitment.title} — Pact`,
    description,
    openGraph: {
      title: commitment.title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: commitment.title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("id, is_public")
    .eq("id", id)
    .single();

  if (!commitment) notFound();

  redirect(`/commitments/${id}`);
}
