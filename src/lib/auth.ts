import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserContext, Role } from "./permissions";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "pdhfeedback_super_secure_auth_secret_key_2026_dev_only"
);

const SESSION_COOKIE_NAME = "pdh_session";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
  activeOrgId?: string;
  activeOrgSlug?: string;
  activeRole?: Role;
  servicePointScope?: string[] | null;
  canExport?: boolean;
  canViewContacts?: boolean;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<UserContext | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Re-verify user status in DB for real-time security revocation
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, status: true, isPlatformAdmin: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  // If an active organization is selected, refresh membership details
  let role = payload.activeRole;
  let servicePointScope = payload.servicePointScope;
  let canExport = payload.canExport;
  let canViewContacts = payload.canViewContacts;

  if (payload.activeOrgId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: payload.activeOrgId,
        },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      // Membership was revoked or altered
      if (!user.isPlatformAdmin) {
        return {
          userId: user.id,
          email: payload.email,
          fullName: payload.fullName,
          isPlatformAdmin: user.isPlatformAdmin,
        };
      }
    } else {
      role = membership.role as Role;
      servicePointScope = membership.servicePointScope
        ? JSON.parse(membership.servicePointScope)
        : null;
      canExport = membership.canExport;
      canViewContacts = membership.canViewContacts;
    }
  }

  return {
    userId: user.id,
    email: payload.email,
    fullName: payload.fullName,
    isPlatformAdmin: user.isPlatformAdmin,
    activeOrgId: payload.activeOrgId,
    activeOrgSlug: payload.activeOrgSlug,
    activeRole: role,
    servicePointScope,
    canExport,
    canViewContacts,
  };
}

export async function getAuthUser(req?: Request): Promise<{
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
} | null> {
  const session = await getSession();
  if (!session) return null;
  return {
    id: session.userId,
    email: session.email,
    fullName: session.fullName,
    isPlatformAdmin: session.isPlatformAdmin,
  };
}

