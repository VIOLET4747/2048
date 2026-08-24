import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MERGE — 2048 数字游戏",
  description: "一款简洁、流畅、可随时继续的 2048 数字合并游戏。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
