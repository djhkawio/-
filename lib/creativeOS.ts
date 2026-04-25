import { DesignTemplate } from "@/lib/poster";

export type InputParserPayload = {
  country: string;
  language?: string;
  topic: string;
  target_age?: string;
  ad_objective?: string;
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
  target_age: string;
  ad_objective: string;
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
  design_direction: string;
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
  visual_hook: number;
  premium_texture: number;
  composition_balance: number;
  brand_trust: number;
  template_similarity_risk: number;
  mobile_first_impact: number;
};

export type BatchCreativeItem = {
  id: string;
  copy_version: CopyVersion;
  design_prompt: DesignPrompt;
  preview_url: string;
  generated_image_result: string | null;
  quality_score: QualityScore;
  status: "ready" | "needs_fix" | "rejected";
  reason: string;
  art_direction: string;
  layout_type: string;
  visual_hook_text: string;
  why_this_design_works: string;
  design_explanation: {
    art_direction: string;
    visual_hook: string;
    reason: string;
    risk: string;
  };
  composition_plan: {
    hero_visual: string;
    focal_point: string;
    headline_position: string;
    cta_position: string;
    depth_layer: string;
    background_texture: string;
    color_palette: string;
    negative_space_area: string;
    mobile_readability_plan: string;
  };
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
const systemTokens = /(landing_page_lead_generation|conversion_path|campaign_goal|risk_level|platform|variant[_\s-]?id|strategy[_\s-]?key|topic|json|snake_case|internal|field)/gi;

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
    has_reference_image: Boolean(input.reference_image),
    target_age: input.target_age || "38-65",
    ad_objective: input.ad_objective || "Landing page / form / learning path lead generation"
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
  const isArgentina = parsed.country.toLowerCase().includes("argentina") || parsed.language.toLowerCase().includes("es");
  const safeCtas = isArgentina
    ? ["Ver contenido inicial", "Seguí aprendiendo", "Acceder a la guía inicial", "Ver ruta de aprendizaje", "Continuar por la ruta educativa"]
    : ["View starter content", "Continue learning", "Access beginner guide", "View learning path", "Start the educational route"];
  return [
    isArgentina
      ? { type: "direct_hook", headline: `Empezá ${topic} con una base clara`, subheadline: "Ruta educativa práctica para decisiones más simples.", trust_reason: "Lenguaje claro, estructura profesional, sin promesas de rentabilidad.", learning_motivation: "Aprendé primero, decidí con más confianza después.", cta: safeCtas[0], disclaimer: safeDisclaimer }
      : { type: "direct_hook", headline: `Start ${topic} with a clear foundation`, subheadline: "Practical educational path for better decision quality.", trust_reason: "Professional structure and non-promissory wording.", learning_motivation: "Learn first, decide with confidence later.", cta: safeCtas[0], disclaimer: safeDisclaimer },
    isArgentina
      ? { type: "curiosity_hook", headline: `¿Por qué tanta gente se complica con ${topic}?`, subheadline: "Un marco simple cambia cómo interpretás el riesgo.", trust_reason: "Enfoque educativo y realista, sin hype.", learning_motivation: "Entendé la lógica detrás de cada paso.", cta: safeCtas[1], disclaimer: safeDisclaimer }
      : { type: "curiosity_hook", headline: `Why do most people struggle with ${topic}?`, subheadline: "A simple framework changes risk understanding.", trust_reason: "Educational and realistic framing for Meta-safe ads.", learning_motivation: "Understand the logic behind each step.", cta: safeCtas[1], disclaimer: safeDisclaimer },
    isArgentina
      ? { type: "pain_point", headline: `¿Todavía te confunde ${topic}?`, subheadline: "Convertí ruido en una ruta de aprendizaje clara.", trust_reason: "Institucional, sobrio y pensado para móviles.", learning_motivation: "Reducí errores comunes con aprendizaje guiado.", cta: safeCtas[2], disclaimer: safeDisclaimer }
      : { type: "pain_point", headline: `Still confused by ${topic}?`, subheadline: "Turn noise into a clear learning route.", trust_reason: "Institutional and restrained for trust-building.", learning_motivation: "Reduce common mistakes through guided learning.", cta: safeCtas[2], disclaimer: safeDisclaimer },
    isArgentina
      ? { type: "beginner_friendly", headline: `${topic} para empezar sin vueltas`, subheadline: "Sin jerga, sin presión, con pasos concretos.", trust_reason: "Diseñado para 38–65, lectura móvil simple.", learning_motivation: "Empezá de forma ordenada y sostenible.", cta: safeCtas[3], disclaimer: safeDisclaimer }
      : { type: "beginner_friendly", headline: `${topic} for real beginners`, subheadline: "No jargon. No pressure. Clear educational steps.", trust_reason: "Designed for 38–65 mobile readability.", learning_motivation: "Start in a structured, low-friction way.", cta: safeCtas[3], disclaimer: safeDisclaimer },
    isArgentina
      ? { type: "contrarian", headline: "Dejá de perseguir tips: aprendé estructura", subheadline: `${topic} mejora cuando entendés el proceso primero.`, trust_reason: "Visual institucional + contexto educativo seguro.", learning_motivation: "Tomá mejores decisiones con método, no impulso.", cta: safeCtas[4], disclaimer: safeDisclaimer }
      : { type: "contrarian", headline: "Stop chasing tips. Learn structure.", subheadline: `${topic} works better when you learn process first.`, trust_reason: "Institutional trust cues with safe educational framing.", learning_motivation: "Use method over impulse.", cta: safeCtas[4], disclaimer: safeDisclaimer }
  ];
}

