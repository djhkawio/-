import { NextRequest, NextResponse } from "next/server";
import {
  BatchCreativeItem,
  buildCopyVersions,
  buildDesignPrompt,
  buildMarketStrategy,
  parseCreativeInput,
  scoreCreative
} from "@/lib/creativeOS";
import { DesignTemplate } from "@/lib/poster";

const designOrder: DesignTemplate[] = [
  "trust_framework",
  "market_brief",
  "premium_minimal",
  "educational_checklist",
  "mistake_prevention"
];

async function generateImage(prompt: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    return `https://placehold.co/1254x1254/png?text=${encodeURIComponent(prompt.slice(0, 68))}`;
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
      prompt
    })
  });

  const data = await response.json();
  return data?.data?.[0]?.url || `https://placehold.co/1254x1254/png?text=${encodeURIComponent("generation_failed")}`;
}

function adjustPromptForRetry(input: string): string {
  return `${input}. Emphasize readable headline hierarchy, cleaner spacing, stronger trust reason block, and safe educational CTA.`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const feedbackPatterns = (payload?.feedback_patterns || []) as Array<{ type: "winner" | "rejected"; layout_style?: string; headline_style?: string; avoid_next_time?: string }>;
    const parsed = parseCreativeInput(payload);
    const market = buildMarketStrategy(parsed);
    const copies = buildCopyVersions(parsed, market);
    const apiKey = process.env.OPENAI_API_KEY;

    const items: BatchCreativeItem[] = [];
    for (let i = 0; i < 5; i += 1) {
      const copy = copies[i];
      const design = designOrder[i];
      const bias = feedbackPatterns.find((p) => p.type === "winner" && p.layout_style === design);
      const avoid = feedbackPatterns.find((p) => p.type === "rejected" && p.layout_style === design);
      const designPrompt = buildDesignPrompt(parsed, copy, design);
      if (bias) designPrompt.prompt = `${designPrompt.prompt}. Reinforce winning pattern: ${bias.headline_style || "clear trusted hook"}.`;
      if (avoid?.avoid_next_time) designPrompt.negative_prompt = `${designPrompt.negative_prompt}, avoid ${avoid.avoid_next_time}`;
      let imageUrl = await generateImage(designPrompt.prompt, apiKey);
      let score = scoreCreative(copy, designPrompt, parsed.country);
      let status: BatchCreativeItem["status"] = "initial";

      if (score.overall_score < 8) {
        const revisedPrompt = { ...designPrompt, prompt: adjustPromptForRetry(designPrompt.prompt) };
        imageUrl = await generateImage(revisedPrompt.prompt, apiKey);
        score = scoreCreative(copy, revisedPrompt, parsed.country);
        status = "regenerated";
        items.push({
          id: `${Date.now()}-${i}`,
          copy_version: copy,
          design_prompt: revisedPrompt,
          image_url: imageUrl,
          quality_score: score,
          status
        });
        continue;
      }

      items.push({
        id: `${Date.now()}-${i}`,
        copy_version: copy,
        design_prompt: designPrompt,
        image_url: imageUrl,
        quality_score: score,
        status
      });
    }

    const recommended = [...items]
      .sort((a, b) => b.quality_score.overall_score - a.quality_score.overall_score)
      .slice(0, 2)
      .map((item) => item.id);

    return NextResponse.json({
      parsed_input: parsed,
      market_strategy: market,
      creatives: items,
      recommended_ids: recommended
    });
  } catch {
    return NextResponse.json({ error: "creative os generation failed" }, { status: 500 });
  }
}
