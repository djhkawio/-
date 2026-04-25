"use client";

import { useEffect, useMemo, useState } from "react";
import PosterCanvas from "@/components/PosterCanvas";
import {
  BaseAd,
  FormData,
  PosterMetadata,
  PosterVariant,
  PreferenceWeights,
  generateVariants,
  savePreference,
  toPosterMetadata
} from "@/lib/poster";
import {
  PERFORMANCE_DATA_KEY,
  PerformanceRow,
  applyPerformanceToWeights,
  parsePerformanceCsv,
  recommendNextRound
} from "@/lib/performanceLearning";

const initialForm: FormData = {
  country: "China",
  theme: "Retirement Planning Basics",
  age: "30-50",
  style: "Steady Professional",
  quantity: 5
};

type PreferenceMemory = {
  type: "like" | "reject";
  metadata: PosterMetadata;
  createdAt: number;
};

const WEIGHTS_KEY = "poster.preference.weights.v1";
const MEMORY_KEY = "poster.preference.memory.v1";

function emptyWeights(): PreferenceWeights {
  return {
    designTemplate: {},
    angle: {},
    palette: {},
    layoutStyle: {},
    structure: {}
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const str = String(reader.result || "");
      resolve(str.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState<FormData>(initialForm);
  const [weights, setWeights] = useState<PreferenceWeights>(emptyWeights);
  const [memory, setMemory] = useState<PreferenceMemory[]>([]);
  const [baseAd, setBaseAd] = useState<BaseAd | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [performanceRows, setPerformanceRows] = useState<PerformanceRow[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendHints, setTrendHints] = useState<string[]>([]);

  useEffect(() => {
    try {
      const rawWeights = localStorage.getItem(WEIGHTS_KEY);
      const rawMemory = localStorage.getItem(MEMORY_KEY);
      const rawPerf = localStorage.getItem(PERFORMANCE_DATA_KEY);
      if (rawWeights) setWeights(JSON.parse(rawWeights));
      if (rawMemory) setMemory(JSON.parse(rawMemory));
      if (rawPerf) setPerformanceRows(JSON.parse(rawPerf));
    } catch {
      setWeights(emptyWeights());
      setMemory([]);
      setPerformanceRows([]);
    }
  }, []);

  const variants = useMemo(() => generateVariants(submitted, baseAd), [submitted, weights, baseAd]);

  const recommendation = useMemo(
    () => recommendNextRound(form.country, performanceRows, weights),
    [form.country, performanceRows, weights]
  );

  const persist = (nextWeights: PreferenceWeights, nextMemory: PreferenceMemory[]) => {
    setWeights(nextWeights);
    setMemory(nextMemory);
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(nextWeights));
    localStorage.setItem(MEMORY_KEY, JSON.stringify(nextMemory.slice(-300)));
  };

  const handleFeedback = (type: "like" | "reject", variant: PosterVariant) => {
    const metadata = toPosterMetadata(submitted, variant);
    const result = savePreference(type, metadata);

    const nextMemory = [
      ...memory,
      {
        type,
        metadata,
        createdAt: Date.now()
      }
    ];

    if (result) {
      persist(result.weights, nextMemory);
    }
  };

  const handleAnalyzeAndGenerate = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    try {
      const imageBase64 = await fileToBase64(imageFile);
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: imageFile.type, country: form.country })
      });

      const data = await res.json();
      if (data?.result) setBaseAd(data.result as BaseAd);
      setSubmitted({ ...form, quantity: 5 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvFile) return;
    const text = await csvFile.text();
    const rows = parsePerformanceCsv(text);
    const nextRows = [...performanceRows, ...rows];
    setPerformanceRows(nextRows);
    localStorage.setItem(PERFORMANCE_DATA_KEY, JSON.stringify(nextRows));

    const nextWeights = applyPerformanceToWeights(rows, weights);
    setWeights(nextWeights);
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(nextWeights));
  };

  const scanTrends = async () => {
    const res = await fetch("/api/trend-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: form.country, theme: form.theme })
    });
    const data = await res.json();
    setTrendHints(data.trendHints || []);
  };

  const dashboard = useMemo(() => {
    const likes = memory.filter((m) => m.type === "like");
    const rejects = memory.filter((m) => m.type === "reject");

    const countBy = (items: PreferenceMemory[], key: keyof PosterMetadata) => {
      const map = new Map<string, number>();
      items.forEach((item) => {
        const val = String(item.metadata[key]);
        map.set(val, (map.get(val) ?? 0) + 1);
      });
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      topTemplate: countBy(likes, "designTemplate")[0],
      topAngle: countBy(likes, "angle")[0],
      topRejectedTemplate: countBy(rejects, "designTemplate")[0]
    };
  }, [memory]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-brand-900 md:text-3xl">自动广告海报生成工具（MVP）</h1>
      <p className="mt-2 text-sm text-slate-600">
        模板渲染模式 · 固定 1254×1254 · 默认一次生成 5 个版本 · 无真人照片、无收益保证语句。
      </p>

      <section className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <form
            className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setBaseAd(undefined);
              setSubmitted({ ...form, quantity: 5 });
            }}
          >
            <Field label="国家">
              <input className="input" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
            </Field>
            <Field label="广告主题">
              <input className="input" value={form.theme} onChange={(e) => setForm((p) => ({ ...p, theme: e.target.value }))} />
            </Field>
            <Field label="目标年龄">
              <input className="input" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
            </Field>
            <Field label="广告风格">
              <input className="input" value={form.style} onChange={(e) => setForm((p) => ({ ...p, style: e.target.value }))} />
            </Field>
            <Field label="参考图（Creative Remix）">
              <input className="input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </Field>
            <Field label="导入表现CSV">
              <input className="input" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            </Field>

            <div className="space-y-2">
              <button type="submit" className="w-full rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-900">
                生成 5 个海报版本
              </button>
              <button type="button" disabled={!imageFile || isAnalyzing} onClick={handleAnalyzeAndGenerate} className="w-full rounded-md bg-slate-800 px-4 py-2 font-medium text-white disabled:opacity-50">
                {isAnalyzing ? "分析中..." : "生成本地化版本（Creative Remix）"}
              </button>
              <button type="button" disabled={!csvFile} onClick={handleImportCsv} className="w-full rounded-md bg-indigo-700 px-4 py-2 font-medium text-white disabled:opacity-50">
                导入CSV并更新权重
              </button>
              <button type="button" onClick={scanTrends} className="w-full rounded-md bg-emerald-700 px-4 py-2 font-medium text-white">
                扫描公开趋势（参考）
              </button>
            </div>
          </form>

          <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">Next Round Recommendation</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>推荐结构：{recommendation.recommendedStructure}</li>
              <li>推荐设计模板：{recommendation.recommendedTemplate}</li>
              <li>推荐Hook类型：{recommendation.recommendedHookType}</li>
              <li>下一轮建议生成数量：{recommendation.suggestedNextCount}</li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">Public Trend Scanner（参考）</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
              {trendHints.length ? trendHints.map((hint, i) => <li key={`${hint}-${i}`}>{hint}</li>) : <li>暂无趋势数据</li>}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">Preference Dashboard</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>最受欢迎模板：{dashboard.topTemplate ? `${dashboard.topTemplate[0]} (${dashboard.topTemplate[1]})` : "暂无"}</li>
              <li>最受欢迎角度：{dashboard.topAngle ? `${dashboard.topAngle[0]} (${dashboard.topAngle[1]})` : "暂无"}</li>
              <li>最常被 Reject 模板：{dashboard.topRejectedTemplate ? `${dashboard.topRejectedTemplate[0]} (${dashboard.topRejectedTemplate[1]})` : "暂无"}</li>
            </ul>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">当前系统偏好权重</p>
              <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(weights, null, 2)}</pre>
            </div>
          </section>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {variants.map((variant, idx) => (
            <PosterCanvas
              key={variant.id}
              variant={variant}
              payload={submitted}
              index={idx}
              onLike={(v) => handleFeedback("like", v)}
              onReject={(v) => handleFeedback("reject", v)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