function clampWords(value: string, maxWords: number) {
  return value.split(/\s+/).slice(0, maxWords).join(" ").trim();
}

function sanitizeText(value: string) {
  return value
    .replace(systemTokens, "")
    .replace(/[{}[\]":_]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeCopyForPoster(parsed: ParsedInput, copy: CopyVersion): CopyVersion {
  const isArgentina = parsed.country.toLowerCase().includes("argentina") || parsed.language.toLowerCase().includes("es");
  const arHeadlines = [
    "¿Querés entender mejor el mercado?",
    "Aprendé lo básico antes de invertir",
    "Finanzas claras, paso a paso",
    "Empezá sin tecnicismos",
    "Un camino simple para aprender"
  ];
  const arSubheads = [
    "Conceptos simples para tomar mejores decisiones.",
    "Una guía inicial para aprender con más claridad.",
    "Lecciones breves para empezar desde cero.",
    "Aprendé a leer el mercado con calma.",
    "Educación financiera clara y práctica."
  ];
  const arTrust = [
    "Contenido educativo, sin promesas de ganancias.",
    "Explicado paso a paso, con enfoque práctico.",
    "Pensado para principiantes adultos.",
    "Sin tecnicismos innecesarios."
  ];
  const arCta = ["Ver guía inicial", "Empezar ahora", "Aprender desde cero", "Ver ruta simple"];

  let headline = sanitizeText(copy.headline);
  let subheadline = sanitizeText(copy.subheadline);
  let trust = sanitizeText(copy.trust_reason);
  let cta = sanitizeText(copy.cta);

  if (isArgentina) {
    if (headline.length > 52 || !/[¿?]|aprend|empez|finanzas/i.test(headline)) headline = arHeadlines[Math.floor(Math.random() * arHeadlines.length)];
    if (subheadline.length > 80) subheadline = arSubheads[Math.floor(Math.random() * arSubheads.length)];
    if (trust.length > 68) trust = arTrust[Math.floor(Math.random() * arTrust.length)];
    if (cta.length > 28) cta = arCta[Math.floor(Math.random() * arCta.length)];
  } else {
    if (headline.length > 52) headline = clampWords(headline, 8);
    if (subheadline.length > 80) subheadline = clampWords(subheadline, 13);
    if (trust.length > 68) trust = clampWords(trust, 10);
    if (cta.length > 28) cta = clampWords(cta, 4);
  }

  return {
    ...copy,
    headline,
    subheadline,
    trust_reason: trust,
    cta: clampWords(cta, 4),
    disclaimer: safeDisclaimer
  };
}

export function buildDesignPrompt(parsed: ParsedInput, copy: CopyVersion, design_version: DesignTemplate): DesignPrompt {
  const layoutNotes: Record<DesignTemplate, { direction: string; notes: string }> = {
    beginner_clarity: { direction: "Beginner Clarity Timeline", notes: "timeline steps, generous whitespace, numbered sequence" },
    trust_framework: { direction: "Institutional Trust Framework", notes: "left headline, right trust proof, strong footer CTA" },
    market_brief: { direction: "Editorial Market Brief", notes: "editorial newspaper rhythm with key points panel" },
    premium_minimal: { direction: "Premium Minimal Hero", notes: "hero serif headline, calm spacing, minimal chrome" },
    educational_checklist: { direction: "Educational Checklist", notes: "checklist blocks and clear progression" },
    mistake_prevention: { direction: "Contrarian Mistake Prevention", notes: "contrast strip + myth correction structure" },
    opportunity_awareness: { direction: "Opportunity Awareness Board", notes: "dark premium board with three opportunity cards" },
    data_report_lite: { direction: "Data Report Lite", notes: "report-style header and snapshot module" }
  };

  return {
    design_direction: layoutNotes[design_version].direction,
    prompt: `poster size: 1254x1254; target country: ${parsed.country}; target language: ${parsed.language}; target age: ${parsed.target_age}; ad objective: ${parsed.ad_objective}; art direction: ${layoutNotes[design_version].direction}; hero visual: institutional ${layoutNotes[design_version].notes}; background: premium financial depth with restrained light; color palette: navy/white/gray + subtle blue-green accent; typography style: high-contrast editorial sans serif; layout plan: headline top-left, subheadline mid-left, trust line below, CTA bottom-left, disclaimer bottom edge; exact text overlay: headline "${copy.headline}" / subheadline "${copy.subheadline}" / trust_reason "${copy.trust_reason}" / cta "${copy.cta}" / disclaimer "${copy.disclaimer}"; compliance restrictions: no guaranteed profit, no get-rich claims, no CFA, no portfolio manager, no celebrity endorsement, no internal labels, no JSON keys; mobile-first financial education poster, premium institutional realism`,
    negative_prompt: "flashy crypto style, neon gambling mood, guaranteed profit language, get rich quick, insider info, specific investment firm name, CFA, portfolio manager, celebrity endorsement, fake testimonial, exact income claims, candlestick chart",
    layout_notes: layoutNotes[design_version].notes,
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
    fix_suggestions: compliance.safe ? [] : ["Remove risky phrasing", "Keep educational framing", "Keep disclaimer at poster bottom"],
    visual_hook: 8,
    premium_texture: /premium|institutional|restrained/i.test(prompt.prompt) ? 9 : 6,
    composition_balance: 8,
    brand_trust: trust,
    template_similarity_risk: 8,
    mobile_first_impact: mobile
  };
}

export function validatePosterLayout(copy: CopyVersion): { valid: boolean; reason: string; hardFail: boolean } {
  const joined = `${copy.headline} ${copy.subheadline} ${copy.trust_reason} ${copy.cta} ${copy.disclaimer}`;
  const hasSystem = systemTokens.test(joined);
  const missingDisclaimer = !/Educational content only\. Not financial advice\./i.test(copy.disclaimer);
  const missingCTA = copy.cta.trim().length < 3;
  const headlineLong = copy.headline.length > 52;
  const subLong = copy.subheadline.length > 80;
  const ctaLong = copy.cta.length > 28;
  const nonNaturalEs = /invertí ya|ganá rápido|garantizado/i.test(joined);
  const mobileRisk = copy.headline.length > 52 || copy.subheadline.length > 80;

  if (hasSystem) return { valid: false, reason: "Contains backend/system fields", hardFail: true };
  if (missingDisclaimer) return { valid: false, reason: "Missing disclaimer", hardFail: true };
  if (missingCTA) return { valid: false, reason: "Missing CTA", hardFail: true };
  if (nonNaturalEs) return { valid: false, reason: "Language not safe/natural for target country", hardFail: true };
  if (headlineLong || subLong || ctaLong) return { valid: false, reason: "Text overflow risk for mobile poster", hardFail: false };
  if (mobileRisk) return { valid: false, reason: "Mobile readability risk", hardFail: true };
  return { valid: true, reason: "Layout validated", hardFail: false };
}
export const ART_DIRECTIONS = [
  { name: "Premium Financial Magazine Cover", layout: "editorial-cover", hero: "editorial light texture", hook: "Magazine-style large headline and premium spacing", why: "Feels established and high quality", risk: "Low policy risk due to restrained tone" },
  { name: "Executive Learning Portrait", layout: "center-hero-overlay", hero: "abstract executive silhouette", hook: "Centered silhouette with confidence lighting", why: "Builds trust for cautious audiences", risk: "Low policy risk with education framing" },
  { name: "Institutional Dashboard Glow", layout: "cinematic-panel", hero: "blurred data glow environment", hook: "Cinematic depth with institutional signals", why: "Strong modern trust without screenshot feeling", risk: "Low policy risk if copy stays educational" },
  { name: "Calm Classroom Finance", layout: "classroom-scene", hero: "modern classroom whiteboard scene", hook: "Educational context first, selling second", why: "Excellent trust for older beginners", risk: "Very low policy risk" },
  { name: "Learning Path Roadmap", layout: "3-step-roadmap", hero: "educational path diagram", hook: "Three-step visual path from beginner to clarity", why: "Converts well for beginner intent", risk: "Low policy risk with neutral claims" },
  { name: "Myth vs Reality Split", layout: "split-contrast", hero: "left/right myth-reality blocks", hook: "High-contrast misconception correction", why: "Good click motivation without hype", risk: "Low-medium; keep wording calm" },
  { name: "Blue Chip Trust Poster", layout: "minimal-institutional", hero: "minimal icon + trust bars", hook: "Blue-chip institutional stability cue", why: "Works for conservative financial audiences", risk: "Very low policy risk" },
  { name: "Local Market Signal", layout: "local-skyline", hero: "subtle Buenos Aires skyline or local cues", hook: "Localized familiarity without tourism style", why: "Improves country-fit and relevance", risk: "Low policy risk when subtle" },
  { name: "Premium Checklist Poster", layout: "checklist-premium", hero: "minimal icon checklist", hook: "Clear 3-point guided checklist", why: "Readable and practical for mobile", risk: "Low policy risk" },
  { name: "Dark Premium Seminar", layout: "dark-spotlight", hero: "seminar spotlight stage", hook: "Premium dark stage with focused headline", why: "High visual hook for test campaigns", risk: "Low-medium; avoid aggressive claims" }
] as const;

export function buildCompositionPlan(country: string, idx: number) {
  const direction = ART_DIRECTIONS[idx % ART_DIRECTIONS.length];
  const argentinaTone = country.toLowerCase().includes("argentina");
  return {
    art_direction: direction.name,
    layout_type: direction.layout,
    visual_hook: direction.hook,
    why_this_design_works: direction.why,
    explanation: {
      art_direction: direction.name,
      visual_hook: direction.hook,
      reason: direction.why,
      risk: direction.risk
    },
    plan: {
      hero_visual: direction.hero,
      focal_point: "upper-middle attention zone",
      headline_position: direction.layout.includes("split") ? "top-left" : "upper-left",
      cta_position: direction.layout.includes("roadmap") ? "bottom-right" : "bottom-left",
      depth_layer: "background texture + hero + text foreground",
      background_texture: direction.layout.includes("dark") ? "dark gradient with glow layers" : "soft gradient with subtle texture",
      color_palette: argentinaTone ? "navy / white / gray with light-blue accent" : "navy / white / gray with subtle green accent",
      negative_space_area: "top-right and lower-right for mobile breathing room",
      mobile_readability_plan: "headline max 2 lines, subheadline max 2 lines, trust max 1 line, CTA max 4 words"
    }
  };
}
