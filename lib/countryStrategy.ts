import type { AdAngle } from "@/lib/poster";

export type CountryStrategy = {
  country: string;
  angleWeights: Record<AdAngle, number>;
  trustKeywords: string[];
  ctaStyle: "guided" | "simple";
};

export const countryStrategies: Record<string, CountryStrategy> = {
  argentina: {
    country: "Argentina",
    angleWeights: {
      question: 1.25,
      beginner: 1.35,
      curiosity: 1.1,
      mistake: 1.2,
      opportunity: 0.95
    },
    trustKeywords: ["claridad", "paso a paso", "enfoque educativo"],
    ctaStyle: "simple"
  },
  romania: {
    country: "Romania",
    angleWeights: {
      question: 1.15,
      beginner: 1.4,
      curiosity: 1.05,
      mistake: 1.2,
      opportunity: 1.0
    },
    trustKeywords: ["clar", "structurat", "fără promisiuni"],
    ctaStyle: "guided"
  }
};

export const multilingualHookLibrary: Record<"es" | "ro", Record<AdAngle, string[]>> = {
  es: {
    question: [
      "¿Sabes cuál es la forma más clara de empezar con {theme}?",
      "¿Qué cambia cuando entiendes {theme} paso a paso?"
    ],
    beginner: [
      "{theme}: guía de inicio para avanzar con confianza",
      "Comienza con {theme} de forma simple y práctica"
    ],
    curiosity: [
      "El detalle de {theme} que casi nadie explica bien",
      "¿Qué parte de {theme} suele pasar desapercibida?"
    ],
    mistake: [
      "Error común en {theme}: saltar la base",
      "Muchos fallan en {theme} por este paso omitido"
    ],
    opportunity: [
      "Una oportunidad real para aprender {theme} con calma",
      "Transforma tu base de {theme} con un enfoque claro"
    ]
  },
  ro: {
    question: [
      "Știi care este cel mai clar mod de a începe cu {theme}?",
      "Ce se schimbă când înțelegi {theme} pas cu pas?"
    ],
    beginner: [
      "{theme}: ghid de început pentru încredere",
      "Începe {theme} simplu, clar și practic"
    ],
    curiosity: [
      "Detaliul din {theme} pe care mulți îl ignoră",
      "Ce parte din {theme} este cel mai des omisă?"
    ],
    mistake: [
      "Greșeală frecventă în {theme}: se sar bazele",
      "Acest pas omis creează confuzie în {theme}"
    ],
    opportunity: [
      "Oportunitate practică de a învăța {theme} corect",
      "Construiește o bază solidă în {theme}, fără grabă"
    ]
  }
};

export function getCountryStrategy(countryInput: string): CountryStrategy | null {
  const normalized = countryInput.trim().toLowerCase();
  if (normalized.includes("argentina")) return countryStrategies.argentina;
  if (normalized.includes("romania") || normalized.includes("românia")) return countryStrategies.romania;
  return null;
}

export function weightedAnglePick(weights: Record<AdAngle, number>): AdAngle {
  const entries = Object.entries(weights) as Array<[AdAngle, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(weight, 0.01), 0);
  let random = Math.random() * total;

  for (const [angle, weight] of entries) {
    random -= Math.max(weight, 0.01);
    if (random <= 0) return angle;
  }

  return entries[0][0];
}
