import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ad Poster MVP",
  description: "Template-based ad poster generator"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
