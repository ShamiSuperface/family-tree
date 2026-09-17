import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

interface GeocodeResult {
  lat: number;
  lon: number;
}

const CACHE_KEY = (place: string) => `geocode:${place.trim().toLowerCase()}`;

/**
 * Looks up a free-text place name via OpenStreetMap's Nominatim, caching the
 * result (including "not found") in Redis so the same place is never
 * looked up twice — Nominatim's free tier expects light, cached usage.
 */
export async function GET(request: Request) {
  const place = new URL(request.url).searchParams.get("place")?.trim();
  if (!place) {
    return NextResponse.json({ error: "חסר שם מקום" }, { status: 400 });
  }

  try {
    const redis = getRedis();
    const cacheKey = CACHE_KEY(place);
    const cached = await redis.get<GeocodeResult | null>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return NextResponse.json(cached);
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", place);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");

    const res = await fetch(url, {
      headers: { "User-Agent": "family-tree-app (personal family site)" },
    });
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const result: GeocodeResult | null = data[0]
      ? { lat: Number(data[0].lat), lon: Number(data[0].lon) }
      : null;

    // Cache for a month — place names don't move, and this keeps repeat
    // lookups (across page loads, visitors) from hitting Nominatim at all.
    await redis.set(cacheKey, result, { ex: 60 * 60 * 24 * 30 });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
