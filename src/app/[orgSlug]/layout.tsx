import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrgConsoleShell from "./OrgConsoleShell";

interface Props {
  children: React.ReactNode;
  params: { orgSlug: string };
}

export default async function OrgLayout({ children, params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?returnUrl=/${orgSlug}/dashboard`);
  }

  // Find target organization
  const targetOrg = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.userId, status: "ACTIVE" },
      },
    },
  });

  if (!targetOrg) {
    notFound();
  }

  // Check user permission
  const isMember = targetOrg.memberships.length > 0;
  if (!isMember && !session.isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
            🚫
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">ไม่มีสิทธิ์เข้าถึงองค์กรนี้</h1>
          <p className="text-xs text-slate-500 mb-6">
            คุณไม่ได้เป็นสมาชิกขององค์กร {targetOrg.name} หรือสิทธิ์ของคุณถูกระงับ
          </p>
          <a
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
          >
            กลับสู่หน้าเข้าสู่ระบบ
          </a>
        </div>
      </div>
    );
  }

  // Get all organizations this user belongs to for the switcher
  const userOrganizations = await prisma.membership.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, type: true },
      },
    },
  });

  // Get unread notifications count
  const unreadNotifCount = await prisma.notification.count({
    where: {
      organizationId: targetOrg.id,
      isRead: false,
    },
  });

  const currentRole = targetOrg.memberships[0]?.role || (session.isPlatformAdmin ? "OWNER" : "VIEWER");

  return (
    <OrgConsoleShell
      user={session}
      currentOrg={targetOrg}
      currentRole={currentRole}
      userOrganizations={userOrganizations.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        type: m.organization.type,
        role: m.role,
      }))}
      unreadNotifications={unreadNotifCount}
    >
      {children}
    </OrgConsoleShell>
  );
}
