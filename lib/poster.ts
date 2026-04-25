import { getCountryStrategy, multilingualHookLibrary, weightedAnglePick } from "@/lib/countryStrategy";

export type FormData = {
  country: string;
  theme: string;
  age: string;
  style: string;
  quantity: number;
};

export type AdAngle = "question" | "beginner" | "curiosity" | "mistake" | "opportunity";
export type DesignTemplate = "bank-trust" | "data-report" | "learning-steps" | "market-brief" | "premium-minimal";

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
};

type PreferenceFeedback = "like" | "reject";

export const PREFERENCE_WEIGHTS_KEY = "poster.preference.weights.v1";
export const PREFERENCE_MEMORY_KEY = "poster.preference.memory.v1";

export type PreferenceRecord = {
  country: string;
  angle: string;
  hook: string;
  designTemplate: string;
  type: PreferenceFeedback;
  createdAt: number;
};

type LocaleCode = "en" | "zh" | "ja" | "fr" | "de" | "es" | "pt" | "ro" | "it" | "pl";

const defaultDisclaimer =
  "Educational content only. Not financial advice. Results are not guaranteed.";

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
  "bank-trust",
  "data-report",
  "learning-steps",
  "market-brief",
  "premium-minimal"
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

function i18nCopy(lang: LocaleCode, payload: FormData, angle: AdAngle, idx: number, baseAd?: BaseAd): PosterCopy {
  const safeTheme = removeForbidden(sanitizeTheme(baseAd?.headline || payload.theme || "Financial literacy")) || "Financial literacy";
  const age = payload.age || "38-65";
  const style = removeForbidden(baseAd?.tone || payload.style || "Professional") || "Professional";
  const variant = String.fromCharCode(65 + idx);
  const baseSubline = removeForbidden(baseAd?.subline || "");
  const baseBullets = (baseAd?.bullets || []).map((b) => removeForbidden(b)).filter(Boolean);
  const baseCta = removeForbidden(baseAd?.cta || "");

  if (lang === "es") {
    const strategy = getCountryStrategy(payload.country || "");
    const trust = strategy?.trustKeywords || ["claridad", "paso a paso", "aprendizaje simple"];
    const hookPool = multilingualHookLibrary.es[angle];
    const hook = hookPool[idx % hookPool.length].replace("{theme}", safeTheme);
    const ctas = strategy?.ctaStyle === "simple"
      ? ["Ver ejemplo simple", "Comenzar ahora", "Aprende cómo funciona"]
      : ["Aprende cómo funciona", "Ver ejemplo simple", "Comenzar ahora"];

    return {
      language: "Español",
      hook,
      subline: baseSubline || `Explicación ${style.toLowerCase()}, breve y confiable para lectura móvil.`,
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
      subline: baseSubline || `Mesaj ${style.toLowerCase()}, profesionist și ușor de parcurs pe mobil.`,
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
      subline: baseSubline || `以${style}风格解释核心逻辑，移动端阅读更清晰。`,
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
    subline: baseSubline || `A ${style.toLowerCase()} and trust-first explanation built for mobile reading.`,
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

  return new Array(5).fill(0).map((_, idx) => {
    const designTemplate = weightedPick(templateOrder, preferences?.designTemplate) as DesignTemplate;

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

    const adAngle = weightedAnglePick(angleWeights);
    const paletteKey = weightedPick(palettes.map((p) => p.key), preferences?.palette);
    const paletteEntry = palettes.find((p) => p.key === paletteKey) || palettes[idx % palettes.length];
    const preferredLayout = weightedPick(
      [paletteEntry.layoutStyle, ...palettes.map((p) => p.layoutStyle)],
      { ...(preferences?.layoutStyle || {}), ...(preferences?.structure || {}) }
    );

    return {
      id: `${Date.now()}-${idx}`,
      adAngle,
      designTemplate,
      paletteKey: paletteEntry.key,
      layoutStyle: preferredLayout,
      palette: paletteEntry.colors,
      copy: i18nCopy(lang, payload, adAngle, idx, baseAd)
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
    structure: variant.layoutStyle
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

  const nextMemory = [...memory, { country: metadata.country, angle: metadata.angle, hook: metadata.hook, designTemplate: metadata.designTemplate, type: feedback, createdAt: Date.now() }].slice(-300);

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

  if (variant.designTemplate === "bank-trust") return renderBankTrust(ctx, variant, payload);
  if (variant.designTemplate === "data-report") return renderDataReport(ctx, variant, payload);
  if (variant.designTemplate === "learning-steps") return renderLearningSteps(ctx, variant, payload);
  if (variant.designTemplate === "market-brief") return renderMarketBrief(ctx, variant, payload);
  return renderPremiumMinimal(ctx, variant, payload);
}

function renderBaseTexture(ctx: CanvasRenderingContext2D, variant: PosterVariant) {
  const grad = ctx.createLinearGradient(0, 0, 1254, 1254);
  grad.addColorStop(0, variant.palette.panel);
  grad.addColorStop(1, variant.palette.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1254, 1254);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let x = 0; x < 1254; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1254);
    ctx.stroke();
  }
}

function renderBankTrust(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 72, 80, 1110, 1090, 30, true, "rgba(9,26,41,0.70)");
  roundRect(ctx, 96, 108, 1060, 84, 14, true, "rgba(255,255,255,0.08)");
  text(ctx, `TRUST FRAMEWORK • ${variant.adAngle.toUpperCase()}`, 120, 162, "600 24px Inter, Arial", variant.palette.accent);

  textWrap(ctx, variant.copy.hook, 120, 270, 980, 72, "700 62px Inter, Arial", variant.palette.title);
  textWrap(ctx, variant.copy.subline, 120, 430, 980, 46, "400 34px Inter, Arial", variant.palette.body);

  variant.copy.bullets.forEach((line, i) => {
    roundRect(ctx, 110, 545 + i * 118, 1020, 88, 16, true, "rgba(255,255,255,0.06)");
    textWrap(ctx, line, 142, 602 + i * 118, 940, 38, "500 30px Inter, Arial", variant.palette.body);
  });

  roundRect(ctx, 120, 948, 420, 86, 14, true, variant.palette.accent);
  text(ctx, variant.copy.cta, 150, 1004, "700 33px Inter, Arial", "#08213a");
  footer(ctx, variant, payload);
}

function renderDataReport(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 70, 70, 1114, 1114, 28, true, "rgba(9,20,33,0.65)");

  text(ctx, "DATA REPORT FORMAT", 110, 130, "600 22px Inter, Arial", variant.palette.accent);
  roundRect(ctx, 104, 152, 320, 92, 14, true, "rgba(255,255,255,0.07)");
  roundRect(ctx, 444, 152, 320, 92, 14, true, "rgba(255,255,255,0.07)");
  roundRect(ctx, 784, 152, 320, 92, 14, true, "rgba(255,255,255,0.07)");
  text(ctx, "Insight", 128, 208, "600 28px Inter, Arial", variant.palette.title);
  text(ctx, "Clarity", 468, 208, "600 28px Inter, Arial", variant.palette.title);
  text(ctx, "Readability", 808, 208, "600 28px Inter, Arial", variant.palette.title);

  textWrap(ctx, variant.copy.hook, 110, 340, 1030, 66, "700 56px Inter, Arial", variant.palette.title);
  textWrap(ctx, variant.copy.subline, 110, 500, 1020, 44, "400 32px Inter, Arial", variant.palette.body);

  roundRect(ctx, 104, 620, 1060, 292, 18, true, "rgba(255,255,255,0.05)");
  variant.copy.bullets.forEach((line, i) => {
    textWrap(ctx, `• ${line}`, 132, 700 + i * 82, 980, 36, "500 29px Inter, Arial", variant.palette.body);
  });

  roundRect(ctx, 104, 948, 520, 84, 12, true, "rgba(146,196,235,0.88)");
  text(ctx, variant.copy.cta, 136, 1002, "700 32px Inter, Arial", "#0d2b44");
  footer(ctx, variant, payload);
}

function renderLearningSteps(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 72, 72, 1110, 1110, 34, true, "rgba(10,23,36,0.67)");

  textWrap(ctx, variant.copy.hook, 110, 220, 1020, 68, "700 58px Inter, Arial", variant.palette.title);
  textWrap(ctx, variant.copy.subline, 110, 380, 1020, 44, "400 31px Inter, Arial", variant.palette.body);

  variant.copy.bullets.forEach((line, i) => {
    const y = 500 + i * 150;
    roundRect(ctx, 126, y, 980, 122, 18, true, "rgba(255,255,255,0.06)");
    circle(ctx, 174, y + 61, 28, variant.palette.accent);
    text(ctx, `Step ${i + 1}`, 154, y + 69, "700 18px Inter, Arial", "#0f2b43");
    textWrap(ctx, line, 236, y + 72, 840, 34, "500 29px Inter, Arial", variant.palette.body);
  });

  roundRect(ctx, 126, 980, 470, 84, 14, true, variant.palette.accent);
  text(ctx, variant.copy.cta, 160, 1033, "700 32px Inter, Arial", "#0b2236");
  footer(ctx, variant, payload);
}

