import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";

type PosterPayload = {
  headline: string;
  subheadline: string;
  trustReason: string;
  cta: string;
  disclaimer: string;
  artDirection: string;
  country: string;
  language: string;
  topic: string;
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const { headline, subheadline, trustReason, cta, disclaimer, artDirection, country, language, topic } = (await req.json()) as PosterPayload;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 503 });
    }

    const client = new OpenAI({ apiKey });
    const imagePrompt = `Create a premium mobile-first financial education advertising poster background.
Target country: ${country}
Language context: ${language}
Topic context: ${topic}
Art direction: ${artDirection}
No text in the generated base image.
Generate only background + hero visual. No text, no labels, no buttons, no logos, no watermark, no system fields, no typography.`;

    const imageResult = await client.images.generate({
      model: "gpt-image-1",
      size: "1024x1024",
      prompt: `${imagePrompt}
Negative prompt: no words, no labels, no logos, no watermarks, no dashboard UI screenshot, no cheap canva style`
    });

    const imageData = imageResult.data?.[0];
    const b64 = imageData?.b64_json;
    const imageUrl = imageData?.url;
    if (!b64 && !imageUrl) {
      return NextResponse.json({ error: "OpenAI returned no image payload" }, { status: 502 });
    }

    const baseBuffer = b64
      ? Buffer.from(b64, "base64")
      : Buffer.from(await (await fetch(imageUrl as string)).arrayBuffer());
    const resized = await sharp(baseBuffer).resize(1254, 1254, { fit: "cover" }).png().toBuffer();

    const overlaySvg = `
      <svg width="1254" height="1254" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(15,23,42,0.15)" />
            <stop offset="100%" stop-color="rgba(15,23,42,0.55)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1254" height="1254" fill="url(#fade)" />
        <rect x="72" y="72" width="1110" height="1110" rx="28" fill="rgba(248,250,252,0.86)" />
        <text x="120" y="240" font-size="72" font-family="Inter, Arial" font-weight="700" fill="#0f172a">${esc(headline)}</text>
        <text x="120" y="350" font-size="40" font-family="Inter, Arial" fill="#334155">${esc(subheadline)}</text>
        <rect x="120" y="430" width="980" height="90" rx="16" fill="rgba(15,23,42,0.06)" />
        <text x="150" y="488" font-size="34" font-family="Inter, Arial" fill="#334155">${esc(trustReason)}</text>
        <rect x="120" y="930" width="380" height="88" rx="44" fill="#0f172a" />
        <text x="152" y="986" font-size="32" font-family="Inter, Arial" font-weight="700" fill="#f8fafc">${esc(cta)}</text>
        <text x="120" y="1148" font-size="23" font-family="Inter, Arial" fill="#475569">${esc(disclaimer)}</text>
      </svg>
    `;

    const finalBuffer = await sharp(resized)
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return NextResponse.json({
      image_url: `data:image/png;base64,${finalBuffer.toString("base64")}`,
      imageUrl: `data:image/png;base64,${finalBuffer.toString("base64")}`,
      imageBase64: finalBuffer.toString("base64"),
      status: "generated"
    });
  } catch (openaiError: unknown) {
    const message = openaiError instanceof Error
      ? openaiError.message
      : JSON.stringify(openaiError);
    console.error("generate-final-poster error:", openaiError);
    return NextResponse.json({ error: message || JSON.stringify(openaiError) }, { status: 500 });
  }
}
