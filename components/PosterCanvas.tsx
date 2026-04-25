"use client";

import { useEffect, useRef } from "react";
import { drawPoster, FormData, PosterVariant } from "@/lib/poster";

type PosterCanvasProps = {
  variant: PosterVariant;
  payload: FormData;
  index: number;
};

export default function PosterCanvas({ variant, payload, index }: PosterCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (ref.current) drawPoster(ref.current, variant, payload);
  }, [variant, payload]);

  const downloadPng = () => {
    const canvas = ref.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `poster-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-3 shadow-sm">
      <canvas ref={ref} className="h-auto w-full rounded-lg border border-slate-200" />
      <button
        type="button"
        onClick={downloadPng}
        className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
      >
        导出 PNG（版本 {index + 1}）
      </button>
    </div>
  );
}
