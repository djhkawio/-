import { NextRequest, NextResponse } from "next/server";

type AnalysisResult = {
  headline: string;
  subline: string;
  bullets: string[];
  cta: string;
  angle: "question" | "beginner" | "curiosity" | "mistake" | "opportunity";
  tone: string;
};

function fallbackResult(country: string): AnalysisResult {
  const spanish = country.toLowerCase().includes("argentina");
  const romanian = country.toLowerCase().includes("romania") || country.toLowerCase().includes("românia");

  if (spanish) {
    return {
      headline: "¿Cómo empezar con una base financiera clara?",
      subline: "Resumen educativo y simple para tomar mejores decisiones paso a paso.",
      bullets: ["Aprendizaje gratuito", "Estructura simple para principiantes", "Sin promesas de rentabilidad"],
      cta: "Ver ejemplo simple",
      angle: "beginner",
      tone: "Profesional y confiable"
    };
  }

  if (romanian) {
    return {
      headline: "Cum începi cu o bază financiară clară?",
      subline: "Conținut educațional simplu, orientat pe claritate și încredere.",
      bullets: ["Învățare gratuită", "Pași clari pentru începători", "Fără promisiuni de câștig"],
      cta: "Vezi exemplu simplu",
      angle: "beginner",
      tone: "Profesional și clar"
    };
  }

  return {
    headline: "How can you start with a clear financial foundation?",
    subline: "Educational summary with practical structure for beginners.",
    bullets: ["Free learning", "Simple step-by-step path", "No guaranteed outcomes"],
    cta: "See simple example",
    angle: "beginner",
    tone: "Professional"
  };
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, country } = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      country?: string;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ result: fallbackResult(country || "") });
    }

    const prompt = `Analyze this ad-like reference image and return strict JSON with keys: headline, subline, bullets(3 strings), cta, angle(question|beginner|curiosity|mistake|opportunity), tone. Avoid any guaranteed return language, download wording, or institution endorsements.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: `data:${mimeType || "image/png"};base64,${imageBase64}` }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const text = data.output_text || "";

    let parsed: AnalysisResult | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed) {
      return NextResponse.json({ result: fallbackResult(country || "") });
    }

    return NextResponse.json({ result: parsed });
  } catch {
    return NextResponse.json({ error: "Analyze failed" }, { status: 500 });
  }
}