function renderMarketBrief(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  roundRect(ctx, 68, 68, 1118, 1118, 28, true, "rgba(8,20,32,0.70)");

  roundRect(ctx, 92, 92, 1070, 82, 14, true, "rgba(255,255,255,0.1)");
  text(ctx, "MARKET BRIEF", 120, 145, "700 28px Inter, Arial", variant.palette.title);
  roundRect(ctx, 930, 110, 200, 46, 12, true, "rgba(127,177,226,0.25)");
  text(ctx, variant.adAngle.toUpperCase(), 965, 141, "600 20px Inter, Arial", variant.palette.accent);

  roundRect(ctx, 92, 200, 1070, 260, 18, true, "rgba(255,255,255,0.05)");
  textWrap(ctx, variant.copy.hook, 120, 292, 1010, 62, "700 54px Inter, Arial", variant.palette.title);
  textWrap(ctx, variant.copy.subline, 120, 470, 1000, 42, "400 30px Inter, Arial", variant.palette.body);

  roundRect(ctx, 92, 560, 1070, 296, 18, true, "rgba(255,255,255,0.06)");
  variant.copy.bullets.forEach((line, i) => {
    textWrap(ctx, `• ${line}`, 124, 638 + i * 84, 980, 36, "500 29px Inter, Arial", variant.palette.body);
  });

  roundRect(ctx, 92, 922, 450, 92, 14, true, variant.palette.accent);
  text(ctx, variant.copy.cta, 128, 980, "700 32px Inter, Arial", "#08253d");
  footer(ctx, variant, payload);
}

