import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, negative_prompt } = (await req.json()) as { prompt: string; negative_prompt?: string };
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        image_url: `https://placehold.co/1254x1254/png?text=${encodeURIComponent("image_api_not_configured")}`,
        status: "mock_only"
      });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        size: "1024x1024",
        prompt: `${prompt}\nnegative prompt: ${negative_prompt || "none"}`
      })
    });

    const data = await response.json();
    return NextResponse.json({
      image_url: data?.data?.[0]?.url || null,
      status: data?.data?.[0]?.url ? "generated" : "failed"
    });
  } catch {
    return NextResponse.json({ error: "image generation failed" }, { status: 500 });
  }
}

