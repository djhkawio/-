import { getCountryContext, getCountryStrategy, multilingualHookLibrary, weightedAnglePick } from "@/lib/countryStrategy";
import { userProfile } from "@/lib/userProfile";

export type FormData = {
  country: string;
  theme: string;
  age: string;
  style: string;
  goal: string;
  quantity: number;
};

export type AdAngle = "question" | "beginner" | "curiosity" | "mistake" | "opportunity";
export type DesignTemplate = "beginner_clarity" | "trust_framework" | "market_brief" | "premium_minimal" | "educational_checklist" | "mistake_prevention" | "opportunity_awareness" | "data_report_lite";

export type PosterCopy = {
  language: string;
  hook: string;
  subline: string;
  bullets: [string, string, string];
  cta: string;
  disclaimer: string;
};

export type PosterVariant = {
  id: string;
  adAngle: AdAngle;
  designTemplate: DesignTemplate;
  paletteKey: string;
  layoutStyle: string;
  conceptName: string;
  visualDirection: string;
  textDensity: "low" | "medium";
  ctaStyle: "soft_education" | "guided_learning";
  palette: {
    bg: string;
    panel: string;
    title: string;
    body: string;
    accent: string;
  };
  copy: PosterCopy;
};


export type PreferenceWeights = {
  designTemplate: Record<string, number>;
  angle: Record<string, number>;
  palette: Record<string, number>;
  layoutStyle: Record<string, number>;
  structure: Record<string, number>;
};



export type ConceptQualityScore = {
  localized_language: number;
  click_motivation: number;
  trust_signal: number;
  compliance_safety: number;
  mobile_readability: number;
  visual_quality_potential: number;
  distinction: number;
};

export type CreativeConcept = {
  concept_name: string;
  country: string;
  language: string;
  audience: string;
  hook_angle: string;
  headline: string;
  subheadline: string;
  benefits: [string, string, string];
  cta: string;
  disclaimer: string;
  palette: string;
  layout_template: DesignTemplate;
  visual_direction: string;
  avoid: string[];
  quality_score: ConceptQualityScore;
};

export type BaseAd = {
  headline: string;
  subline: string;
  bullets: string[];
  cta: string;
  angle: AdAngle;
  tone: string;
};

export type PosterMetadata = {
  country: string;
  theme: string;
  language: string;
  designTemplate: string;
  angle: string;
  hook: string;
  subline: string;
  bullets: string[];
  cta: string;
  palette: string;
  layoutStyle: string;
  structure: string;
  hook_type: string;
  language_style: string;
  text_density: string;
  cta_style: string;
  visual_direction: string;
};

type PreferenceFeedback = "like" | "reject";

export const PREFERENCE_WEIGHTS_KEY = "poster.preference.weights.v1";
export const PREFERENCE_MEMORY_KEY = "poster.preference.memory.v1";

export type PreferenceRecord = {
  type: PreferenceFeedback;
  metadata: PosterMetadata;
  createdAt: number;
};

type LocaleCode = "en" | "zh" | "ja" | "fr" | "de" | "es" | "pt" | "ro" | "it" | "pl";

const defaultDisclaimer = userProfile.required.disclaimer;

const forbidden = [
  /guaranteed return/gi,
  /download\s*pdf/gi,
  /download/gi,
  /portfolio manager/gi,
  /cfa/gi,
  /specific investment company/gi
];

const adAngles: AdAngle[] = ["question", "beginner", "curiosity", "mistake", "opportunity"];
const templates: DesignTemplate[] = [
  "beginner_clarity",
  "trust_framework",
  "market_brief",
  "premium_minimal",
  "educational_checklist",
  "mistake_prevention",
  "opportunity_awareness",
  "data_report_lite"
];

const localeRules: Array<{ lang: LocaleCode; aliases: string[] }> = [
  { lang: "zh", aliases: ["china", "chinese", "中国", "中华人民共和国", "hong kong", "taiwan"] },
  { lang: "ja", aliases: ["japan", "日本"] },
  { lang: "fr", aliases: ["france", "french", "法国", "belgium"] },
  { lang: "de", aliases: ["germany", "deutschland", "德国", "austria"] },
  {
    lang: "es",
    aliases: ["spain", "españa", "espanol", "西班牙", "argentina", "mexico", "chile", "colombia", "peru"]
  },
  { lang: "pt", aliases: ["brazil", "brasil", "brazilian", "portugal", "portuguese", "巴西", "葡萄牙"] },
  { lang: "ro", aliases: ["romania", "romanian", "românia", "罗马尼亚"] },
  { lang: "it", aliases: ["italy", "italian", "italia", "意大利"] },
  { lang: "pl", aliases: ["poland", "polish", "polska", "波兰"] },
  { lang: "en", aliases: ["united states", "usa", "us", "america", "uk", "united kingdom", "canada"] }
];

