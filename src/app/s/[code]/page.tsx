import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RespondentSurveyClient from "./RespondentSurveyClient";

interface Props {
  params: { code: string };
  searchParams: { invite?: string; kiosk?: string };
}

export default async function PublicSurveyPage({ params, searchParams }: Props) {
  const { code } = params;
  const invitationToken = searchParams.invite;
  const isKioskMode = searchParams.kiosk === "1";

  // Resolve publication strictly on the server
  const publication = await prisma.surveyPublication.findUnique({
    where: { publicCode: code },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          logoUrl: true,
          status: true,
        },
      },
      servicePoint: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          isArchived: true,
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

  if (!publication || !publication.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">ไม่พบแบบประเมิน หรือจุดบริการนี้ปิดรับคำตอบ</h1>
          <p className="text-sm text-slate-500 mb-6">
            ลิงก์หรือ QR Code นี้อาจหมดอายุหรือปิดการใช้งาน กรุณาติดต่อเจ้าหน้าที่ประจำจุดบริการ
          </p>
        </div>
      </div>
    );
  }

  const { organization, servicePoint, surveyVersion } = publication;

  if (organization.status !== "ACTIVE" || surveyVersion.status !== "PUBLISHED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">แบบประเมินปิดรับคำตอบแล้ว</h1>
          <p className="text-sm text-slate-500">
            ขออภัย แบบประเมินชุดนี้สิ้นสุดระยะเวลาการประเมิน หรืออยู่ระหว่างการปิดปรับปรุง
          </p>
        </div>
      </div>
    );
  }

  // Pre-validate invitation token if present
  let invitationExpired = false;
  let invitationConsumed = false;
  if (invitationToken) {
    const inv = await prisma.surveyInvitation.findFirst({
      where: {
        organizationId: organization.id,
        isConsumed: false,
      },
    });
    // Detailed validation happens during submission with tokenHash
  }

  return (
    <RespondentSurveyClient
      publicCode={code}
      organization={organization}
      servicePoint={servicePoint}
      surveyVersion={surveyVersion}
      invitationToken={invitationToken}
      isKioskMode={isKioskMode}
    />
  );
}
