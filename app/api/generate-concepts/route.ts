import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { BaseAd, FormData, generateConceptJSON } from "@/lib/poster";

async function loadPrompt(file: string) {
  return fs.readFile(path.join(process.cwd(), "prompts", file), "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const { payload, baseAd } = (await req.json()) as { payload: FormData; baseAd?: BaseAd };
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ concepts: generateConceptJSON(payload, undefined, baseAd) });
    }

    const strategyPrompt = await loadPrompt("strategy_brain.md");
    const copyPrompt = await loadPrompt("copy_brain.md");
    const qualityPrompt = await loadPrompt("quality_scoring.md");

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
            role: "system",
            content: [{ type: "input_text", text: `${strategyPrompt}\n\n${copyPrompt}\n\n${qualityPrompt}` }]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Generate 5 concepts in strict JSON array using this input: ${JSON.stringify({ payload, baseAd })}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const text = data.output_text || "";

    let concepts = null;
    try {
      concepts = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) concepts = JSON.parse(match[0]);
    }

    if (!Array.isArray(concepts) || concepts.length === 0) {
      return NextResponse.json({ concepts: generateConceptJSON(payload, undefined, baseAd) });
    }

    return NextResponse.json({ concepts });
  } catch {
    return NextResponse.json({ error: "concept generation failed" }, { status: 500 });
  }
}
