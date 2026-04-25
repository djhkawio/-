"use client";

import { useEffect, useRef } from "react";
import { drawPoster, FormData, PosterVariant } from "@/lib/poster";

type PosterCanvasProps = {
  variant: PosterVariant;
  payload: FormData;
  index: number;
  onLike: (variant: PosterVariant) => void;
  onReject: (variant: PosterVariant) => void;
};

export default function PosterCanvas({ variant, payload, index, onLike, onReject }: PosterCanvasProps) {
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
    link.download = `poster-${index + 1}-${variant.designTemplate}.png`;
    link.click();
  };

  return (
    <div className={`poster-frame poster-${variant.designTemplate}`}>
      <div className="poster-meta">
        <span>{variant.conceptName} · Variant {index + 1}</span>
        <span className="poster-chip">{variant.designTemplate}</span>
      </div>

      <canvas ref={ref} className="poster-canvas" />

      <div className="poster-actions">
        <button type="button" onClick={() => onLike(variant)} className="poster-feedback like">
          👍 Like
        </button>
        <button type="button" onClick={() => onReject(variant)} className="poster-feedback reject">
          👎 Reject
        </button>
      </div>

      <button type="button" onClick={downloadPng} className="poster-download">
        导出 PNG（版本 {index + 1}）
      </button>
    </div>
  );
}