function renderPremiumMinimal(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  renderBaseTexture(ctx, variant);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(86, 86, 1082, 1082);
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.lineWidth = 1;
  ctx.strokeRect(86, 86, 1082, 1082);

  text(ctx, "PREMIUM EDITION", 108, 134, "600 20px Inter, Arial", variant.palette.accent);
  textWrap(ctx, variant.copy.hook, 108, 290, 980, 78, "700 68px Inter, Arial", variant.palette.title);
  textWrap(ctx, variant.copy.subline, 108, 520, 980, 48, "400 33px Inter, Arial", variant.palette.body);

  variant.copy.bullets.forEach((line, i) => {
    textWrap(ctx, `— ${line}`, 108, 660 + i * 72, 980, 34, "500 28px Inter, Arial", variant.palette.body);
  });

  roundRect(ctx, 108, 952, 410, 86, 43, true, "rgba(255,255,255,0.92)");
  text(ctx, variant.copy.cta, 142, 1007, "700 30px Inter, Arial", "#0d2c46");
  footer(ctx, variant, payload);
}

function footer(ctx: CanvasRenderingContext2D, variant: PosterVariant, payload: FormData) {
  text(ctx, `${payload.country} · ${variant.copy.language} · ${variant.designTemplate}`, 108, 1114, "400 23px Inter, Arial", variant.palette.body);
  textWrap(ctx, variant.copy.disclaimer, 108, 1160, 1020, 28, "400 21px Inter, Arial", "rgba(255,255,255,0.86)");
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
