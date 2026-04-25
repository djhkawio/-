import { FormData } from "@/lib/poster";

export const userProfile = {
  defaultCountry: "Argentina",
  defaultLanguage: "Argentinian Spanish",
  targetAgeRange: "38-65",
  primaryGoal: "landing_page_lead_generation",
  tone: "trust_first",
  stylePreference: ["institutional", "premium_minimal", "mobile_first", "clean_financial_education"],
  avoid: [
    "realistic_person_photo",
    "dark_saas_dashboard",
    "tiny_text",
    "profit_claims",
    "specific_investment_firms",
    "cfa",
    "portfolio_manager",
    "download_cta"
  ],
  required: {
    size: "1254x1254",
    disclaimer: "Educational content only. Not financial advice. Results are not guaranteed."
  }
} as const;

export function getProfileDefaultForm(): FormData {
  return {
    country: userProfile.defaultCountry,
    theme: "Educación financiera para empezar con claridad",
    age: userProfile.targetAgeRange,
    style: "Institutional Premium Minimal",
    goal: userProfile.primaryGoal,
    quantity: 5
  };
}
