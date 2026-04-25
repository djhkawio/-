"use client";

import { useMemo, useState } from "react";
import PosterCanvas from "@/components/PosterCanvas";
import { buildVariants, FormData } from "@/lib/poster";

const initialForm: FormData = {
  country: "China",
  theme: "Retirement Planning Basics",
  age: "30-50",
  style: "Steady Professional",
  quantity: 5
};

export default function Home() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState<FormData>(initialForm);

  const variants = useMemo(() => buildVariants(submitted), [submitted]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-brand-900 md:text-3xl">自动广告海报生成工具（MVP）</h1>
      <p className="mt-2 text-sm text-slate-600">
        模板渲染模式 · 固定 1254×1254 · 默认一次生成 5 个版本 · 无真人照片、无收益保证语句。
      </p>

      <section className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <form
          className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted({ ...form, quantity: 5 });
          }}
        >
          <Field label="国家">
            <input
              className="input"
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              placeholder="例如 China / Japan / United States"
            />
          </Field>

          <Field label="广告主题">
            <input
              className="input"
              value={form.theme}
              onChange={(e) => setForm((p) => ({ ...p, theme: e.target.value }))}
            />
          </Field>

          <Field label="目标年龄">
            <input
              className="input"
              value={form.age}
              onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
            />
          </Field>

          <Field label="广告风格">
            <input
              className="input"
              value={form.style}
              onChange={(e) => setForm((p) => ({ ...p, style: e.target.value }))}
            />
          </Field>

          <Field label="输出数量">
            <input
              className="input"
              type="number"
              min={5}
              max={5}
              value={form.quantity}
              onChange={() => setForm((p) => ({ ...p, quantity: 5 }))}
            />
            <p className="mt-1 text-xs text-slate-500">根据需求，MVP 当前固定每次输出 5 个版本。</p>
          </Field>

          <button type="submit" className="w-full rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-900">
            生成 5 个海报版本
          </button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2">
          {variants.map((variant, idx) => (
            <PosterCanvas key={variant.id} variant={variant} payload={submitted} index={idx} />
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
