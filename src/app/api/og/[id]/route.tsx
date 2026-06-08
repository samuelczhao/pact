import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  completed: "COMPLETED",
  failed: "FAILED",
  active: "ACTIVE",
  pending_proof: "PENDING",
  awaiting_verification: "VERIFYING",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  failed: "#ef4444",
  active: "#3b82f6",
  pending_proof: "#f59e0b",
  awaiting_verification: "#a855f7",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: commitment } = await supabase
    .from("commitments")
    .select("title, amount, status, deadline, created_at, creator_id")
    .eq("id", id)
    .single();

  if (!commitment) {
    return new Response("Not found", { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", commitment.creator_id)
    .single();

  const statusLabel = STATUS_LABELS[commitment.status] ?? "ACTIVE";
  const statusColor = STATUS_COLORS[commitment.status] ?? "#3b82f6";
  const amount = `$${commitment.amount.toFixed(2)}`;
  const creator = profile?.display_name ?? "Anonymous";

  let duration = "";
  if (commitment.deadline) {
    const start = new Date(commitment.created_at);
    const end = new Date(commitment.deadline);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    duration = `${days} day${days !== 1 ? "s" : ""}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(145deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: "9999px",
                backgroundColor: statusColor,
                color: "white",
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              {statusLabel}
            </div>
            {duration && (
              <span style={{ color: "#a1a1aa", fontSize: "20px" }}>
                {duration}
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: "56px",
              fontWeight: "800",
              color: "#fafafa",
              lineHeight: "1.1",
              margin: "0",
              maxWidth: "900px",
            }}
          >
            {commitment.title}
          </h1>

          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span
              style={{
                fontSize: "72px",
                fontWeight: "900",
                color: "#fafafa",
              }}
            >
              {amount}
            </span>
            <span style={{ fontSize: "24px", color: "#71717a" }}>
              at stake
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "16px", color: "#71717a" }}>by</span>
            <span style={{ fontSize: "28px", fontWeight: "600", color: "#d4d4d8" }}>
              {creator}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#fafafa",
                letterSpacing: "-0.02em",
              }}
            >
              PACT
            </span>
            <span style={{ fontSize: "18px", color: "#71717a" }}>
              pactlnl.vercel.app
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
