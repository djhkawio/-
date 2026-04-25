import { NextRequest, NextResponse } from "next/server";
import {
  BatchCreativeItem,
  buildCompositionPlan,
  buildCopyVersions,
  buildDesignPrompt,
  buildMarketStrategy,
  parseCreativeInput,
  sanitizeCopyForPoster,
  scoreCreative,
  validatePosterLayout
} from "@/lib/creativeOS";
import { DesignTemplate } from "@/lib/poster";

const designOrder: DesignTemplate[] = [
  "trust_framework",
  "market_brief",
  "premium_minimal",
  "educational_checklist",
  "mistake_prevention"
];

async function generatePreview(copy: { headline: string; subheadline: string; trust_reason: string; cta: string; disclaimer: string }, layoutType: string, language: string): Promise<string> {
  const headline = copy.headline.replace(/[<>&]/g, "");
  const subheadline = copy.subheadline.replace(/[<>&]/g, "");
  const trust = copy.trust_reason.replace(/[<>&]/g, "");
  const cta = copy.cta.replace(/[<>&]/g, "");
  const disclaimer = copy.disclaimer.replace(/[<>&]/g, "");
  const heroLayer = layoutType === "center-hero-overlay"
    ? "<ellipse cx='860' cy='490' rx='230' ry='300' fill='rgba(15,23,42,0.22)'/><ellipse cx='860' cy='460' rx='110' ry='130' fill='rgba(30,41,59,0.35)'/>"
    : layoutType === "editorial-cover"
      ? "<rect x='760' y='210' width='330' height='520' rx='24' fill='rgba(15,23,42,0.06)'/><line x1='760' y1='330' x2='1090' y2='330' stroke='rgba(15,23,42,0.2)' stroke-width='2'/>"
      : layoutType === "3-step-roadmap"
        ? "<circle cx='860' cy='420' r='50' fill='rgba(16,185,129,0.25)'/><circle cx='955' cy='540' r='50' fill='rgba(16,185,129,0.20)'/><circle cx='1060' cy='660' r='50' fill='rgba(16,185,129,0.15)'/><path d='M860 420 L955 540 L1060 660' stroke='rgba(15,23,42,0.35)' stroke-width='6'/>"
        : layoutType === "split-contrast"
          ? "<rect x='740' y='220' width='180' height='560' fill='rgba(239,68,68,0.12)'/><rect x='920' y='220' width='180' height='560' fill='rgba(16,185,129,0.14)'/>"
          : layoutType === "local-skyline"
            ? "<path d='M730 700 L770 620 L800 700 L840 580 L880 700 L920 640 L960 700 L1000 560 L1030 700 L1100 700' fill='none' stroke='rgba(37,99,235,0.35)' stroke-width='8'/>"
            : layoutType === "dark-spotlight"
              ? "<circle cx='940' cy='450' r='240' fill='rgba(148,163,184,0.18)'/><circle cx='940' cy='450' r='110' fill='rgba(248,250,252,0.18)'/>"
              : "<rect x='760' y='250' width='340' height='420' rx='26' fill='rgba(15,23,42,0.06)'/>";

  const topLabel = language.toLowerCase().includes("es") ? "Educación financiera" : "Financial Education";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1254' height='1254'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#0f172a'/>
          <stop offset='100%' stop-color='#1e293b'/>
        </linearGradient>
      </defs>
      <rect width='1254' height='1254' fill='url(#g)'/>
      <rect x='64' y='64' width='1126' height='1126' rx='36' fill='rgba(248,250,252,0.95)'/>
      ${heroLayer}
      <text x='120' y='168' font-size='30' font-family='Inter, Arial' fill='#0f172a'>${topLabel}</text>
      <foreignObject x='120' y='220' width='960' height='220'>
        <div xmlns='http://www.w3.org/1999/xhtml' style='font-family:Inter,Arial;font-size:72px;font-weight:700;line-height:1.08;color:#0f172a;'>${headline}</div>
      </foreignObject>
      <foreignObject x='120' y='470' width='920' height='140'>
        <div xmlns='http://www.w3.org/1999/xhtml' style='font-family:Inter,Arial;font-size:38px;line-height:1.2;color:#334155;'>${subheadline}</div>
      </foreignObject>
      <rect x='120' y='646' width='980' height='92' rx='20' fill='rgba(15,23,42,0.05)'/>
      <text x='150' y='704' font-size='34' font-family='Inter, Arial' fill='#334155'>${trust}</text>
      <rect x='120' y='912' width='390' height='92' rx='46' fill='#0f172a'/>
      <text x='152' y='970' font-size='34' font-weight='700' font-family='Inter, Arial' fill='#f8fafc'>${cta}</text>
      <text x='120' y='1142' font-size='24' font-family='Inter, Arial' fill='#475569'>${disclaimer}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const feedbackPatterns = (payload?.feedback_patterns || []) as Array<{ type: "winner" | "rejected"; layout_style?: string; headline_style?: string; avoid_next_time?: string }>;
    const parsed = parseCreativeInput(payload);
    const market = buildMarketStrategy(parsed);
    const copies = buildCopyVersions(parsed, market);

    const items: BatchCreativeItem[] = [];
    for (let i = 0; i < 5; i += 1) {
      const copy = sanitizeCopyForPoster(parsed, copies[i]);
      const design = designOrder[i];
      const composition = buildCompositionPlan(parsed.country, i);
      const bias = feedbackPatterns.find((p) => p.type === "winner" && p.layout_style === design);
      const avoid = feedbackPatterns.find((p) => p.type === "rejected" && p.layout_style === design);
      const designPrompt = buildDesignPrompt(parsed, copy, design);
      designPrompt.design_direction = composition.art_direction;
      if (bias) designPrompt.prompt = `${designPrompt.prompt}. Reinforce winning pattern: ${bias.headline_style || "clear trusted hook"}.`;
      if (avoid?.avoid_next_time) designPrompt.negative_prompt = `${designPrompt.negative_prompt}, avoid ${avoid.avoid_next_time}`;
      const layoutValidation = validatePosterLayout(copy);
      let previewUrl = await generatePreview(copy, composition.layout_type, parsed.language);
      let score = scoreCreative(copy, designPrompt, parsed.country);
      let status: BatchCreativeItem["status"] = layoutValidation.valid ? "ready" : "needs_fix";
      let reason = layoutValidation.reason;

      if (!layoutValidation.valid) {
        const repairedCopy = sanitizeCopyForPoster(parsed, {
          ...copy,
          headline: copy.headline.slice(0, 52),
          subheadline: copy.subheadline.slice(0, 80),
          cta: copy.cta.split(" ").slice(0, 4).join(" ")
        });
        previewUrl = await generatePreview(repairedCopy, composition.layout_type, parsed.language);
        score = scoreCreative(repairedCopy, designPrompt, parsed.country);
        const secondCheck = validatePosterLayout(repairedCopy);
        status = secondCheck.valid ? "ready" : "needs_fix";
        reason = secondCheck.reason;
      }

      if (layoutValidation.hardFail) {
        score.overall_score = Math.min(5, score.overall_score);
        status = "rejected";
      }

      items.push({
        id: `${Date.now()}-${i}`,
        copy_version: copy,
        design_prompt: designPrompt,
        preview_url: previewUrl,
        generated_image_result: null,
        quality_score: score,
        status,
        reason,
        art_direction: composition.art_direction,
        layout_type: composition.layout_type,
        visual_hook_text: composition.visual_hook,
        why_this_design_works: composition.why_this_design_works,
        design_explanation: composition.explanation,
        composition_plan: composition.plan
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
