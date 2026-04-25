import { DesignTemplate } from "@/lib/poster";

export type InputParserPayload = {
  country: string;
  language?: string;
  topic: string;
  platform?: string;
  conversion_path?: "form" | "bridge page" | "learning group" | string;
  risk_level?: "conservative" | "balanced" | "aggressive" | string;
  user_notes?: string;
  reference_image?: string;
};

export type ParsedInput = {
  country: string;
  language: string;
  audience: string;
  topic: string;
  main_offer: string;
  platform: string;
  conversion_path: string;
  creative_intent: string;
  risk_level: string;
  has_reference_image: boolean;
};

export type ReferenceAnalysis = {
  visual_structure: string;
  copy_structure: string;
  strengths: string[];
  weaknesses: string[];
  adaptation_advice: string[];
  risk_notes: string[];
};

export type MarketStrategy = {
  audience_psychology: string[];
  preferred_hooks: string[];
  avoid_phrasing: string[];
  trusted_visual_style: string[];
  local_tone: string;
  suitable_cta: string[];
  conversion_reasoning: string[];
};

export type CopyVersionType = "direct_hook" | "curiosity_hook" | "pain_point" | "beginner_friendly" | "contrarian";

export type CopyVersion = {
  type: CopyVersionType;
  headline: string;
  subheadline: string;
  trust_reason: string;
  learning_motivation: string;
  cta: string;
  disclaimer: string;
};

export type DesignPrompt = {
  prompt: string;
  negative_prompt: string;
  layout_notes: string;
  text_overlay: {
    headline: string;
    subheadline: string;
    trust_reason: string;
    cta: string;
    disclaimer: string;
  };
  design_version: DesignTemplate;
};

export type QualityScore = {
  mobile_readability: number;
  hook_strength: number;
  trust_level: number;
  conversion_strength: number;
  compliance_safety: number;
  design_texture: number;
  country_fit: number;
  overall_score: number;
  problems: string[];
  fix_suggestions: string[];
};

export type BatchCreativeItem = {
  id: string;
  copy_version: CopyVersion;
  design_prompt: DesignPrompt;
  image_url: string;
  quality_score: QualityScore;
  status: "initial" | "regenerated";
};

const forbiddenRules = [
  /guaranteed profit/gi,
  /get rich quick/gi,
  /risk-free/gi,
  /insider information/gi,
  /cfa/gi,
  /portfolio manager/gi,
  /exact income/gi,
  /before\/after wealth/gi
];

const safeDisclaimer = "Educational content only. Not financial advice.";

export function parseCreativeInput(input: InputParserPayload): ParsedInput {
  const country = input.country || "Argentina";
  const language = input.language || (country.toLowerCase().includes("argentina") ? "es-AR" : "en");
  return {
    country,
    language,
    audience: "Adults 38-65 seeking practical financial education",
    topic: input.topic?.trim() || "Financial literacy",
    main_offer: "Continue learning via a safe educational path",
    platform: input.platform || "Meta",
    conversion_path: input.conversion_path || "form",
    creative_intent: "Hook drives click, trust builds action, structure guides next step",
    risk_level: input.risk_level || "balanced",
    has_reference_image: Boolean(input.reference_image)
  };
}

export function buildMarketStrategy(parsed: ParsedInput): MarketStrategy {
  if (parsed.country.toLowerCase().includes("argentina")) {
    return {
      audience_psychology: ["Skeptical of hype", "Responds to practical guidance", "Needs trust before click"],
      preferred_hooks: ["practical question", "common mistake", "clear step-by-step"],
      avoid_phrasing: ["guaranteed return", "fast money", "US-style aggressive claims"],
      trusted_visual_style: ["institutional minimal", "calm editorial", "clean data-light layout"],
      local_tone: "Argentinian Spanish, practical and approachable",
      suitable_cta: ["Seguí aprendiendo", "Ver ruta de aprendizaje", "Acceder al contenido inicial"],
      conversion_reasoning: ["Clarity lowers fear", "Learning framing reduces policy risk"]
    };
  }

  return {
    audience_psychology: ["Needs simple value framing", "Trust before commitment", "Prefers low-pressure CTA"],
    preferred_hooks: ["question", "beginner-friendly", "myth-busting"],
    avoid_phrasing: ["guaranteed outcomes", "urgent wealth promises", "celebrity endorsement"],
    trusted_visual_style: ["premium institutional", "clean typography", "restrained palette"],
    local_tone: "Professional, calm, educational",
    suitable_cta: ["Continue learning", "View learning path", "See beginner guide"],
    conversion_reasoning: ["Education-first message improves compliance and conversion quality"]
  };
}

