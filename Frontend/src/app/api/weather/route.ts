import { getWeather } from "@/server/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getWeather();
    return Response.json({ success: true, data }, { headers: { "Cache-Control": "public, s-maxage=600" } });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Weather is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
