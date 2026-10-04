import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PrintButton from "./PrintButton";
import { ArrowLeft, Download, ExternalLink, Printer, QrCode } from "lucide-react";

interface Props {
  params: { code: string };
}

export default async function ServicePointQrPage({ params }: Props) {
  const { code } = params;

  const publication = await prisma.surveyPublication.findUnique({
    where: { publicCode: code },
    include: {
      organization: true,
      servicePoint: true,
      surveyVersion: {
        include: {
          survey: true,
        },
      },
    },
  });

  if (!publication) {
    notFound();
  }

  const { organization, servicePoint, surveyVersion } = publication;

  // Generate target survey URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const surveyUrl = `${appUrl}/s/${code}`;

  // Generate QR Code as SVG Data URL
  const qrSvg = await QRCode.toString(surveyUrl, {
    type: "svg",
    width: 320,
    margin: 2,
    color: {
      dark: "#0f766e", // deep teal
      light: "#ffffff",
    },
  });

  // Generate QR as PNG Data URL for direct download
  const qrPngDataUrl = await QRCode.toDataURL(surveyUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: "#0f766e",
      light: "#ffffff",
    },
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Action Toolbar (Hidden during print) */}
      <div className="no-print max-w-md w-full mb-6 flex items-center justify-between">
        <Link
          href={`/${organization.slug}/service-points`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหลังบ้าน
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={qrPngDataUrl}
            download={`QR-${servicePoint?.code || code}.png`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-xl transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            ดาวน์โหลด PNG
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Printable Counter Display Stand (A5 / Desktop Card) */}
      <div
        id="printable-stand"
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center relative print:shadow-none print:border-none print:m-0 print:p-0"
      >
        {/* Top Header Card Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-700 text-white p-6 sm:p-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-white font-extrabold text-2xl shadow-inner border border-white/20">
            {organization.name.charAt(0)}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
            {organization.name}
          </h1>
          {servicePoint && (
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full text-xs font-medium text-teal-50 mt-1">
              จุดบริการ: {servicePoint.name} ({servicePoint.code})
            </div>
          )}
        </div>

        {/* QR Code Center Stage */}
        <div className="p-8 sm:p-10 flex flex-col items-center justify-center bg-white">
          <div className="p-4 rounded-3xl bg-slate-50 border-2 border-dashed border-teal-300 shadow-inner inline-block">
            <div
              className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-6 mb-1">
            สแกนเพื่อประเมินความพึงพอใจ
          </h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            เปิดกล้องมือถือหรือแอปพลิเคชัน Line เพื่อสแกน QR Code ตอบแบบประเมินได้ทันทีโดยไม่ต้องลงทะเบียน
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-[11px] text-teal-800 font-semibold">
            <span>“รับฟังทุกบริการ เห็นผลชัด ปรับปรุงได้ทันที”</span>
          </div>

          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            รหัสสาธารณะ: {code}
          </div>
        </div>

        {/* Link test row (no-print) */}
        <div className="no-print bg-slate-50 p-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 truncate max-w-[240px] font-mono text-[11px]">
            {surveyUrl}
          </span>
          <Link
            href={`/s/${code}`}
            target="_blank"
            className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
          >
            เปิดทดสอบ <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