export function buildCopyVersions(parsed: ParsedInput, strategy: MarketStrategy): CopyVersion[] {
  const topic = parsed.topic;
  const cta = strategy.suitable_cta[0] || "Continue learning";
  return [
    { type: "direct_hook", headline: `Start ${topic} the smart way`, subheadline: "A clearer learning path for real beginners.", trust_reason: "Structured steps, practical context, no hype.", learning_motivation: "Learn what matters before making decisions.", cta, disclaimer: safeDisclaimer },
    { type: "curiosity_hook", headline: `Why do most people fail at ${topic}?`, subheadline: "One framework changes how you evaluate risks.", trust_reason: "Built for clarity, not prediction promises.", learning_motivation: "Understand the logic behind each step.", cta, disclaimer: safeDisclaimer },
    { type: "pain_point", headline: `Still confused by ${topic} signals?`, subheadline: "Turn noise into a simple learning system.", trust_reason: "Professional educational framing with realistic language.", learning_motivation: "Remove guesswork through guided learning.", cta, disclaimer: safeDisclaimer },
    { type: "beginner_friendly", headline: `${topic} for normal people`, subheadline: "No jargon. No pressure. Just practical learning.", trust_reason: "Designed for 38–65 mobile-first readers.", learning_motivation: "Start small, build confidence step by step.", cta, disclaimer: safeDisclaimer },
    { type: "contrarian", headline: `Stop chasing tips. Learn structure.`, subheadline: `${topic} works better when you study the process first.`, trust_reason: "Institutional visual trust with safe educational claims.", learning_motivation: "Use a repeatable method, not emotional decisions.", cta, disclaimer: safeDisclaimer }
  ];
}

export function buildDesignPrompt(parsed: ParsedInput, copy: CopyVersion, design_version: DesignTemplate): DesignPrompt {
  const layoutNotes: Record<DesignTemplate, string> = {
    beginner_clarity: "timeline steps, generous whitespace, numbered sequence",
    trust_framework: "left headline, right trust proof, strong footer CTA",
    market_brief: "editorial newspaper rhythm with key points panel",
    premium_minimal: "hero serif headline, calm spacing, minimal chrome",
    educational_checklist: "checklist blocks and clear progression",
    mistake_prevention: "contrast strip + myth correction structure",
    opportunity_awareness: "dark premium board with three opportunity cards",
    data_report_lite: "report-style header and snapshot module"
  };

  return {
    prompt: `1254x1254 mobile-first ad poster, premium institutional design, ${layoutNotes[design_version]}, clean typography, restrained palette, no clutter, safe financial education context for ${parsed.country}, country-specific cues, bottom disclaimer text, no celebrity real person`,
    negative_prompt: "neon crypto style, gambling look, exaggerated return claim, guaranteed profit, real celebrity, specific investment company, CFA, portfolio manager, fake testimonial, before-after wealth chart, heavy candlestick chart",
    layout_notes: layoutNotes[design_version],
    text_overlay: {
      headline: copy.headline,
      subheadline: copy.subheadline,
      trust_reason: copy.trust_reason,
      cta: copy.cta,
      disclaimer: safeDisclaimer
    },
    design_version
  };
}

export function complianceCheck(text: string): { safe: boolean; issues: string[] } {
  const issues = forbiddenRules.filter((rule) => rule.test(text)).map((rule) => rule.source);
  const hasDisclaimer = /not financial advice|educational content only/i.test(text);
  if (!hasDisclaimer) issues.push("missing_disclaimer");
  return { safe: issues.length === 0, issues };
}

export function scoreCreative(copy: CopyVersion, prompt: DesignPrompt, country: string): QualityScore {
  const joined = `${copy.headline} ${copy.subheadline} ${copy.trust_reason} ${copy.learning_motivation} ${copy.cta} ${copy.disclaimer} ${prompt.prompt}`;
  const compliance = complianceCheck(joined);
  const mobile = copy.headline.length <= 58 ? 9 : 7;
  const hook = /\?|stop|why|start/i.test(copy.headline) ? 9 : 7;
  const trust = /structured|practical|professional|clarity|education/i.test(joined) ? 9 : 7;
  const conversion = /learn|learning|path|guide/i.test(joined) ? 9 : 7;
  const texture = /premium|clean typography|restrained palette/i.test(prompt.prompt) ? 9 : 7;
  const countryFit = country.toLowerCase().includes("argentina") && /argentina|es-AR|aprend/i.test(joined) ? 9 : 8;
  const complianceScore = compliance.safe ? 10 : 5;
  const overall = Number(((mobile + hook + trust + conversion + complianceScore + texture + countryFit) / 7).toFixed(1));
  return {
    mobile_readability: mobile,
    hook_strength: hook,
    trust_level: trust,
    conversion_strength: conversion,
    compliance_safety: complianceScore,
    design_texture: texture,
    country_fit: countryFit,
    overall_score: overall,
    problems: compliance.safe ? [] : compliance.issues,
    fix_suggestions: compliance.safe ? [] : ["Remove risky phrasing", "Keep educational framing", "Keep disclaimer at poster bottom"]
  };
}

