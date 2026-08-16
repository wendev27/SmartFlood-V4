import { NextResponse } from "next/server";

const GENERATION_ERROR = "Failed to generate AI recommendations from deployed AI backend.";

function toWholeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function aiBackendUrl() {
  return (process.env.AI_BACKEND_URL ?? "").replace(/\/+$/, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const payload = {
      family_food_packs: toWholeNumber(body.family_food_packs),
      medicine_kits: toWholeNumber(body.medicine_kits),
      relief_goods_individual: toWholeNumber(body.relief_goods_individual),
      audit_actor: body.audit_actor ?? null,
    };

    if (payload.family_food_packs + payload.medicine_kits + payload.relief_goods_individual <= 0) {
      return NextResponse.json(
        { success: false, error: "Please input available relief inventory before generating recommendations." },
        { status: 400 },
      );
    }

    const backendUrl = aiBackendUrl();
    if (!backendUrl) {
      return NextResponse.json(
        { success: false, error: `${GENERATION_ERROR} AI_BACKEND_URL is not configured.` },
        { status: 500 },
      );
    }

    const response = await fetch(`${backendUrl}/api/ai/recommendations/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const result = await response.json().catch(() => null) as { success?: boolean; data?: unknown; error?: string } | null;

    if (!response.ok || result?.success === false) {
      return NextResponse.json(
        { success: false, error: result?.error ? `${GENERATION_ERROR} ${result.error}` : GENERATION_ERROR },
        { status: response.ok ? 502 : response.status },
      );
    }

    return NextResponse.json(result ?? { success: true, data: [] });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown backend request error.";
    return NextResponse.json({ success: false, error: `${GENERATION_ERROR} ${details}` }, { status: 502 });
  }
}
