import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrganizationSubscription } from "@/lib/billing";
import { isOriginAllowed, buildFrameAncestorsCsp } from "@/lib/embed-security";
import EmbedSurveyClient from "./EmbedSurveyClient";
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface Props {
  params: { publicationId: string };
  searchParams: { parentOrigin?: string; lang?: string };
}

export const dynamic = "force-dynamic";

export default async function EmbedSurveyPage({ params, searchParams }: Props) {
  const { publicationId } = params;
  const parentOrigin = searchParams.parentOrigin;
  const reqHeaders = headers();
  const referer = reqHeaders.get("referer");

  // 1. Resolve publication strictly on the server
  const publication = await prisma.surveyPublication.findFirst({
    where: {
      OR: [{ publicCode: publicationId }, { id: publicationId }],
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          status: true,
        },
      },
      servicePoint: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      surveyVersion: {
        include: {
          questions: {
            orderBy: { displayOrder: "asc" },
            include: {
              options: {
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!publication || !publication.isActive || publication.revokedAt) {
    return (
      <div className="min-h-[300px] flex items-center justify-center p-6 bg-slate-50 font-sans text-center">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            แบบประเมินนี้ไม่พร้อมใช้งาน
          </h2>
          <p className="text-xs text-slate-500">
            รหัสการเชื่อมต่อ (Publication ID) ไม่ถูกต้อง หรือแบบประเมินถูกปิดการเชื่อมต่อโดยผู้ดูแล
          </p>
        </div>
      </div>
    );
  }

  if (publication.expiresAt && publication.expiresAt < new Date()) {
    return (
      <div className="min-h-[300px] flex items-center justify-center p-6 bg-slate-50 font-sans text-center">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            แบบประเมินนี้หมดอายุการเปิดรับคำตอบแล้ว
          </h2>
        </div>
      </div>
    );
  }

  // 2. Entitlement check: Organization must have 'embed_widget' feature
  const subInfo = await getOrganizationSubscription(publication.organizationId);
  const isEntitled = subInfo?.allFeatures.includes("embed_widget");

  if (!isEntitled) {
    return (
      <div className="min-h-[320px] flex items-center justify-center p-6 bg-slate-50 font-sans text-center">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            ต้องการสิทธิ์ใช้งาน Website Embedding
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            ฟีเจอร์ฝังแบบประเมินบนเว็บไซต์ภายนอก (Embeddable Widget) รองรับในแพ็กเกจ Business / Enterprise หรือสิทธิ์ที่ผู้ดูแลระบบมอบให้ (Admin Access Grant)
          </p>
          <div className="pt-1 text-[11px] text-slate-400">
            ติดต่อผู้ดูแลองค์กรเพื่อขอรับสิทธิ์ใช้งาน
          </div>
        </div>
      </div>
    );
  }

  // 3. Allowed Origins Security Check
  let allowedOrigins: string[] = [];
  try {
    if (publication.allowedOrigins) {
      allowedOrigins = JSON.parse(publication.allowedOrigins);
    }
  } catch {}

  // If organization configured specific allowed origins, enforce them strictly
  if (allowedOrigins.length > 0) {
    let checkTarget: string | null = parentOrigin || null;
    if (!checkTarget && referer) {
      try {
        const parsed = new URL(referer);
        checkTarget = parsed.origin;
      } catch {}
    }

    if (checkTarget && !isOriginAllowed(checkTarget, allowedOrigins)) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-slate-50 font-sans text-center">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 shadow-sm space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-rose-900">
              ไม่อนุญาตให้ฝังแบบประเมินบนโดเมนนี้
            </h2>
            <p className="text-xs text-slate-600">
              เว็บไซต์ต้นทาง (<strong>{checkTarget}</strong>) ไม่อยู่ในรายชื่อ Allowed Origins ที่ผู้ดูแลองค์กรกำหนดไว้เพื่อความปลอดภัย
            </p>
          </div>
        </div>
      );
    }
  }

  // 4. Parse Widget Config
  let widgetConfig: any = {};
  try {
    if (publication.widgetConfig) {
      widgetConfig = JSON.parse(publication.widgetConfig);
    }
  } catch {}

  const hidePoweredBy = subInfo?.allFeatures.includes("hide_powered_by") ?? false;

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center">
      <EmbedSurveyClient
        publicationId={publication.id}
        publicCode={publication.publicCode}
        parentOrigin={parentOrigin}
        organization={publication.organization}
        servicePoint={publication.servicePoint}
        surveyVersion={publication.surveyVersion}
        widgetConfig={widgetConfig}
        hidePoweredBy={hidePoweredBy}
      />
    </div>
  );
}
