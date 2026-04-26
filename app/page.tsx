"use client";

import { useEffect, useMemo, useState } from "react";
import PosterCanvas from "@/components/PosterCanvas";
import {
  BaseAd,
  CreativeConcept,
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
import { getProfileDefaultForm, userProfile } from "@/lib/userProfile";
import { BatchCreativeItem, MarketStrategy, ParsedInput, ReferenceAnalysis } from "@/lib/creativeOS";

const initialForm: FormData = getProfileDefaultForm();

type PreferenceMemory = {
  type: "like" | "reject";
  metadata: PosterMetadata;
  createdAt: number;
};

const WEIGHTS_KEY = "poster.preference.weights.v1";
const MEMORY_KEY = "poster.preference.memory.v1";
const FEEDBACK_PATTERN_KEY = "creative.os.feedback.pattern.v1";

type FeedbackPattern = {
  country: string;
  language: string;
  topic: string;
  campaign_goal: string;
  headline: string;
  layout_style: string;
  color_style: string;
  design_direction: string;
  score: number;
  feedback_type: "like" | "dislike" | "winner" | "rejected";
  user_note: string;
  created_at: string;
  prompt: string;
  negative_prompt: string;
  winning_art_direction?: string;
  winning_layout?: string;
  winning_copy_style?: string;
  rejected_visual_pattern?: string;
};

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
  const [apiConcepts, setApiConcepts] = useState<CreativeConcept[]>([]);
  const [language, setLanguage] = useState("es-AR");
  const [platform, setPlatform] = useState("Meta");
  const [conversionPath, setConversionPath] = useState("form");
  const [riskLevel, setRiskLevel] = useState("balanced");
  const [userNotes, setUserNotes] = useState("");
  const [referenceSummary, setReferenceSummary] = useState<ReferenceAnalysis | null>(null);
  const [parsedInput, setParsedInput] = useState<ParsedInput | null>(null);
  const [marketStrategy, setMarketStrategy] = useState<MarketStrategy | null>(null);
  const [creativeBatch, setCreativeBatch] = useState<BatchCreativeItem[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<FeedbackPattern[]>([]);

  useEffect(() => {
    try {
      const rawWeights = localStorage.getItem(WEIGHTS_KEY);
      const rawMemory = localStorage.getItem(MEMORY_KEY);
      const rawPerf = localStorage.getItem(PERFORMANCE_DATA_KEY);
      const rawPatterns = localStorage.getItem(FEEDBACK_PATTERN_KEY);
      if (rawWeights) setWeights(JSON.parse(rawWeights));
      if (rawMemory) setMemory(JSON.parse(rawMemory));
      if (rawPerf) setPerformanceRows(JSON.parse(rawPerf));
      if (rawPatterns) setPatterns(JSON.parse(rawPatterns));
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


  const generateFromApi = async (payloadForApi: FormData, remixBase?: BaseAd) => {
    const res = await fetch("/api/generate-concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: payloadForApi, baseAd: remixBase })
    });
    const data = await res.json();
    if (Array.isArray(data?.concepts)) {
      setApiConcepts(data.concepts as CreativeConcept[]);
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
      if (data?.result) {
        const remix = data.result as BaseAd;
        setBaseAd(remix);
        if (data?.reference_analysis) setReferenceSummary(data.reference_analysis as ReferenceAnalysis);
        await generateFromApi({ ...form, quantity: 5 }, remix);
      }
      setSubmitted({ ...form, quantity: 5 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runCreativeOS = async () => {
    const imageBase64 = imageFile ? await fileToBase64(imageFile) : undefined;
    const res = await fetch("/api/creative-os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: form.country,
        language,
        topic: form.theme,
        target_age: form.age,
        ad_objective: form.goal,
        reference_image: imageBase64,
        platform,
        conversion_path: conversionPath,
        risk_level: riskLevel,
        user_notes: userNotes,
        feedback_patterns: patterns.map((p) => ({
          type: p.feedback_type === "winner" || p.feedback_type === "like" ? "winner" : "rejected",
          layout_style: p.layout_style,
          headline_style: p.headline,
          avoid_next_time: p.user_note
        }))
      })
    });
    const data = await res.json();
    setParsedInput(data.parsed_input ?? null);
    setMarketStrategy(data.market_strategy ?? null);
    setCreativeBatch(data.creatives ?? []);
    setRecommendedIds(data.recommended_ids ?? []);
  };

  const saveCreativeFeedback = (type: FeedbackPattern["feedback_type"], item: BatchCreativeItem) => {
    const note = window.prompt("Optional note for this feedback") || "";
    const entry: FeedbackPattern = {
      country: form.country,
      language,
      topic: form.theme,
      campaign_goal: form.goal,
      headline: item.copy_version.headline,
      layout_style: item.design_prompt.design_version,
      color_style: "restrained institutional",
      design_direction: item.design_prompt.design_direction,
      score: item.quality_score.overall_score,
      feedback_type: type,
      user_note: note,
      created_at: new Date().toISOString(),
      prompt: item.design_prompt.prompt,
      negative_prompt: item.design_prompt.negative_prompt,
      winning_art_direction: type === "winner" || type === "like" ? item.art_direction : undefined,
      winning_layout: type === "winner" || type === "like" ? item.layout_type : undefined,
      winning_copy_style: type === "winner" || type === "like" ? item.copy_version.type : undefined,
      rejected_visual_pattern: type === "rejected" || type === "dislike" ? item.art_direction : undefined
    };
    const next = [...patterns, entry].slice(-400);
    setPatterns(next);
    localStorage.setItem(FEEDBACK_PATTERN_KEY, JSON.stringify(next));
  };

  const scopedPatterns = useMemo(() => patterns.filter((p) => p.country === form.country && p.topic === form.theme), [patterns, form.country, form.theme]);
  const winningPatterns = scopedPatterns.filter((p) => p.feedback_type === "winner" || p.feedback_type === "like");
  const rejectedPatterns = scopedPatterns.filter((p) => p.feedback_type === "rejected" || p.feedback_type === "dislike");

  const exportCreativePng = (item: BatchCreativeItem) => {
    if (!item.generated_image_result) return;
    const link = document.createElement("a");
    link.href = item.generated_image_result;
    link.download = `creative-${item.id}.png`;
    link.click();
  };

  const generateImageForCard = async (item: BatchCreativeItem) => {
    const res = await fetch("/api/generate-final-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: item.design_prompt.text_overlay.headline,
        subheadline: item.design_prompt.text_overlay.subheadline,
        trustReason: item.design_prompt.text_overlay.trust_reason,
        cta: item.design_prompt.text_overlay.cta,
        disclaimer: item.design_prompt.text_overlay.disclaimer,
        artDirection: item.art_direction,
        country: form.country,
        language,
        topic: form.theme
      })
    });
    const data = await res.json();
    const resolvedImage = data?.imageUrl || data?.image_url || (data?.imageBase64 ? `data:image/png;base64,${data.imageBase64}` : null);
    if (resolvedImage) {
      setCreativeBatch((prev) => prev.map((v) => (v.id === item.id ? { ...v, generated_image_result: resolvedImage } : v)));
    }
  };

  const regenerateCopyForCard = async () => {
    await runCreativeOS();
  };

  const regeneratePromptForCard = async () => {
    await runCreativeOS();
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
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">自动广告海报生成工具（MVP）</h1>
      <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-600">
        模板渲染模式 · 固定 1254×1254 · 默认一次生成 5 个版本 · 无真人照片、无收益保证语句。
        当前默认画像：{userProfile.defaultCountry} / {userProfile.targetAgeRange} / {userProfile.primaryGoal}
      </p>

      <section className="mt-10 grid gap-10 lg:grid-cols-[340px_1fr]">
        <div className="space-y-8">
          <form
            className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            onSubmit={(e) => {
              e.preventDefault();
              setBaseAd(undefined);
              setSubmitted({ ...form, quantity: 5 });
              void runCreativeOS();
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
            <Field label="Campaign Goal">
              <input className="input" value={form.goal} onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))} />
            </Field>
            <Field label="Language">
              <input className="input" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </Field>
            <Field label="Platform">
              <input className="input" value={platform} onChange={(e) => setPlatform(e.target.value)} />
            </Field>
            <Field label="Conversion Path">
              <input className="input" value={conversionPath} onChange={(e) => setConversionPath(e.target.value)} />
            </Field>
            <Field label="Risk Level">
              <select className="input" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                <option value="conservative">conservative</option>
                <option value="balanced">balanced</option>
                <option value="aggressive">aggressive</option>
              </select>
            </Field>
            <Field label="User Notes">
              <textarea className="input min-h-20" value={userNotes} onChange={(e) => setUserNotes(e.target.value)} />
            </Field>
            <Field label="参考图（Creative Remix）">
              <input className="input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </Field>
            <Field label="导入表现CSV">
              <input className="input" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            </Field>

            <div className="space-y-2">
              <button type="submit" className="w-full rounded-full bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700">
                生成 5 个海报版本
              </button>
              <button type="button" disabled={!imageFile || isAnalyzing} onClick={handleAnalyzeAndGenerate} className="w-full rounded-full bg-slate-700 px-4 py-2.5 font-medium text-white disabled:opacity-50">
                {isAnalyzing ? "分析中..." : "生成本地化版本（Creative Remix）"}
              </button>
              <button type="button" disabled={!csvFile} onClick={handleImportCsv} className="w-full rounded-full bg-indigo-700 px-4 py-2.5 font-medium text-white disabled:opacity-50">
                导入CSV并更新权重
              </button>
              <button type="button" onClick={scanTrends} className="w-full rounded-full bg-emerald-700 px-4 py-2.5 font-medium text-white">
                扫描公开趋势（参考）
              </button>
              <button type="button" onClick={runCreativeOS} className="w-full rounded-full bg-amber-600 px-4 py-2.5 font-medium text-white">
                运行 Creative OS（5 文案+5 Prompt+5图+评分）
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <h2 className="text-base font-semibold text-slate-900">Next Round Recommendation</h2>
            <ul className="mt-3 space-y-1 text-sm leading-relaxed text-slate-600">
              <li>推荐结构：{recommendation.recommendedStructure}</li>
              <li>推荐设计模板：{recommendation.recommendedTemplate}</li>
              <li>推荐Hook类型：{recommendation.recommendedHookType}</li>
              <li>下一轮建议生成数量：{recommendation.suggestedNextCount}</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <h2 className="text-base font-semibold text-slate-900">Public Trend Scanner（参考）</h2>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-600">
              {trendHints.length ? trendHints.map((hint, i) => <li key={`${hint}-${i}`}>{hint}</li>) : <li>暂无趋势数据</li>}
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <h2 className="text-base font-semibold text-slate-900">Preference Dashboard</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>最受欢迎模板：{dashboard.topTemplate ? `${dashboard.topTemplate[0]} (${dashboard.topTemplate[1]})` : "暂无"}</li>
              <li>最受欢迎角度：{dashboard.topAngle ? `${dashboard.topAngle[0]} (${dashboard.topAngle[1]})` : "暂无"}</li>
              <li>最常被 Reject 模板：{dashboard.topRejectedTemplate ? `${dashboard.topRejectedTemplate[0]} (${dashboard.topRejectedTemplate[1]})` : "暂无"}</li>
            </ul>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">当前系统偏好权重</p>
              <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(weights, null, 2)}</pre>
            </div>
            <p className="mt-3 text-xs text-slate-500">Creative OS patterns saved: {patterns.length}</p>
          </section>
        </div>


        <div className="grid gap-6 sm:grid-cols-2">
          {apiConcepts.length > 0 && (
            <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
              <p className="text-base font-semibold text-slate-900">Generated Concept Directions</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {apiConcepts.slice(0, 5).map((concept, idx) => (
                  <li key={`${concept.concept_name}-${idx}`}>{idx + 1}. {concept.concept_name} · {concept.hook_angle}</li>
                ))}
              </ul>
            </div>
          )}

          {parsedInput && (
            <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
              <p className="text-base font-semibold text-slate-900">Input Parser Output</p>
              <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{JSON.stringify(parsedInput, null, 2)}</pre>
            </div>
          )}

          {marketStrategy && (
            <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
              <p className="text-base font-semibold text-slate-900">Market Creative Strategist</p>
              <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{JSON.stringify(marketStrategy, null, 2)}</pre>
            </div>
          )}

          {creativeBatch.length > 0 && (
            <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-base font-semibold text-slate-900">Copy Generator</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {creativeBatch.map((item) => (
                  <div key={`${item.id}-copy`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <p className="font-semibold">{item.copy_version.type}</p>
                    <p className="mt-1 font-medium text-slate-900">{item.copy_version.headline}</p>
                    <p>{item.copy_version.subheadline}</p>
                    <p className="mt-1">Trust: {item.copy_version.trust_reason}</p>
                    <p>Motivation: {item.copy_version.learning_motivation}</p>
                    <p>CTA: {item.copy_version.cta}</p>
                    <p className="text-[11px] text-slate-500">{item.copy_version.disclaimer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {creativeBatch.length > 0 && (
            <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-base font-semibold text-slate-900">Design Prompt Generator</p>
              <div className="mt-3 space-y-2">
                {creativeBatch.map((item) => (
                  <details key={`${item.id}-prompt`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <summary className="cursor-pointer font-semibold">{item.design_prompt.design_direction}</summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(item.design_prompt, null, 2)}</pre>
                  </details>
                ))}
              </div>
            </div>
          )}

          {referenceSummary && (
            <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
              <p className="text-base font-semibold text-slate-900">Reference Image Analyzer</p>
              <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{JSON.stringify(referenceSummary, null, 2)}</pre>
            </div>
          )}

          {creativeBatch.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <img src={item.generated_image_result || item.preview_url} alt={item.copy_version.headline} className="h-auto w-full rounded-xl border border-slate-200" />
              {!item.generated_image_result && (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] font-medium text-amber-700">
                  Low-fidelity preview only. Final poster should be generated by image model.
                </p>
              )}
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">{item.design_prompt.design_direction}</p>
                <p className="font-medium text-slate-900">{item.copy_version.headline}</p>
                <p>art_direction: <span className="font-semibold">{item.art_direction}</span></p>
                <p>layout_type: <span className="font-semibold">{item.layout_type}</span></p>
                <p>visual_hook: {item.visual_hook_text}</p>
                <p>why_this_design_works: {item.why_this_design_works}</p>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="font-semibold text-slate-800">Prompt Studio</p>
                  <p className="mt-1 max-h-24 overflow-auto text-[11px]">{item.design_prompt.prompt}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Negative: {item.design_prompt.negative_prompt}</p>
                  <button type="button" className="mt-2 rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium" onClick={() => navigator.clipboard.writeText(`${item.design_prompt.prompt}\n\nNegative prompt:\n${item.design_prompt.negative_prompt}`)}>Copy Prompt</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.quality_score.overall_score < 8 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>overall {item.quality_score.overall_score.toFixed(1)}</span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.quality_score.compliance_safety < 9 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>compliance {item.quality_score.compliance_safety}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">mobile {item.quality_score.mobile_readability}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">visual hook {item.quality_score.visual_hook}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">premium {item.quality_score.premium_texture}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">balance {item.quality_score.composition_balance}</span>
                </div>
                {item.quality_score.mobile_readability < 8 && <p className="rounded-lg bg-amber-50 p-2 text-amber-700">Text may be too small for mobile.</p>}
                {item.quality_score.design_texture < 8 && <p className="rounded-lg bg-amber-50 p-2 text-amber-700">Needs more premium institutional texture.</p>}
                {!!item.quality_score.problems.length && <p className="rounded-lg bg-rose-50 p-2 text-rose-700">Compliance issues: {item.quality_score.problems.join(", ")}</p>}
                <p>Status: <span className={`font-semibold ${item.status === "ready" ? "text-emerald-700" : item.status === "needs_fix" ? "text-amber-700" : "text-rose-700"}`}>{item.status}</span> · reason: {item.reason} · score: {item.quality_score.overall_score.toFixed(1)} {recommendedIds.includes(item.id) ? "⭐ Recommended" : ""}</p>
                <p className="rounded-lg bg-slate-50 p-2 text-[11px]">Design explain: {item.design_explanation.visual_hook} · {item.design_explanation.reason} · risk: {item.design_explanation.risk}</p>
              </div>
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700" onClick={() => navigator.clipboard.writeText(`${item.design_prompt.prompt}\n\nNegative prompt:\n${item.design_prompt.negative_prompt}`)}>Copy Prompt</button>
                  <button type="button" className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700" onClick={regenerateCopyForCard}>Regenerate Copy</button>
                  <button type="button" className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700" onClick={regeneratePromptForCard}>Regenerate Prompt</button>
                  <button type="button" disabled={!(item.status === "ready" && item.quality_score.overall_score >= 8 && item.generated_image_result)} className="rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 disabled:opacity-50" onClick={() => saveCreativeFeedback("winner", item)}>Mark Winner</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700" onClick={() => saveCreativeFeedback("like", item)}>Like</button>
                  <button type="button" className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700" onClick={() => saveCreativeFeedback("rejected", item)}>Reject</button>
                </div>

                <button
                  type="button"
                  className="w-full rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                  onClick={() => generateImageForCard(item)}
                >
                  Generate Final Poster
                </button>

                <button
                  type="button"
                  disabled={!item.generated_image_result}
                  className="w-full rounded-full border border-slate-400 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                  onClick={() => exportCreativePng(item)}
                >
                  Export PNG
                </button>
              </div>
              <details className="mt-2 text-xs text-slate-600">
                <summary>View prompt + scoring details</summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-2">{JSON.stringify(item, null, 2)}</pre>
              </details>
            </article>
          ))}

          <div className="sm:col-span-2 grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">Winning Pattern Library</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                {winningPatterns.length ? winningPatterns.slice(-8).map((p, i) => (
                  <li key={`${p.created_at}-${i}`} className="rounded-xl bg-emerald-50 p-2">
                    <p className="font-semibold">{p.headline}</p>
                    <p>{p.layout_style} · {p.color_style}</p>
                    <p>{p.design_direction}</p>
                    <p>{p.user_note || "Reason not provided"}</p>
                  </li>
                )) : <li className="text-slate-500">No winning patterns yet.</li>}
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">Rejected Pattern Panel</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                {rejectedPatterns.length ? rejectedPatterns.slice(-8).map((p, i) => (
                  <li key={`${p.created_at}-${i}`} className="rounded-xl bg-rose-50 p-2">
                    <p className="font-semibold">{p.layout_style}</p>
                    <p>{p.color_style} · {p.design_direction}</p>
                    <p>{p.user_note || "No rejection reason provided."}</p>
                  </li>
                )) : <li className="text-slate-500">No rejected patterns yet.</li>}
              </ul>
            </section>
          </div>

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
    <label className="block text-sm font-medium tracking-wide text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
