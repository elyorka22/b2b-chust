import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B Chust - Ommaviy do'kon",
  description: "Ommaviy xaridlar uchun B2B xizmati",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}

