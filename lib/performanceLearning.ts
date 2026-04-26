import { PreferenceWeights } from "@/lib/poster";

export type PerformanceRow = {
  country: string;
  creativeId: string;
  structure: string;
  designTemplate: string;
  angle: string;
  ctr: number;
  cpc: number;
  cpl: number;
  leads: number;
  spend: number;
  palette?: string;
};

export const PERFORMANCE_DATA_KEY = "poster.performance.data.v1";

export function parsePerformanceCsv(csvText: string): PerformanceRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      country: cols[idx("country")] || "",
      creativeId: cols[idx("creativeId")] || "",
      structure: cols[idx("structure")] || "",
      designTemplate: cols[idx("designTemplate")] || "",
      angle: cols[idx("angle")] || "",
      ctr: Number(cols[idx("ctr")] || 0),
      cpc: Number(cols[idx("cpc")] || 0),
      cpl: Number(cols[idx("cpl")] || 0),
      leads: Number(cols[idx("leads")] || 0),
      spend: Number(cols[idx("spend")] || 0),
      palette: cols[idx("palette")] || ""
    };
  });
}

export function scoreRow(row: PerformanceRow): number {
  const ctrScore = row.ctr * 120;
  const leadsScore = row.leads * 2.5;
  const cplScore = 180 / (row.cpl + 1);
  const cpcScore = 30 / (row.cpc + 1);
  const spendPenalty = row.spend * 0.04;
  return ctrScore + leadsScore + cplScore + cpcScore - spendPenalty;
}

function bump(bucket: Record<string, number>, key: string, delta: number): Record<string, number> {
  if (!key) return bucket;
  return { ...bucket, [key]: Math.max(-12, Math.min(36, (bucket[key] ?? 0) + delta)) };
}

export function applyPerformanceToWeights(rows: PerformanceRow[], current: PreferenceWeights): PreferenceWeights {
  let next: PreferenceWeights = {
    designTemplate: { ...(current.designTemplate || {}) },
    angle: { ...(current.angle || {}) },
    palette: { ...(current.palette || {}) },
    layoutStyle: { ...(current.layoutStyle || {}) },
    structure: { ...(current.structure || {}) }
  };

  rows.forEach((row) => {
    const delta = Math.max(-3, Math.min(6, scoreRow(row) / 50));
    next = {
      ...next,
      designTemplate: bump(next.designTemplate, row.designTemplate, delta),
      angle: bump(next.angle, row.angle, delta),
      palette: bump(next.palette, row.palette || "", delta * 0.7),
      layoutStyle: bump(next.layoutStyle, row.structure, delta),
      structure: bump(next.structure, row.structure, delta)
    };
  });

  return next;
}

export function recommendNextRound(country: string, rows: PerformanceRow[], weights: PreferenceWeights) {
  const scoped = rows.filter((r) => r.country.toLowerCase().includes(country.toLowerCase()));

  const topBy = (items: PerformanceRow[], key: keyof PerformanceRow) => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const name = String(item[key] || "");
      if (!name) return;
      map.set(name, (map.get(name) ?? 0) + scoreRow(item));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  };

  const recommendedStructure = topBy(scoped, "structure") || topWeight(weights.structure);
  const recommendedTemplate = topBy(scoped, "designTemplate") || topWeight(weights.designTemplate);
  const recommendedHookType = topBy(scoped, "angle") || topWeight(weights.angle);

  return {
    recommendedStructure,
    recommendedTemplate,
    recommendedHookType,
    suggestedNextCount: scoped.length > 20 ? 8 : 5
  };
}

function topWeight(bucket: Record<string, number> | undefined): string {
  if (!bucket) return "N/A";
  const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || "N/A";
}
