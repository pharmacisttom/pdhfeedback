import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizationSubscription } from "@/lib/billing";
import { getAppBaseUrl } from "@/lib/app-url";
import IntegrationCenterClient from "./IntegrationCenterClient";

interface Props {
  params: { orgSlug: string };
}

export default async function IntegrationsPage({ params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) notFound();

  // Verify user membership in this organization
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.userId,
        organizationId: org.id,
      },
    },
  });

  if (!membership && !session.isPlatformAdmin) {
    redirect("/");
  }

  // Fetch published surveys
  const surveys = await prisma.survey.findMany({
    where: {
      organizationId: org.id,
      isArchived: false,
    },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          title: true,
          language: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch active service points
  const servicePoints = await prisma.servicePoint.findMany({
    where: {
      organizationId: org.id,
      isArchived: false,
    },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      publicCode: true,
    },
  });

  // Fetch publications / embed configurations
  const publications = await prisma.surveyPublication.findMany({
    where: { organizationId: org.id },
    include: {
      servicePoint: { select: { id: true, code: true, name: true } },
      surveyVersion: {
        select: {
          id: true,
          versionNumber: true,
          title: true,
          survey: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch API Keys
  const apiKeys = await prisma.apiKey.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });

  // Fetch Integration Audit Logs
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      organizationId: org.id,
      action: {
        in: [
          "API_KEY_CREATED",
          "API_KEY_REVOKED",
          "API_KEY_ROTATED",
          "EMBED_CONFIGURATION_CREATED",
          "EMBED_CONFIG_ACTIVATED",
          "EMBED_CONFIG_REVOKED",
          "EMBED_CODE_ROTATED",
          "API_CREATE_SURVEY_INVITATION",
          "API_REVOKE_SURVEY_INVITATION",
        ],
      },
    },
    take: 15,
    orderBy: { timestamp: "desc" },
  });

  // Entitlement Resolution
  const subInfo = await getOrganizationSubscription(org.id);
  const hasEmbedFeature = subInfo?.allFeatures.includes("embed_widget") ?? false;
  const hasApiFeature = subInfo?.allFeatures.includes("api_access") ?? false;
  const appBaseUrl = getAppBaseUrl();

  return (
    <IntegrationCenterClient
      organization={{
        id: org.id,
        name: org.name,
        slug: org.slug,
      }}
      currentRole={membership?.role || (session.isPlatformAdmin ? "OWNER" : "MEMBER")}
      isPlatformAdmin={Boolean(session.isPlatformAdmin)}
      planCode={subInfo?.planCode || "FREE"}
      hasEmbedFeature={hasEmbedFeature}
      hasApiFeature={hasApiFeature}
      appBaseUrl={appBaseUrl}
      surveys={surveys.map((s) => ({
        id: s.id,
        title: s.title,
        publishedVersions: s.versions.map((v) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          title: v.title,
          language: v.language,
        })),
      }))}
      servicePoints={servicePoints}
      embeds={publications.map((p) => {
        let allowedOrigins: string[] = [];
        try {
          if (p.allowedOrigins) allowedOrigins = JSON.parse(p.allowedOrigins);
        } catch {}

        let widgetConfig: any = {};
        try {
          if (p.widgetConfig) widgetConfig = JSON.parse(p.widgetConfig);
        } catch {}

        return {
          id: p.id,
          name: p.name || p.surveyVersion.title,
          publicCode: p.publicCode,
          displayMode: p.displayMode,
          allowedOrigins,
          widgetConfig,
          isActive: p.isActive,
          isRevoked: Boolean(p.revokedAt),
          createdAt: p.createdAt.toISOString(),
          servicePoint: p.servicePoint,
          survey: {
            title: p.surveyVersion.survey.title,
            versionNumber: p.surveyVersion.versionNumber,
            versionTitle: p.surveyVersion.title,
          },
        };
      })}
      apiKeys={apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes.split(",").map((s) => s.trim()),
        servicePointId: k.servicePointId,
        expiresAt: k.expiresAt?.toISOString() || null,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
        isRevoked: k.isRevoked,
        createdAt: k.createdAt.toISOString(),
      }))}
      auditLogs={auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        userEmail: l.userEmail,
        details: l.details,
        timestamp: l.timestamp.toISOString(),
      }))}
    />
  );
}
