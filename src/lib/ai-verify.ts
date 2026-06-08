import { GoogleGenAI } from "@google/genai";

export interface AiVerdict {
  satisfied: boolean;
  confidence: number;
  reason: string;
}

export async function verifyProofWithAi(
  title: string,
  proofRequirement: string,
  proofText: string | null,
  proofUrl: string | null,
): Promise<AiVerdict | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const proofDescription = [
    proofText ? `Text proof: "${proofText}"` : null,
    proofUrl ? `URL/file proof: ${proofUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a strict accountability judge. Your job is to evaluate whether submitted proof satisfies a commitment.

Commitment: "${title}"
Required proof: "${proofRequirement}"
Submitted proof:
${proofDescription}

Evaluate whether the submitted proof genuinely satisfies the requirement. Be skeptical but fair. If the proof is clearly relevant and demonstrates completion, mark satisfied. If it's vague, unrelated, or insufficient, mark not satisfied.

Respond with ONLY a JSON object (no markdown, no code fences):
{"satisfied": true/false, "confidence": 0.0-1.0, "reason": "one sentence explanation"}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text?.trim() ?? "";
    const parsed = JSON.parse(text) as AiVerdict;

    if (
      typeof parsed.satisfied !== "boolean" ||
      typeof parsed.confidence !== "number" ||
      typeof parsed.reason !== "string"
    ) {
      return null;
    }

    return {
      satisfied: parsed.satisfied,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      reason: parsed.reason,
    };
  } catch {
    return null;
  }
}
