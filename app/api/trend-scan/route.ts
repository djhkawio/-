import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { country, theme } = (await req.json()) as { country?: string; theme?: string };
    const query = `${country || ""} ${theme || ""} ad creative trend`;

    const url = `https://r.jina.ai/http://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();

    const lines = text
      .split("\n")
      .filter((line) => line.toLowerCase().includes("ad") || line.toLowerCase().includes("cta"))
      .slice(0, 8);

    const trendHints = lines.map((line) => line.replace(/<[^>]+>/g, "").trim()).filter(Boolean);

    return NextResponse.json({
      note: "Public trend reference only. Do not use as final decision.",
      query,
      trendHints
    });
  } catch {
    return NextResponse.json({
      note: "Public trend reference only. Do not use as final decision.",
      query: "fallback",
      trendHints: ["Short headline + trust bullets", "Single clear CTA", "Minimal mobile-first layout"]
    });
  }
}
