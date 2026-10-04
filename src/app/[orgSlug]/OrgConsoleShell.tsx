"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  MapPin,
  MessageSquare,
  LifeBuoy,
  FileSpreadsheet,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  ShieldCheck,
  ExternalLink,
  Layers,
  CreditCard,
} from "lucide-react";

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  role?: string;
}

interface UserContextProps {
  userId: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
}

interface Props {
  children: React.ReactNode;
  user: UserContextProps;
  currentOrg: OrgInfo;
  currentRole: string;
  userOrganizations: OrgInfo[];
  unreadNotifications: number;
}

const ROLE_LABELS: Record<string, { th: string; badge: string }> = {
  OWNER: { th: "เจ้าขององค์กร (Owner)", badge: "bg-teal-100 text-teal-800" },
  ADMIN: { th: "ผู้ดูแลระบบ (Admin)", badge: "bg-blue-100 text-blue-800" },
  SERVICE_MANAGER: { th: "ผู้จัดการจุดบริการ (Manager)", badge: "bg-amber-100 text-amber-800" },
  VIEWER: { th: "ผู้ดูรายงาน (Viewer)", badge: "bg-slate-100 text-slate-700" },
};

export default function OrgConsoleShell({
  children,
  user,
  currentOrg,
  currentRole,
  userOrganizations,
  unreadNotifications,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { label: "แดชบอร์ดภาพรวม", href: `/${currentOrg.slug}/dashboard`, icon: BarChart3 },
    { label: "แบบประเมินและเวอร์ชัน", href: `/${currentOrg.slug}/surveys`, icon: ClipboardList },
    { label: "จุดบริการและป้าย QR", href: `/${currentOrg.slug}/service-points`, icon: MapPin },
    { label: "รายการคำตอบ", href: `/${currentOrg.slug}/responses`, icon: MessageSquare },
    { label: "ติดตามข้อเสนอแนะ", href: `/${currentOrg.slug}/feedback`, icon: LifeBuoy },
    { label: "รายงานและส่งออก", href: `/${currentOrg.slug}/reports`, icon: FileSpreadsheet },
    { label: "แพ็กเกจและการใช้งาน", href: `/${currentOrg.slug}/plan`, icon: CreditCard },
    { label: "ทีมงานและสิทธิ์", href: `/${currentOrg.slug}/team`, icon: Users },
    { label: "ตั้งค่าองค์กร", href: `/${currentOrg.slug}/settings`, icon: Settings },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleSwitchOrg = async (orgId: string) => {
    setSwitcherOpen(false);
    const res = await fetch("/api/auth/switch-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId }),
    });
    const data = await res.json();
    if (res.ok && data.activeOrgSlug) {
      router.push(`/${data.activeOrgSlug}/dashboard`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
        {/* Org Brand & Switcher Header */}
        <div className="p-4 border-b border-slate-800 relative">
          <button
            type="button"
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {currentOrg.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate leading-tight">
                  {currentOrg.name}
                </span>
                <span className="text-[10px] text-teal-400 font-mono block">
                  {currentOrg.slug}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform" />
          </button>

          {/* Org Switcher Dropdown */}
          {switcherOpen && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-bold text-slate-400 px-2 py-1 block uppercase tracking-wider">
                สลับองค์กรที่คุณสังกัด
              </span>
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                {userOrganizations.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSwitchOrg(o.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                      o.slug === currentOrg.slug
                        ? "bg-teal-700 text-white font-bold"
                        : "hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    <span className="truncate">{o.name}</span>
                    <span className="text-[10px] opacity-75">{o.role}</span>
                  </button>
                ))}
              </div>

              {user.isPlatformAdmin && (
                <div className="pt-2 mt-2 border-t border-slate-700">
                  <Link
                    href="/platform"
                    className="block px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 transition-all text-center"
                  >
                    👑 เข้าสู่ Platform Admin
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Role Pill */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">บทบาทของคุณ:</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              ROLE_LABELS[currentRole]?.badge || "bg-slate-800 text-slate-300"
            }`}
          >
            {ROLE_LABELS[currentRole]?.th.split(" ")[0] || currentRole}
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-teal-200" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-bold text-white block truncate leading-tight">
              {user.fullName}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {user.email}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="ออกจากระบบ"
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-center min-w-0 px-2">
            <span className="text-xs font-bold block truncate">{currentOrg.name}</span>
            <span className="text-[10px] text-teal-400 font-mono">{currentOrg.slug}</span>
          </div>
          <div className="w-6" /> {/* spacer */}
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80%] bg-slate-900 text-slate-300 flex flex-col h-full z-10 shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white truncate">{currentOrg.name}</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? "bg-teal-700 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-bold text-white block truncate">{user.fullName}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
