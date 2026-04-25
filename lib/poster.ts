export type FormData = {
  country: string;
  theme: string;
  age: string;
  style: string;
  quantity: number;
};

export type PosterCopy = {
  language: string;
  headline: string;
  subline: string;
  bullets: string[];
  cta: string;
  disclaimer: string;
};

export type PosterVariant = {
  id: string;
  palette: {
    bg: string;
    panel: string;
    title: string;
    body: string;
    accent: string;
  };
  copy: PosterCopy;
};

type LocaleCode = "en" | "zh" | "ja" | "fr" | "de" | "es" | "pt" | "ro" | "it" | "pl";

const defaultDisclaimer =
  "Educational content only. Not financial advice. Results are not guaranteed.";

const forbidden = [
  /guaranteed return/gi,
  /download\s*pdf/gi,
  /portfolio manager/gi,
  /cfa/gi,
  /specific investment company/gi
];

const localeRules: Array<{ lang: LocaleCode; aliases: string[] }> = [
  { lang: "zh", aliases: ["china", "chinese", "中国", "中华人民共和国"] },
  { lang: "ja", aliases: ["japan", "日本"] },
  { lang: "fr", aliases: ["france", "french", "法国"] },
  { lang: "de", aliases: ["germany", "deutschland", "德国"] },
  { lang: "es", aliases: ["spain", "españa", "espanol", "西班牙"] },
  { lang: "pt", aliases: ["brazil", "brasil", "brazilian", "portugal", "portuguese", "巴西", "葡萄牙"] },
  { lang: "ro", aliases: ["romania", "romanian", "românia", "罗马尼亚"] },
  { lang: "it", aliases: ["italy", "italian", "italia", "意大利"] },
  { lang: "pl", aliases: ["poland", "polish", "polska", "波兰"] },
  { lang: "en", aliases: ["united states", "usa", "us", "america", "uk", "united kingdom"] }
];

