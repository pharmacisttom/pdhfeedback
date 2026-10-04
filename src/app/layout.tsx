import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PdhFeedback - ระบบประเมินความพึงพอใจการบริการ Multi-tenant SaaS",
  description: "รับฟังทุกบริการ เห็นผลชัด ปรับปรุงได้ทันที ระบบประเมินความพึงพอใจสำหรับโรงพยาบาล คลินิก สหกรณ์ และธุรกิจบริการ",
  keywords: ["ความพึงพอใจ", "CSAT", "NPS", "แบบประเมินบริการ", "QR Code Survey", "PdhFeedback"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col font-sans text-slate-800 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