function sanitizeTheme(input: string) {
  return input.trim().replace(/download\s*pdf/gi, "resources").replace(/download/gi, "learn");
}

function removeForbidden(text: string): string {
  return forbidden
    .reduce<string>((acc, rule) => acc.replace(rule, ""), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}

function detectLocale(countryInput: string): LocaleCode {
  const normalized = countryInput.trim().toLowerCase();
  const rule = localeRules.find((item) => item.aliases.some((alias) => normalized.includes(alias)));
  return rule?.lang || "en";
}


function rewriteTopic(payload: FormData): string {
  const topic = removeForbidden(sanitizeTheme(payload.theme || "Financial literacy")) || "Financial literacy";
  const goal = (payload.goal || "Lead education").trim();
  const country = payload.country.toLowerCase();

  if (country.includes("argentina")) {
    return `Aprendé ${topic} con enfoque práctico para ${goal.toLowerCase()}`;
  }

  if (country.includes("romania") || country.includes("românia")) {
    return `Înțelege ${topic} prin pași simpli pentru ${goal.toLowerCase()}`;
  }

  return `Learn ${topic} with a practical ${goal.toLowerCase()} approach`;
}

function scoreCopyQuality(copy: PosterCopy): number {
  let score = 60;
  if (copy.hook.length > 24) score += 10;
  if (copy.subline.length > 36) score += 10;
  if (copy.bullets.length === 3) score += 8;
  if (!/guaranteed|profit|download/i.test(`${copy.hook} ${copy.subline} ${copy.cta}`)) score += 8;
  if (/learn|aprend|entend|educ/i.test(copy.cta)) score += 8;
  return Math.min(100, score);
}

function rewriteLowScore(copy: PosterCopy): PosterCopy {
  return {
    ...copy,
    hook: copy.hook.includes("?") ? copy.hook : `${copy.hook}?`,
    subline: `${copy.subline} Clear, compliant, and beginner-friendly.`,
    cta: /learn|aprend|entend|educ/i.test(copy.cta) ? copy.cta : "Learn how it works"
  };
}

const directionLibrary = [
  "Beginner Clarity",
  "Trust Framework",
  "Market Brief",
  "Premium Minimal",
  "Educational Checklist",
  "Mistake Prevention",
  "Opportunity Awareness",
  "Data Report Lite"
];

function scoreConcept(copy: PosterCopy, distinction: number): ConceptQualityScore {
  const localized = /querés|aprendé|entendé|empezá|aprende|learn|înțelege/i.test(copy.hook) ? 9 : 7;
  const clickMotivation = copy.hook.includes("?") || copy.hook.length > 24 ? 9 : 7;
  const trust = /clear|clar|confi|trust|educ/i.test(`${copy.subline} ${copy.bullets.join(" ")}`) ? 9 : 7;
  const compliance = /guaranteed|rich quick|portfolio manager|cfa|download/i.test(`${copy.hook} ${copy.subline} ${copy.cta}`) ? 4 : 9;
  const mobile = copy.hook.length <= 90 && copy.bullets.every((b) => b.length < 92) ? 9 : 7;
  const visual = 8 + Math.min(2, distinction / 2);

  return {
    localized_language: localized,
    click_motivation: clickMotivation,
    trust_signal: trust,
    compliance_safety: compliance,
    mobile_readability: mobile,
    visual_quality_potential: visual,
    distinction
  };
}

function improveConceptIfNeeded(copy: PosterCopy, score: ConceptQualityScore): PosterCopy {
  const critical = Object.values(score).some((v) => v < 8);
  if (!critical) return copy;
  const improved = rewriteLowScore(copy);
  return {
    ...improved,
    bullets: [
      improved.bullets[0],
      improved.bullets[1],
      "Educational framing only, no guaranteed outcomes."
    ]
  };
}

function buildConceptJSON(
  payload: FormData,
  template: DesignTemplate,
  direction: string,
  adAngle: AdAngle,
  copy: PosterCopy,
  score: ConceptQualityScore,
  paletteKey: string
): CreativeConcept {
  return {
    concept_name: direction,
    country: payload.country,
    language: copy.language,
    audience: payload.age,
    hook_angle: adAngle,
    headline: copy.hook,
    subheadline: copy.subline,
    benefits: copy.bullets,
    cta: copy.cta,
    disclaimer: copy.disclaimer,
    palette: paletteKey,
    layout_template: template,
    visual_direction: `${direction} / mobile-first trust ad`,
    avoid: [
      "guaranteed return",
      "get rich quick",
      "specific investment firm",
      "CFA",
      "portfolio manager",
      "download now"
    ],
    quality_score: score
  };
}

export function generateConceptJSON(payload: FormData, preferences?: PreferenceWeights, baseAd?: BaseAd): CreativeConcept[] {
  const variants = buildVariants(payload, preferences, baseAd);
  return variants.map((variant, idx) => {
    const score = scoreConcept(variant.copy, 8 + (idx % 3));
    return buildConceptJSON(
      payload,
      variant.designTemplate,
      directionLibrary[idx % directionLibrary.length],
      variant.adAngle,
      variant.copy,
      score,
      variant.paletteKey
    );
  });
}

function i18nCopy(lang: LocaleCode, payload: FormData, angle: AdAngle, idx: number, baseAd?: BaseAd): PosterCopy {
  const safeTheme = removeForbidden(baseAd?.headline || rewriteTopic(payload) || "Financial literacy") || "Financial literacy";
  const age = payload.age || "38-65";
  const style = removeForbidden(baseAd?.tone || payload.style || "Professional") || "Professional";
  const variant = String.fromCharCode(65 + idx);
  const baseSubline = removeForbidden(baseAd?.subline || "");
  const baseBullets = (baseAd?.bullets || []).map((b) => removeForbidden(b)).filter(Boolean);
  const baseCta = removeForbidden(baseAd?.cta || "");
  const countryContext = getCountryContext(payload.country || "");

  if (lang === "es") {
    const strategy = getCountryStrategy(payload.country || "");
    const trust = strategy?.trustKeywords || ["claridad", "paso a paso", "aprendizaje simple"];
    const hookPool = multilingualHookLibrary.es[angle];
    const hook = hookPool[idx % hookPool.length].replace("{theme}", safeTheme);
    const ctas = strategy?.ctaStyle === "simple"
      ? ["Aprendé cómo funciona", "Entendé un ejemplo simple", "Empezá con una guía clara"]
      : ["Aprendé cómo funciona", "Entendé un ejemplo simple", "Empezá con una guía clara"];

    return {
      language: "Español",
      hook,
      subline: baseSubline || `Explicación ${style.toLowerCase()}, ${countryContext.culturalExpression}, ideal para móvil.`,
      bullets: (baseBullets.length >= 3
        ? [baseBullets[0], baseBullets[1], baseBullets[2]]
        : [
            `A/B ${variant}: ${trust[0]} para entender lo esencial rápido`,
            `Enfoque ${trust[1]} sin promesas exageradas`,
            `Contenido ${trust[2]} incluso sin experiencia`
          ]) as [string, string, string],
      cta: baseCta || ctas[idx % ctas.length],
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "ro") {
    const strategy = getCountryStrategy(payload.country || "");
    const trust = strategy?.trustKeywords || ["clar", "pas cu pas", "educațional"];
    const hookPool = multilingualHookLibrary.ro[angle];
    const hook = hookPool[idx % hookPool.length].replace("{theme}", safeTheme);
    const ctas = strategy?.ctaStyle === "guided"
      ? ["Află cum funcționează", "Vezi exemplu simplu", "Începe acum"]
      : ["Începe acum", "Află cum funcționează", "Vezi exemplu simplu"];

    return {
      language: "Română",
      hook,
      subline: baseSubline || `Mesaj ${style.toLowerCase()}, ${countryContext.culturalExpression}, optimizat pentru mobil.`,
      bullets: (baseBullets.length >= 3
        ? [baseBullets[0], baseBullets[1], baseBullets[2]]
        : [
            `A/B ${variant}: structură ${trust[0]} pentru decizii informate`,
            `Abordare ${trust[1]} fără limbaj complicat`,
            `Conținut ${trust[2]} pentru începători`
          ]) as [string, string, string],
      cta: baseCta || ctas[idx % ctas.length],
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "zh") {
    const hooks: Record<AdAngle, string> = {
      question: `你知道如何更清晰地理解${safeTheme}吗？`,
      beginner: `${safeTheme}入门：适合${age}人群的简明路径`,
      curiosity: `${safeTheme}里最容易被忽略的一步是什么？`,
      mistake: `${safeTheme}常见误区：一开始就跳过基础`,
      opportunity: `抓住一个简单机会，系统学习${safeTheme}`
    };
    return {
      language: "中文",
      hook: hooks[angle],
      subline: baseSubline || `以${style}风格解释核心逻辑，移动端阅读更清晰，并保持合规表达。`,
      bullets: (baseBullets.length >= 3
        ? [baseBullets[0], baseBullets[1], baseBullets[2]]
        : [
            `A/B ${variant}：广告结构清晰，先结论后解释`,
            "免费学习，步骤简单",
            "无经验也可以快速入门"
          ]) as [string, string, string],
      cta: baseCta || ["了解它如何运作", "看一个简单示例", "立即开始"][idx % 3],
      disclaimer: defaultDisclaimer
    };
  }

  const hooks: Record<AdAngle, string> = {
    question: `Do you know the simple way to understand ${safeTheme}?`,
    beginner: `${safeTheme}: a practical beginner path for ages ${age}`,
    curiosity: `What part of ${safeTheme} do most people miss?`,
    mistake: `Common mistake in ${safeTheme}: skipping the basics`,
    opportunity: `A practical opportunity to build confidence in ${safeTheme}`
  };

  return {
    language: "English",
    hook: hooks[angle],
    subline: baseSubline || `A ${style.toLowerCase()} and ${countryContext.culturalExpression} explanation built for mobile reading.`,
    bullets: (baseBullets.length >= 3
      ? [baseBullets[0], baseBullets[1], baseBullets[2]]
      : [
          `A/B ${variant}: concise structure for quick review`,
          "Free learning approach with clear steps",
          "Beginner-friendly, even with no prior experience"
        ]) as [string, string, string],
    cta: baseCta || ["Learn how it works", "See simple example", "Start now"][idx % 3],
    disclaimer: defaultDisclaimer
  };
}

const palettes = [
  { key: "navy-trust", layoutStyle: "layered-card", colors: { bg: "#091827", panel: "#13293f", title: "#f7fbff", body: "#cad8e8", accent: "#7fb3e7" } },
  { key: "report-cool", layoutStyle: "panel-grid", colors: { bg: "#0f1e2f", panel: "#1b334d", title: "#f2f8ff", body: "#c8d6e4", accent: "#90bee8" } },
  { key: "learning-soft", layoutStyle: "step-cards", colors: { bg: "#102435", panel: "#22415b", title: "#f6fbff", body: "#cadbe8", accent: "#8bc0ea" } },
  { key: "brief-ink", layoutStyle: "news-brief", colors: { bg: "#102133", panel: "#1f3a54", title: "#f6faff", body: "#cbd7e4", accent: "#7fb1e2" } },
  { key: "minimal-luxe", layoutStyle: "hero-minimal", colors: { bg: "#0c1a2b", panel: "#1d3248", title: "#f8fbff", body: "#ced9e6", accent: "#9bc5eb" } }
];

function weightedPick(items: string[], weights: Record<string, number> | undefined): string {
  const scored = items.map((item) => {
    const w = weights?.[item] ?? 0;
    const noisy = w + Math.random() * 1.25;
    return { item, score: noisy };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].item;
}

function rotateFromSeed<T>(list: T[], seed: number): T[] {
  const offset = Math.abs(seed) % list.length;
  return [...list.slice(offset), ...list.slice(0, offset)];
}

export function buildVariants(payload: FormData, preferences?: PreferenceWeights, baseAd?: BaseAd): PosterVariant[] {
  const lang = detectLocale(payload.country || "");
  const templateOrder = rotateFromSeed(templates, payload.country.length + payload.theme.length);
  const countryStrategy = getCountryStrategy(payload.country || "");

  const uniqueTemplates = [...templateOrder]
    .map((template) => ({ template, score: (preferences?.designTemplate?.[template] ?? 0) + Math.random() + (userProfile.stylePreference.includes("premium_minimal") && template === "premium_minimal" ? 0.8 : 0) + (userProfile.stylePreference.includes("institutional") && (template === "trust_framework" || template === "mistake_prevention") ? 0.6 : 0) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.template as DesignTemplate)
    .slice(0, 5);

  const angleWeights: Record<AdAngle, number> = {
    question: (countryStrategy?.angleWeights.question ?? 1) + ((preferences?.angle.question ?? 0) * 0.25),
    beginner: (countryStrategy?.angleWeights.beginner ?? 1) + ((preferences?.angle.beginner ?? 0) * 0.25),
    curiosity: (countryStrategy?.angleWeights.curiosity ?? 1) + ((preferences?.angle.curiosity ?? 0) * 0.25),
    mistake: (countryStrategy?.angleWeights.mistake ?? 1) + ((preferences?.angle.mistake ?? 0) * 0.25),
    opportunity: (countryStrategy?.angleWeights.opportunity ?? 1) + ((preferences?.angle.opportunity ?? 0) * 0.25)
  };

  if (baseAd?.angle) {
    angleWeights[baseAd.angle] = (angleWeights[baseAd.angle] ?? 1) + 0.6;
  }

  const angleOrder = [...adAngles]
    .map((angle) => ({ angle, score: angleWeights[angle] + Math.random() * 0.35 }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.angle as AdAngle);

  return new Array(5).fill(0).map((_, idx) => {
    const designTemplate = uniqueTemplates[idx % uniqueTemplates.length];
    const adAngle = angleOrder[idx % angleOrder.length] || weightedAnglePick(angleWeights);
    const paletteKey = weightedPick(palettes.map((p) => p.key), preferences?.palette);
    const paletteEntry = palettes.find((p) => p.key === paletteKey) || palettes[idx % palettes.length];
    const preferredLayout = weightedPick(
      [paletteEntry.layoutStyle, ...palettes.map((p) => p.layoutStyle)],
      { ...(preferences?.layoutStyle || {}), ...(preferences?.structure || {}) }
    );

    const generatedCopy = i18nCopy(lang, payload, adAngle, idx, baseAd);
    const quality = scoreConcept(generatedCopy, 8 + (idx % 3));
    const finalCopy = improveConceptIfNeeded(generatedCopy, quality);

    return {
      id: `${Date.now()}-${idx}`,
      adAngle,
      designTemplate,
      conceptName: directionLibrary[idx % directionLibrary.length],
      visualDirection: `${directionLibrary[idx % directionLibrary.length]} / premium mobile-first`,
      textDensity: "low",
      ctaStyle: "soft_education",
      paletteKey: paletteEntry.key,
      layoutStyle: preferredLayout,
      palette: paletteEntry.colors,
      copy: finalCopy
    };
  });
}

export function toPosterMetadata(payload: FormData, variant: PosterVariant): PosterMetadata {
  return {
    country: payload.country,
    theme: payload.theme,
    language: variant.copy.language,
    designTemplate: variant.designTemplate,
    angle: variant.adAngle,
    hook: variant.copy.hook,
    subline: variant.copy.subline,
    bullets: [...variant.copy.bullets],
    cta: variant.copy.cta,
    palette: variant.paletteKey,
    layoutStyle: variant.layoutStyle,
    structure: variant.layoutStyle,
    hook_type: variant.adAngle,
    language_style: variant.copy.language,
    text_density: variant.textDensity,
    cta_style: variant.ctaStyle,
    visual_direction: variant.visualDirection
  };
}

export function savePreference(feedback: PreferenceFeedback, metadata: PosterMetadata) {
  if (typeof window === "undefined") return;

  const weights: PreferenceWeights = JSON.parse(localStorage.getItem(PREFERENCE_WEIGHTS_KEY) || '{"designTemplate":{},"angle":{},"palette":{},"layoutStyle":{},"structure":{}}');
  const memory: PreferenceRecord[] = JSON.parse(localStorage.getItem(PREFERENCE_MEMORY_KEY) || '[]');
  const delta = feedback === "like" ? 2 : -2;

  const update = (bucket: Record<string, number>, key: string) => ({
    ...bucket,
    [key]: Math.max(-10, Math.min(24, (bucket[key] ?? 0) + delta))
  });

  const nextWeights: PreferenceWeights = {
    designTemplate: update(weights.designTemplate, metadata.designTemplate),
    angle: update(weights.angle, metadata.angle),
    palette: update(weights.palette, metadata.palette),
    layoutStyle: update(weights.layoutStyle, metadata.layoutStyle),
    structure: update(weights.structure || {}, metadata.structure)
  };

  const nextMemory = [...memory, { type: feedback, metadata, createdAt: Date.now() }].slice(-300);

  localStorage.setItem(PREFERENCE_WEIGHTS_KEY, JSON.stringify(nextWeights));
  localStorage.setItem(PREFERENCE_MEMORY_KEY, JSON.stringify(nextMemory));
  return { weights: nextWeights, memory: nextMemory };
}

export function generateVariants(payload: FormData, baseAd?: BaseAd): PosterVariant[] {
  if (typeof window === "undefined") return buildVariants(payload, undefined, baseAd);
  const prefs = JSON.parse(localStorage.getItem(PREFERENCE_WEIGHTS_KEY) || '{"designTemplate":{},"angle":{},"palette":{},"layoutStyle":{},"structure":{}}') as PreferenceWeights;
  return buildVariants(payload, prefs, baseAd);
}

export function drawPoster(canvas: HTMLCanvasElement, variant: PosterVariant, payload: FormData) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 1254;
  canvas.height = 1254;

  if (variant.designTemplate === "beginner_clarity") return renderLearningSteps(ctx, variant, payload);
  if (variant.designTemplate === "trust_framework") return renderBankTrust(ctx, variant, payload);
  if (variant.designTemplate === "market_brief") return renderMarketBrief(ctx, variant, payload);
  if (variant.designTemplate === "premium_minimal") return renderPremiumMinimal(ctx, variant, payload);
  if (variant.designTemplate === "educational_checklist") return renderStoryFrame(ctx, variant, payload);
  if (variant.designTemplate === "mistake_prevention") return renderEditorialSplit(ctx, variant, payload);
  if (variant.designTemplate === "opportunity_awareness") return renderTrustInfographic(ctx, variant, payload);
  return renderDataReport(ctx, variant, payload);
}

function renderBaseTexture(ctx: CanvasRenderingContext2D, variant: PosterVariant) {
  const grad = ctx.createLinearGradient(0, 0, 1254, 1254);
  grad.addColorStop(0, "#f8fafc");
  grad.addColorStop(1, variant.palette.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1254, 1254);

  ctx.strokeStyle = "rgba(15,23,42,0.06)";
  for (let x = 0; x < 1254; x += 84) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1254);
    ctx.stroke();
  }
}

function renderBankTrust(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 72, 72, 1110, 1110, 28, true, "rgba(255,255,255,0.90)");
  ctx.fillStyle = variant.palette.accent;
  ctx.fillRect(72, 72, 1110, 14);
  text(ctx, "TRUST FRAMEWORK", 112, 138, "600 26px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.hook, 112, 270, 690, 76, "700 64px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.subline, 112, 430, 690, 42, "400 31px Inter, Arial", "#334155");

  roundRect(ctx, 840, 188, 300, 280, 18, true, "rgba(15,23,42,0.05)");
  text(ctx, "Why trust this?", 874, 246, "600 30px Inter, Arial", "#0f172a");
  variant.copy.bullets.forEach((line, i) => {
    circle(ctx, 876, 304 + i * 68, 8, variant.palette.accent);
    textWrap(ctx, line, 898, 314 + i * 68, 220, 32, "500 23px Inter, Arial", "#334155");
  });

  text(ctx, "Education-first, no unrealistic claims.", 112, 962, "500 28px Inter, Arial", "#475569");
  roundRect(ctx, 112, 1002, 480, 84, 42, true, "#0f172a");
  text(ctx, variant.copy.cta, 148, 1056, "700 30px Inter, Arial", "#f8fafc");
  footer(ctx, variant, payload);
}

function renderDataReport(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 72, 72, 1110, 1110, 24, true, "#ffffff");
  text(ctx, "DATA REPORT LITE", 104, 130, "700 24px Inter, Arial", "#0f172a");
  text(ctx, "Financial Education Brief", 932, 130, "500 20px Inter, Arial", "#64748b");

  ctx.strokeStyle = "rgba(15,23,42,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(104, 156);
  ctx.lineTo(1148, 156);
  ctx.stroke();

  textWrap(ctx, variant.copy.hook, 104, 260, 680, 74, "700 60px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.subline, 104, 420, 680, 42, "400 30px Inter, Arial", "#334155");

  roundRect(ctx, 830, 220, 318, 320, 16, true, "rgba(15,23,42,0.04)");
  text(ctx, "Snapshot", 858, 274, "600 28px Inter, Arial", "#0f172a");
  variant.copy.bullets.forEach((line, i) => textWrap(ctx, `${i + 1}. ${line}`, 858, 334 + i * 74, 272, 32, "500 22px Inter, Arial", "#334155"));

  ctx.strokeStyle = variant.palette.accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(104, 690);
  ctx.lineTo(320, 620);
  ctx.lineTo(520, 662);
  ctx.lineTo(700, 590);
  ctx.lineTo(860, 636);
  ctx.stroke();
  text(ctx, "Trendline: clarity ↑ engagement", 104, 742, "600 28px Inter, Arial", "#0f172a");
  roundRect(ctx, 104, 948, 560, 88, 44, true, "#0f172a");
  text(ctx, variant.copy.cta, 140, 1006, "700 31px Inter, Arial", "#f8fafc");
  footer(ctx, variant, payload);
}

function renderLearningSteps(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 72, 72, 1110, 1110, 28, true, "rgba(255,255,255,0.94)");
  text(ctx, "BEGINNER CLARITY", 108, 132, "700 24px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.hook, 108, 250, 980, 72, "700 58px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.subline, 108, 404, 980, 40, "400 29px Inter, Arial", "#475569");
  ctx.strokeStyle = "rgba(15,23,42,0.14)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(176, 474);
  ctx.lineTo(176, 930);
  ctx.stroke();
  variant.copy.bullets.forEach((line, i) => {
    const y = 542 + i * 136;
    circle(ctx, 176, y - 10, 24, variant.palette.accent);
    text(ctx, String(i + 1), 168, y - 2, "700 19px Inter, Arial", "#0f172a");
    text(ctx, `Step ${i + 1}`, 236, y - 8, "600 26px Inter, Arial", "#0f172a");
    textWrap(ctx, line, 236, y + 30, 840, 34, "500 27px Inter, Arial", "#334155");
  });
  roundRect(ctx, 108, 980, 520, 88, 44, true, "#0f172a");
  text(ctx, variant.copy.cta, 146, 1038, "700 30px Inter, Arial", "#f8fafc");
  footer(ctx, variant, payload);
}

function renderMarketBrief(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 64, 64, 1126, 1126, 14, true, "#f8fafc");
  text(ctx, "MARKET BRIEF", 98, 120, "700 28px Inter, Arial", "#0f172a");
  text(ctx, "Edition 01", 1030, 120, "500 21px Inter, Arial", "#64748b");
  ctx.strokeStyle = "rgba(15,23,42,0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(98, 146);
  ctx.lineTo(1150, 146);
  ctx.stroke();
  textWrap(ctx, variant.copy.hook, 98, 246, 1050, 74, "700 62px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.subline, 98, 392, 1050, 40, "400 30px Inter, Arial", "#334155");

  ctx.fillStyle = "rgba(15,23,42,0.03)";
  ctx.fillRect(98, 470, 680, 420);
  text(ctx, "Key points", 128, 530, "600 28px Inter, Arial", "#0f172a");
  variant.copy.bullets.forEach((line, i) => textWrap(ctx, `• ${line}`, 128, 594 + i * 84, 620, 34, "500 27px Inter, Arial", "#334155"));

  roundRect(ctx, 818, 470, 332, 420, 14, true, "#0f172a");
  text(ctx, "Read before acting", 850, 540, "600 28px Inter, Arial", "#f8fafc");
  textWrap(ctx, "Learning first builds confidence and consistency.", 850, 612, 266, 34, "400 24px Inter, Arial", "rgba(248,250,252,0.88)");
  roundRect(ctx, 98, 944, 470, 92, 46, true, variant.palette.accent);
  text(ctx, variant.copy.cta, 130, 1004, "700 31px Inter, Arial", "#0b2236");
  footer(ctx, variant, payload);
}

function renderPremiumMinimal(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 86, 86, 1082, 1082, 12, true, "#ffffff");
  ctx.strokeStyle = "rgba(15,23,42,0.10)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(86, 86, 1082, 1082);
  text(ctx, "PREMIUM MINIMAL", 116, 142, "600 21px Inter, Arial", "#475569");
  textWrap(ctx, variant.copy.hook, 116, 360, 1020, 88, "700 74px Georgia, Times New Roman, serif", "#0f172a");
  textWrap(ctx, variant.copy.subline, 116, 566, 780, 40, "400 30px Inter, Arial", "#334155");
  variant.copy.bullets.forEach((line, i) => textWrap(ctx, line, 116, 716 + i * 72, 780, 32, "500 26px Inter, Arial", "#475569"));
  roundRect(ctx, 116, 952, 430, 88, 44, true, "#0f172a");
  text(ctx, variant.copy.cta, 150, 1008, "700 30px Inter, Arial", "#f8fafc");
  footer(ctx, variant, payload);
}

function renderEditorialSplit(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 70, 70, 1114, 1114, 20, true, "#ffffff");
  ctx.fillStyle = "rgba(220,38,38,0.12)";
  ctx.fillRect(70, 70, 300, 1114);
  text(ctx, "MISTAKE PREVENTION", 98, 124, "700 21px Inter, Arial", "#991b1b");
  text(ctx, "Avoid these traps", 98, 170, "600 30px Inter, Arial", "#7f1d1d");
  variant.copy.bullets.forEach((b, i) => textWrap(ctx, `• ${b}`, 98, 260 + i * 180, 240, 36, "500 26px Inter, Arial", "#7f1d1d"));
  textWrap(ctx, variant.copy.hook, 410, 280, 730, 78, "700 62px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.subline, 410, 454, 730, 42, "400 31px Inter, Arial", "#334155");
  roundRect(ctx, 410, 950, 450, 90, 45, true, "#0f172a");
  text(ctx, variant.copy.cta, 444, 1008, "700 30px Inter, Arial", "#f8fafc");
  footer(ctx, variant, payload);
}

function renderStoryFrame(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 86, 86, 1082, 1082, 22, true, "#ffffff");
  text(ctx, "EDUCATIONAL CHECKLIST", 126, 146, "700 24px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.hook, 126, 246, 960, 70, "700 56px Inter, Arial", "#0f172a");
  textWrap(ctx, variant.copy.subline, 126, 400, 960, 40, "400 29px Inter, Arial", "#475569");
  variant.copy.bullets.forEach((b, i) => {
    roundRect(ctx, 126, 500 + i * 136, 980, 104, 18, true, "rgba(15,23,42,0.04)");
    text(ctx, "✓", 158, 566 + i * 136, "700 40px Inter, Arial", variant.palette.accent);
    textWrap(ctx, b, 210, 566 + i * 136, 860, 34, "500 27px Inter, Arial", "#334155");
  });
  roundRect(ctx, 126, 952, 500, 88, 44, true, "#0f172a");
  text(ctx, variant.copy.cta, 160, 1010, "700 30px Inter, Arial", "#f8fafc");
  footer(ctx, variant, payload);
}

function renderTrustInfographic(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  const grad = ctx.createLinearGradient(72, 72, 1182, 1182);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e293b");
  roundRect(ctx, 72, 72, 1110, 1110, 24, true, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(72, 72, 1110, 1110);
  text(ctx, "OPPORTUNITY AWARENESS", 112, 132, "600 24px Inter, Arial", "rgba(248,250,252,0.9)");
  textWrap(ctx, variant.copy.hook, 112, 262, 1030, 68, "700 58px Inter, Arial", "#f8fafc");
  textWrap(ctx, variant.copy.subline, 112, 420, 1030, 40, "400 30px Inter, Arial", "rgba(241,245,249,0.9)");
  for (let i = 0; i < 3; i += 1) {
    const x = 112 + i * 340;
    roundRect(ctx, x, 548, 320, 260, 18, true, "rgba(248,250,252,0.10)");
    text(ctx, `Opportunity ${i + 1}`, x + 22, 602, "600 24px Inter, Arial", "#cbd5e1");
    textWrap(ctx, variant.copy.bullets[i], x + 22, 658, 270, 32, "500 24px Inter, Arial", "#f8fafc");
  }
  roundRect(ctx, 112, 934, 500, 92, 46, true, "#f8fafc");
  text(ctx, variant.copy.cta, 146, 994, "700 30px Inter, Arial", "#0f172a");
  footer(ctx, variant, payload);
}

function footer(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  text(ctx, `${payload.country} · ${variant.copy.language} · ${variant.designTemplate}`, 108, 1114, "500 21px Inter, Arial", "rgba(15,23,42,0.72)");
  textWrap(ctx, variant.copy.disclaimer, 108, 1160, 1020, 26, "400 20px Inter, Arial", "rgba(15,23,42,0.56)");
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function textWrap(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  font: string,
  color: string
) {
  ctx.font = font;
  ctx.fillStyle = color;
  wrapText(ctx, value, x, y, maxWidth, lineHeight);
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean,
  color?: string
) {
  if (color) ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n += 1) {
    const testLine = `${line}${words[n]} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = `${words[n]} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
