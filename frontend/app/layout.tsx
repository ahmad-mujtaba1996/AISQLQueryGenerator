import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataPulse AI | Production-Grade AI Analytics SaaS",
  description:
    "Convert natural language inquiries into secure, AST-validated PostgreSQL queries and interactive business intelligence dashboards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-[#07090e] text-slate-100 antialiased selection:bg-blue-600/30 selection:text-blue-200`}
      >
        {children}
      </body>
    </html>
  );
}
