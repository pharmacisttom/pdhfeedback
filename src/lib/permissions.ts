export type Role = "OWNER" | "ADMIN" | "SERVICE_MANAGER" | "VIEWER";

export interface UserContext {
  userId: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
  activeOrgId?: string;
  activeOrgSlug?: string;
  activeRole?: Role;
  servicePointScope?: string[] | null; // null means all service points
  canExport?: boolean;
  canViewContacts?: boolean;
}

export const PERMISSION_MATRIX = {
  OWNER: {
    canManageOrg: true,
    canManageTeam: true,
    canTransferOwnership: true,
    canManageSurveys: true,
    canPublishSurveys: true,
    canManageServicePoints: true,
    canViewDashboard: true,
    canViewFeedback: true,
    canResolveFeedback: true,
    canExport: true,
    canViewContacts: true,
    canManageApiKeys: true,
    canManageQuotas: true,
  },
  ADMIN: {
    canManageOrg: false,
    canManageTeam: true,
    canTransferOwnership: false,
    canManageSurveys: true,
    canPublishSurveys: true,
    canManageServicePoints: true,
    canViewDashboard: true,
    canViewFeedback: true,
    canResolveFeedback: true,
    canExport: true,
    canViewContacts: true,
    canManageApiKeys: false,
    canManageQuotas: false,
  },
  SERVICE_MANAGER: {
    canManageOrg: false,
    canManageTeam: false,
    canTransferOwnership: false,
    canManageSurveys: false,
    canPublishSurveys: false,
    canManageServicePoints: false,
    canViewDashboard: true, // scoped to assigned service points
    canViewFeedback: true, // scoped
    canResolveFeedback: true, // scoped
    canExport: false,
    canViewContacts: false,
    canManageApiKeys: false,
    canManageQuotas: false,
  },
  VIEWER: {
    canManageOrg: false,
    canManageTeam: false,
    canTransferOwnership: false,
    canManageSurveys: false,
    canPublishSurveys: false,
    canManageServicePoints: false,
    canViewDashboard: true,
    canViewFeedback: true,
    canResolveFeedback: false,
    canExport: false, // can be overridden by canExport flag
    canViewContacts: false, // can be overridden by canViewContacts flag
    canManageApiKeys: false,
    canManageQuotas: false,
  },
} as const;

export function hasPermission(
  ctx: UserContext,
  permission: keyof typeof PERMISSION_MATRIX.OWNER
): boolean {
  if (ctx.isPlatformAdmin && permission === "canViewDashboard") return true;
  if (!ctx.activeRole) return false;

  if (permission === "canExport") {
    if (ctx.activeRole === "OWNER" || ctx.activeRole === "ADMIN") return true;
    return Boolean(ctx.canExport);
  }

  if (permission === "canViewContacts") {
    if (ctx.activeRole === "OWNER" || ctx.activeRole === "ADMIN") return true;
    return Boolean(ctx.canViewContacts);
  }

  return PERMISSION_MATRIX[ctx.activeRole]?.[permission] ?? false;
}

export function isServicePointAllowed(
  ctx: UserContext,
  servicePointId: string | null | undefined
): boolean {
  if (!servicePointId) return true;
  if (ctx.activeRole === "OWNER" || ctx.activeRole === "ADMIN") return true;
  if (!ctx.servicePointScope || ctx.servicePointScope.length === 0) return true;
  return ctx.servicePointScope.includes(servicePointId);
}