function sanitizeTheme(input: string) {
  return input.trim().replace(/download\s*pdf/gi, "resources");
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

function i18nCopy(lang: LocaleCode, payload: FormData, idx: number): PosterCopy {
  const safeTheme = removeForbidden(sanitizeTheme(payload.theme || "Financial literacy")) || "Financial literacy";
  const age = payload.age || "25-45";
  const style = removeForbidden(payload.style || "Professional") || "Professional";

  if (lang === "zh") {
    return {
      language: "中文",
      headline: `${safeTheme}｜适合${age}人群`,
      subline: `以${style}风格呈现，突出稳重与信任感。`,
      bullets: [
        `版本 ${idx + 1}：1254×1254 移动端优先排版`,
        "信息层级清晰，重点一眼可读",
        "仅作教育内容，不涉及收益承诺"
      ],
      cta: "查看核心要点",
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "ja") {
    return {
      language: "日本語",
      headline: `${safeTheme}｜${age}向けの基礎ガイド`,
      subline: `${style}なトーンで、落ち着いた信頼感を重視。`,
      bullets: [
        `バージョン ${idx + 1}: 1254×1254 モバイル最適化`,
        "重要情報を短く明確に整理",
        "教育目的のみで、成果保証は行いません"
      ],
      cta: "重要ポイントを見る",
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "fr") {
    return {
      language: "Français",
      headline: `${safeTheme} pour les ${age}`,
      subline: `Présentation ${style.toLowerCase()}, sobre et crédible pour mobile.`,
      bullets: [
        `Version ${idx + 1} : format 1254×1254 prioritaire mobile`,
        "Hiérarchie visuelle claire et professionnelle",
        "Contenu éducatif sans promesse de résultat"
      ],
      cta: "Voir les points clés",
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "de") {
    return {
      language: "Deutsch",
      headline: `${safeTheme} für ${age}`,
      subline: `${style}er Stil mit seriöser, vertrauensvoller Darstellung.`,
      bullets: [
        `Version ${idx + 1}: 1254×1254, mobile-first`,
        "Klare Struktur mit professioneller Tonalität",
        "Nur Bildungsinhalt, ohne Ergebnisversprechen"
      ],
      cta: "Kernaussagen ansehen",
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "es") {
    return {
      language: "Español",
      headline: `${safeTheme} para edades ${age}`,
      subline: `Diseño ${style.toLowerCase()}, sólido y confiable para móvil.`,
      bullets: [
        `Versión ${idx + 1}: formato 1254×1254 mobile-first`,
        "Mensaje claro con jerarquía visual estable",
        "Contenido educativo sin promesas de rentabilidad"
      ],
      cta: "Ver puntos clave",
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "pt") {
    return {
      language: "Português",
      headline: `${safeTheme} para faixa ${age}`,
      subline: `Visual ${style.toLowerCase()} com tom profissional e confiável.`,
      bullets: [
        `Versão ${idx + 1}: layout 1254×1254 com foco mobile`,
        "Leitura rápida com estrutura conservadora",
        "Conteúdo educacional, sem promessa de retorno"
      ],
      cta: "Ver pontos principais",
      disclaimer: defaultDisclaimer
    };
  }


  if (lang === "ro") {
    return {
      language: "Română",
      headline: `${safeTheme} pentru vârste ${age}`,
      subline: `Mesaj ${style.toLowerCase()}, clar și credibil, optimizat pentru mobil.`,
      bullets: [
        `Versiunea ${idx + 1}: format 1254×1254, mobile-first`,
        "Informații esențiale prezentate într-o structură profesionistă",
        "Conținut educațional, fără promisiuni de câștig"
      ],
      cta: "Vezi punctele cheie",
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "it") {
    return {
      language: "Italiano",
      headline: `${safeTheme} per età ${age}`,
      subline: `Comunicazione ${style.toLowerCase()}, professionale e affidabile per mobile.`,
      bullets: [
        `Versione ${idx + 1}: formato 1254×1254 mobile-first`,
        "Messaggi chiari con gerarchia visiva ordinata",
        "Contenuto educativo, senza promesse di rendimento"
      ],
      cta: "Scopri i punti chiave",
      disclaimer: defaultDisclaimer
    };
  }

  if (lang === "pl") {
    return {
      language: "Polski",
      headline: `${safeTheme} dla grupy ${age}`,
      subline: `Styl ${style.toLowerCase()}, rzeczowy i budujący zaufanie na mobile.`,
      bullets: [
        `Wersja ${idx + 1}: format 1254×1254, podejście mobile-first`,
        "Przejrzysty układ i profesjonalny ton",
        "Treść edukacyjna bez obietnic zysku"
      ],
      cta: "Zobacz kluczowe informacje",
      disclaimer: defaultDisclaimer
    };
  }

  return {
    language: "English",
    headline: `${safeTheme} for ages ${age}`,
    subline: `A ${style.toLowerCase()} mobile-first visual with credible tone.`,
    bullets: [
      `Version ${idx + 1}: 1254x1254 banking-style layout`,
      "Clear hierarchy with conservative color system",
      "Educational framing without performance promises"
    ],
    cta: "Explore key insights",
    disclaimer: defaultDisclaimer
  };
}

const palettes = [
  { bg: "#0B1E31", panel: "#17324A", title: "#F8FBFF", body: "#C8D7E6", accent: "#7BB4E8" },
  { bg: "#102437", panel: "#1C3B55", title: "#F4F8FC", body: "#C4D2DE", accent: "#8EC0ED" },
  { bg: "#112A3A", panel: "#1D465E", title: "#F7FBFD", body: "#C4D8E4", accent: "#97CBE8" },
  { bg: "#18263C", panel: "#233A5A", title: "#F8FAFF", body: "#CAD4E2", accent: "#7BA6DF" },
  { bg: "#15263A", panel: "#264764", title: "#F5F9FF", body: "#CAD8E8", accent: "#89BCE9" }
];

export function buildVariants(payload: FormData): PosterVariant[] {
  const lang = detectLocale(payload.country || "");
  return new Array(5).fill(0).map((_, idx) => ({
    id: `${Date.now()}-${idx}`,
    palette: palettes[idx % palettes.length],
    copy: i18nCopy(lang, payload, idx)
  }));
}

export function drawPoster(canvas: HTMLCanvasElement, variant: PosterVariant, payload: FormData) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 1254;
  canvas.height = 1254;

  ctx.fillStyle = variant.palette.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 1254, 1254);
  grad.addColorStop(0, variant.palette.panel);
  grad.addColorStop(1, variant.palette.bg);
  ctx.fillStyle = grad;
  roundRect(ctx, 72, 96, 1110, 1000, 28, true);

  ctx.fillStyle = variant.palette.accent;
  ctx.fillRect(72, 96, 14, 1000);

  ctx.fillStyle = variant.palette.title;
  ctx.font = "700 58px Inter, Arial";
  wrapText(ctx, variant.copy.headline, 120, 220, 980, 74);

  ctx.fillStyle = variant.palette.body;
  ctx.font = "400 34px Inter, Arial";
  wrapText(ctx, variant.copy.subline, 120, 380, 950, 48);

  ctx.font = "500 31px Inter, Arial";
  variant.copy.bullets.forEach((line, bulletIndex) => {
    ctx.fillStyle = variant.palette.accent;
    ctx.beginPath();
    ctx.arc(136, 500 + bulletIndex * 82, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = variant.palette.body;
    wrapText(ctx, line, 160, 510 + bulletIndex * 82, 900, 40);
  });

  ctx.fillStyle = variant.palette.title;
  ctx.font = "600 36px Inter, Arial";
  ctx.fillText(variant.copy.cta, 120, 830);

  ctx.fillStyle = variant.palette.body;
  ctx.font = "400 26px Inter, Arial";
  ctx.fillText(`${payload.country} · ${payload.style} · ${variant.copy.language}`, 120, 890);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "400 22px Inter, Arial";
  wrapText(ctx, variant.copy.disclaimer, 120, 1040, 1020, 30);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean
) {
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
