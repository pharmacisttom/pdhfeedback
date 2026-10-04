"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code2,
  Key,
  Globe,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Info,
  AlertCircle,
  FileCode,
  Terminal,
  Eye,
  Sliders,
  CheckCircle2,
  Sparkles,
  X,
  Layers,
  HelpCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { ALL_API_SCOPES, ApiScope } from "@/lib/api-auth";

interface SurveyVersion {
  id: string;
  versionNumber: number;
  title: string;
  language: string;
}

interface Survey {
  id: string;
  title: string;
  publishedVersions: SurveyVersion[];
}

interface ServicePoint {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  publicCode: string;
}

interface EmbedItem {
  id: string;
  name: string;
  publicCode: string;
  displayMode: string;
  allowedOrigins: string[];
  widgetConfig: any;
  isActive: boolean;
  isRevoked: boolean;
  createdAt: string;
  servicePoint?: { id: string; code: string; name: string } | null;
  survey: {
    title: string;
    versionNumber: number;
    versionTitle: string;
  };
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  servicePointId?: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  userEmail?: string | null;
  details?: any;
  timestamp: string;
}

interface Props {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  currentRole: string;
  isPlatformAdmin: boolean;
  planCode: string;
  hasEmbedFeature: boolean;
  hasApiFeature: boolean;
  appBaseUrl: string;
  surveys: Survey[];
  servicePoints: ServicePoint[];
  embeds: EmbedItem[];
  apiKeys: ApiKeyItem[];
  auditLogs: AuditLogItem[];
}

export default function IntegrationCenterClient({
  organization,
  currentRole,
  isPlatformAdmin,
  planCode,
  hasEmbedFeature,
  hasApiFeature,
  appBaseUrl,
  surveys,
  servicePoints,
  embeds,
  apiKeys,
  auditLogs,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"EMBED" | "API_KEYS" | "DOCS">("EMBED");

  // Selected embed for Preview & Snippets
  const [selectedEmbed, setSelectedEmbed] = useState<EmbedItem | null>(
    embeds[0] || null
  );

  // Preview device viewport size
  const [previewWidth, setPreviewWidth] = useState<number>(768); // 360, 390, 768, 1440
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // New Embed Modal State
  const [isNewEmbedModalOpen, setIsNewEmbedModalOpen] = useState(false);
  const [newEmbedName, setNewEmbedName] = useState("");
  const [selectedSurveyVersionId, setSelectedSurveyVersionId] = useState(
    surveys[0]?.publishedVersions[0]?.id || ""
  );
  const [selectedServicePointId, setSelectedServicePointId] = useState("");
  const [embedDisplayMode, setEmbedDisplayMode] = useState<
    "INLINE_IFRAME" | "JS_WIDGET"
  >("INLINE_IFRAME");
  const [widgetButtonText, setWidgetButtonText] = useState("ประเมินความพึงพอใจ");
  const [widgetThemeColor, setWidgetThemeColor] = useState("#0f766e");
  const [isWidgetFloating, setIsWidgetFloating] = useState(false);
  const [allowedOriginsInput, setAllowedOriginsInput] = useState("");
  const [allowedOriginsList, setAllowedOriginsList] = useState<string[]>([]);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [isSubmittingEmbed, setIsSubmittingEmbed] = useState(false);

  // New API Key Modal State
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([
    "service_points:read",
    "surveys:read",
    "invitations:write",
    "reports:read",
    "usage:read",
  ]);
  const [keyServicePointId, setKeyServicePointId] = useState("");
  const [keyExpiresInDays, setKeyExpiresInDays] = useState<number | null>(365);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);

  // Show Newly Created API Key Modal (Shown once!)
  const [createdKeyRaw, setCreatedKeyRaw] = useState<string | null>(null);
  const [createdKeyName, setCreatedKeyName] = useState("");

  const copyToClipboard = (text: string, snippetId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetId);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleAddOrigin = () => {
    if (!allowedOriginsInput.trim()) return;
    const origin = allowedOriginsInput.trim();
    if (!allowedOriginsList.includes(origin)) {
      setAllowedOriginsList([...allowedOriginsList, origin]);
    }
    setAllowedOriginsInput("");
  };

  const handleRemoveOrigin = (index: number) => {
    setAllowedOriginsList(allowedOriginsList.filter((_, i) => i !== index));
  };

  const handleCreateEmbed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmbedName.trim()) {
      setEmbedError("กรุณาระบุชื่อการเชื่อมต่อ");
      return;
    }
    if (!selectedSurveyVersionId) {
      setEmbedError("กรุณาเลือกแบบประเมิน");
      return;
    }

    setIsSubmittingEmbed(true);
    setEmbedError(null);

    try {
      const res = await fetch("/api/integrations/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmbedName.trim(),
          surveyVersionId: selectedSurveyVersionId,
          servicePointId: selectedServicePointId || null,
          displayMode: embedDisplayMode,
          allowedOrigins: allowedOriginsList,
          widgetConfig: {
            buttonText: widgetButtonText,
            themeColor: widgetThemeColor,
            isFloating: isWidgetFloating,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "สร้างการเชื่อมต่อไม่สำเร็จ");
      }

      setIsNewEmbedModalOpen(false);
      setNewEmbedName("");
      setAllowedOriginsList([]);
      router.refresh();
    } catch (err: any) {
      setEmbedError(err.message);
    } finally {
      setIsSubmittingEmbed(false);
    }
  };

  const handleRotateEmbedCode = async (embedId: string) => {
    if (
      !confirm(
        "คำเตือน: การหมุนเวียน (Rotate) รหัส Embed จะทำให้รหัสเดิมใช้งานไม่ได้ทันที คุณจะต้องอัปเดตโค้ดบนเว็บไซต์ของคุณ ยืนยันดำเนินการหรือไม่?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/integrations/embeds/${embedId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "ดำเนินการไม่สำเร็จ");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleEmbedStatus = async (embedId: string) => {
    try {
      const res = await fetch(`/api/integrations/embeds/${embedId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "ดำเนินการไม่สำเร็จ");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setKeyError("กรุณาระบุชื่อระบบหรือวัตถุประสงค์ของ API Key");
      return;
    }
    if (selectedScopes.length === 0) {
      setKeyError("ต้องเลือกสิทธิ์ (Scope) อย่างน้อย 1 รายการ");
      return;
    }

    setIsSubmittingKey(true);
    setKeyError(null);

    try {
      const res = await fetch("/api/integrations/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim(),
          scopes: selectedScopes,
          servicePointId: keyServicePointId || null,
          expiresInDays: keyExpiresInDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "สร้าง API Key ไม่สำเร็จ");
      }

      setIsNewKeyModalOpen(false);
      setCreatedKeyName(data.apiKey.name);
      setCreatedKeyRaw(data.apiKey.rawKey);
      setKeyName("");
      router.refresh();
    } catch (err: any) {
      setKeyError(err.message);
    } finally {
      setIsSubmittingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm("ยืนยันเพิกถอน API Key นี้หรือไม่? ระบบภายนอกที่ใช้คีย์นี้จะไม่สามารถเชื่อมต่อได้อีก")) {
      return;
    }

    try {
      const res = await fetch(`/api/integrations/api-keys/${keyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "เพิกถอนไม่สำเร็จ");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRotateApiKey = async (keyId: string) => {
    if (
      !confirm(
        "คำเตือน: การหมุนเวียน (Rotate) จะระงับคีย์เดิมทันทีและสร้างคีย์ใหม่ทดแทน ยืนยันดำเนินการหรือไม่?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/integrations/api-keys/${keyId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "หมุนเวียนไม่สำเร็จ");
      setCreatedKeyName(data.apiKey.name);
      setCreatedKeyRaw(data.apiKey.rawKey);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Snippet Generation
  const activeEmbedId = selectedEmbed?.publicCode || "emb_sample";
  const inlineIframeSnippet = `<iframe
  src="${appBaseUrl}/embed/${activeEmbedId}"
  title="ประเมินความพึงพอใจในการรับบริการ"
  loading="lazy"
  referrerpolicy="strict-origin"
  style="width:100%;min-height:480px;border:0;">
</iframe>`;

  const inlineWidgetSnippet = `<div data-tomvisfeedback-widget="${activeEmbedId}" data-mode="inline"></div>
<script src="${appBaseUrl}/widget/v1.js" data-tomvisfeedback-embed="${activeEmbedId}" defer></script>`;

  const dialogWidgetSnippet = `<div
  data-tomvisfeedback-widget="${activeEmbedId}"
  data-mode="dialog"
  data-button-text="${selectedEmbed?.widgetConfig?.buttonText || "ประเมินความพึงพอใจ"}"
  data-button-color="${selectedEmbed?.widgetConfig?.themeColor || "#0f766e"}"
  ${selectedEmbed?.widgetConfig?.isFloating ? 'data-floating="true"' : ""}>
</div>
<script src="${appBaseUrl}/widget/v1.js" data-tomvisfeedback-embed="${activeEmbedId}" defer></script>`;

  const publicLinkUrl = `${appBaseUrl}/s/${activeEmbedId}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              เชื่อมต่อเว็บไซต์และ API (Integration Center)
            </h1>
            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full">
              Developer & Embed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            นำแบบประเมินไปติดตั้งบนเว็บไซต์ภายนอก หรือเชื่อมโยงข้อมูลกับระบบโรงพยาบาล (HIS), CRM และ POS ผ่าน REST API
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/demo-embed.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-all"
          >
            <Eye className="w-4 h-4 text-teal-600" />
            <span>ดูหน้าตัวอย่าง Demo</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-all"
          >
            <FileCode className="w-4 h-4" />
            <span>OpenAPI 3.1 Spec</span>
          </a>
        </div>
      </div>

      {/* Entitlement Notice Banner */}
      {(!hasEmbedFeature || !hasApiFeature) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                สิทธิ์การใช้งานระบบเชื่อมต่อภายนอก (Developer & Embed Entitlements)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                ขณะนี้องค์กรของท่านอยู่ในแพ็กเกจ <strong>{planCode}</strong> การใช้งาน Embeddable Widget และ REST API แบบเต็มรูปแบบจะเปิดใช้งานอัตโนมัติในแพ็กเกจ Business / Enterprise หรือสิทธิ์ที่ผู้ดูแลมอบให้
              </p>
            </div>
          </div>

          <Link
            href={`/${organization.slug}/plan`}
            className="shrink-0 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            ตรวจสอบแพ็กเกจ / ขอรับสิทธิ์
          </Link>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("EMBED")}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "EMBED"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>โค้ดฝังเว็บไซต์ (Embed & Widgets)</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {embeds.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("API_KEYS")}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "API_KEYS"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>จัดการ API Keys (Server API)</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {apiKeys.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DOCS")}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "DOCS"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>คู่มือและตัวอย่างโค้ด (API Docs)</span>
        </button>
      </div>

      {/* TAB 1: EMBED SURVEY & WIDGETS */}
      {activeTab === "EMBED" && (
        <div className="space-y-6">
          {/* Top Actions & Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  เลือกการเชื่อมต่อแบบประเมินที่ต้องการคัดลอกโค้ด
                </h2>
                <p className="text-xs text-slate-500">
                  รองรับทั้ง Inline iframe, JavaScript Widget และ One-time Public Links
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {embeds.length > 0 && (
                <select
                  value={selectedEmbed?.id || ""}
                  onChange={(e) => {
                    const found = embeds.find((item) => item.id === e.target.value);
                    if (found) setSelectedEmbed(found);
                  }}
                  className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-teal-600"
                >
                  {embeds.map((em) => (
                    <option key={em.id} value={em.id}>
                      {em.name} ({em.publicCode})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  setEmbedError(null);
                  setIsNewEmbedModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2.5 rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างการเชื่อมต่อใหม่</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column: Live Preview & Code Snippets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Code Snippets & Security Config (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Snippet Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      โค้ดสำหรับนำไปฝังบนเว็บไซต์ (Embed Snippet)
                    </h3>
                    <p className="text-xs text-slate-500">
                      รหัส Publication ID: <code className="font-mono text-teal-700 font-bold">{activeEmbedId}</code>
                    </p>
                  </div>
                  {selectedEmbed && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRotateEmbedCode(selectedEmbed.id)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                        title="หมุนเวียนรหัส Embed เมื่อกังวลเรื่องความปลอดภัย"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Rotate ID
                      </button>
                    </div>
                  )}
                </div>

                {/* Option 1: Inline Iframe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-teal-600" />
                      1. ฝังแบบ Inline iframe (มาตรฐานปลอดภัยสูง)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inlineIframeSnippet, "iframe")}
                      className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1"
                    >
                      {copiedSnippet === "iframe" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> คัดลอกแล้ว!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> คัดลอกโค้ด
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {inlineIframeSnippet}
                  </pre>
                </div>

                {/* Option 2: JS Widget Inline */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      2. JavaScript Widget (Inline ปรับความสูงอัตโนมัติ)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inlineWidgetSnippet, "widget_inline")}
                      className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1"
                    >
                      {copiedSnippet === "widget_inline" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> คัดลอกแล้ว!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> คัดลอกโค้ด
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {inlineWidgetSnippet}
                  </pre>
                </div>

                {/* Option 3: JS Widget Dialog Button */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      3. JavaScript Widget (ปุ่ม Modal Dialog + Accessible ESC)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(dialogWidgetSnippet, "widget_dialog")}
                      className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1"
                    >
                      {copiedSnippet === "widget_dialog" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> คัดลอกแล้ว!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> คัดลอกโค้ด
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-purple-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {dialogWidgetSnippet}
                  </pre>
                </div>

                {/* Option 4: Public URL */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                      4. ลิงก์ตรงหน้าประเมินแบบเต็มจอ (Direct Public Link)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(publicLinkUrl, "link")}
                      className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1"
                    >
                      {copiedSnippet === "link" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> คัดลอกแล้ว!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> คัดลอก URL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publicLinkUrl}
                      className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                    />
                    <a
                      href={publicLinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-xl"
                      title="เปิดดูในแท็บใหม่"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Security & CSP Guidelines Card */}
              <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>คำแนะนำด้านความปลอดภัยและการตั้งค่า CSP (Content Security Policy)</span>
                </div>
                <div className="text-slate-600 leading-relaxed space-y-2">
                  <p>
                    • ระบบจะส่ง Header <code>Content-Security-Policy: frame-ancestors &apos;self&apos; ...</code> ตามรายการ <strong>Allowed Origins</strong> ที่ท่านกำหนด เพื่อป้องกันการถูกนำ iframe ไปใส่ในเว็บไซต์ที่ไม่ได้รับอนุญาต (Clickjacking Protection)
                  </p>
                  <p>
                    • สำหรับเว็บมาสเตอร์ของเว็บไซต์ที่นำ iframe ไปฝัง สามารถเพิ่ม Directive ใน CSP ของเว็บไซต์ตนเองได้ดังนี้:
                  </p>
                  <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                    frame-src &apos;self&apos; {appBaseUrl};
                  </pre>
                  <p>
                    • <strong>Privacy by Design:</strong> ตัว Widget ไม่มีการอ่าน Cookie หรือ LocalStorage ของเว็บไซต์เจ้าบ้าน และการส่ง Event สำเร็จ (<code>tomvisfeedback:submitted</code>) จะส่งเฉพาะเวลาและรหัส Publication โดย<strong>ไม่มีการส่งคะแนนหรือข้อความความคิดเห็น</strong> เพื่อรักษาความเป็นส่วนตัวของผู้ตอบ
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Eye className="w-4 h-4 text-teal-700" />
                    <span>ตัวอย่างผลลัพธ์จริง (Live Preview)</span>
                  </div>

                  {/* Responsive Viewport Buttons */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewWidth(360)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        previewWidth === 360
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="หน้าจอมือถือเล็ก (360px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> 360
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewWidth(390)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        previewWidth === 390
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="หน้าจอมือถือมาตรฐาน (390px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> 390
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewWidth(768)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        previewWidth === 768
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="แท็บเล็ต / จอกว้าง (768px)"
                    >
                      <Tablet className="w-3.5 h-3.5" /> 768
                    </button>
                  </div>
                </div>

                {/* Preview Frame Container */}
                <div className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex justify-center overflow-x-auto min-h-[460px]">
                  <div
                    style={{ width: `${previewWidth}px`, maxWidth: "100%" }}
                    className="bg-white rounded-2xl border border-slate-300/80 shadow-md overflow-hidden transition-all duration-300"
                  >
                    {/* Simulated Browser Bar */}
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      </div>
                      <span className="truncate">https://your-website.com/service</span>
                    </div>

                    {/* Embed Iframe */}
                    <iframe
                      src={`${appBaseUrl}/embed/${activeEmbedId}`}
                      title="Preview Embed"
                      className="w-full border-0 min-h-[420px]"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center">
                  * ตัวอย่างเรนเดอร์ผ่าน Dynamic Iframe ตามขนาดจริงของหน้าจอ
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVER-TO-SERVER API KEYS */}
      {activeTab === "API_KEYS" && (
        <div className="space-y-6">
          {/* Header & Create Button */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  จัดการ Server-to-Server API Keys
                </h2>
                <p className="text-xs text-slate-500">
                  สร้างและเพิกถอนกุญแจ API สำหรับเชื่อมต่อระบบหลังบ้าน (เช่น ระบบเวชระเบียน HIS หรือ CRM)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setKeyError(null);
                setIsNewKeyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>สร้าง API Key ใหม่</span>
            </button>
          </div>

          {/* API Keys Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              รายชื่อ API Keys ทั้งหมด ({apiKeys.length})
            </h3>

            {apiKeys.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                ยังไม่มีการสร้าง API Key สำหรับองค์กรนี้
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">ชื่อ / ระบบที่เชื่อมต่อ</th>
                      <th className="py-2.5 px-3">Key Prefix</th>
                      <th className="py-2.5 px-3">สิทธิ์การเข้าถึง (Scopes)</th>
                      <th className="py-2.5 px-3">ใช้งานล่าสุด</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{k.name}</span>
                          <span className="text-[10px] text-slate-400">
                            สร้างเมื่อ: {new Date(k.createdAt).toLocaleDateString("th-TH")}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-900">
                          {k.keyPrefix}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {k.scopes.map((sc) => (
                              <span
                                key={sc}
                                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-semibold"
                              >
                                {sc}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {k.lastUsedAt
                            ? new Date(k.lastUsedAt).toLocaleString("th-TH")
                            : "ยังไม่เคยเรียกใช้งาน"}
                        </td>
                        <td className="py-3 px-3">
                          {k.isRevoked ? (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                              เพิกถอนแล้ว (REVOKED)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              ใช้งานได้ปกติ (ACTIVE)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          {!k.isRevoked && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRotateApiKey(k.id)}
                                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors"
                                title="หมุนเวียนคีย์ใหม่และยกเลิกคีย์เดิม"
                              >
                                Rotate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeApiKey(k.id)}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition-colors"
                              >
                                เพิกถอน
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Logs for Integrations */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              ประวัติความปลอดภัยและการจัดการเชื่อมต่อ (Integration Audit Trail)
            </h3>
            <p className="text-xs text-slate-400">
              บันทึกกิจกรรมการสร้าง, หมุนเวียน, และการเรียกใช้งาน API โดยไม่มีการเปิดเผยข้อมูลส่วนบุคคลของผู้ตอบ
            </p>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">เวลา</th>
                    <th className="py-2.5 px-3">กิจกรรม (Action)</th>
                    <th className="py-2.5 px-3">ผู้ดำเนินการ</th>
                    <th className="py-2.5 px-3">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        ยังไม่มีประวัติกิจกรรมการเชื่อมต่อ
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleString("th-TH")}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">
                          {log.userEmail || "System/API"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                          {typeof log.details === "object"
                            ? JSON.stringify(log.details)
                            : log.details || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTATION & OPENAPI */}
      {activeTab === "DOCS" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                คู่มือการเชื่อมต่อระบบและตัวอย่างโค้ด (Developer API Documentation)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                เชื่อมต่อระบบประเมินความพึงพอใจเข้ากับระบบสารสนเทศโรงพยาบาล (HIS), ERP หรือ Line OA ด้วยสถาปัตยกรรม REST API
              </p>
            </div>

            {/* Quick Flow Guide */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 space-y-2">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <span className="font-bold text-slate-800 block">สร้าง Invitation</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  เมื่อคนไข้/ลูกค้าตรวจเสร็จ HIS ยิง POST มาที่ <code>/api/v1/invitations</code>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 space-y-2">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <span className="font-bold text-slate-800 block">ส่งต่อลิงก์ประเมิน</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  ส่ง <code>invitationUrl</code> ให้ผู้รับบริการผ่าน SMS, Line หรือพิมพ์ลงใบเสร็จรับเงิน
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 space-y-2">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <span className="font-bold text-slate-800 block">ผู้รับบริการให้คะแนน</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  เปิดหน้าเว็บประเมินรูปดาว 1–5 และข้อเสนอแนะ ใช้งานง่ายบนมือถือ ลิงก์จะใช้ได้ครั้งเดียว
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 space-y-2">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  4
                </span>
                <span className="font-bold text-slate-800 block">ดึงสถิติ Dashboard</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  ดึงสรุปผล CSAT และ NPS ไปแสดงผลบนระบบบริหารของโรงพยาบาลผ่าน <code>/api/v1/reports/summary</code>
                </p>
              </div>
            </div>

            {/* Code Examples */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                ตัวอย่างการเรียกสร้างคำเชิญ (Create One-time Invitation Example)
              </h3>

              {/* cURL Example */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700">cURL (Command Line)</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`curl -X POST "${appBaseUrl}/api/v1/invitations" \\
  -H "Authorization: Bearer $PDH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: visit-202610-00123" \\
  -d '{
    "publicationId": "${activeEmbedId}",
    "expiresInDays": 7,
    "externalReference": "ref_queue_98234"
  }'`}
                </pre>
              </div>

              {/* Node.js / Next.js Fetch Example */}
              <div className="space-y-1.5 text-xs pt-2">
                <span className="font-bold text-slate-700">Node.js / Next.js Server Route</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`// Server-side call (Never expose API Key to browser!)
const response = await fetch("${appBaseUrl}/api/v1/invitations", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.PDH_API_KEY}\`,
    "Content-Type": "application/json",
    "Idempotency-Key": visitId,
  },
  body: JSON.stringify({
    publicationId: "${activeEmbedId}",
    expiresInDays: 7,
    externalReference: "queue_token_abc123"
  }),
});

const data = await response.json();
console.log("Send this link via SMS/Line:", data.invitationUrl);`}
                </pre>
              </div>

              {/* PHP cURL Example */}
              <div className="space-y-1.5 text-xs pt-2">
                <span className="font-bold text-slate-700">PHP (HIS / CRM Integration)</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-purple-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`$apiKey = getenv('PDH_API_KEY');
$ch = curl_init('${appBaseUrl}/api/v1/invitations');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'Idempotency-Key: ' . $uniqueVisitId
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'publicationId' => '${activeEmbedId}',
        'expiresInDays' => 7,
        'externalReference' => $opaqueRef
    ])
]);
$result = json_decode(curl_exec($ch), true);
curl_close($ch);`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Embed Publication */}
      {isNewEmbedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 space-y-5">
            <button
              onClick={() => setIsNewEmbedModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  สร้างการเชื่อมต่อ Embed ใหม่
                </h3>
                <p className="text-xs text-slate-500">
                  กำหนดแบบประเมิน รูปแบบการแสดงผล และรายชื่อเว็บไซต์ที่อนุญาต
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateEmbed} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อการเชื่อมต่อ (Embed Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEmbedName}
                  onChange={(e) => setNewEmbedName(e.target.value)}
                  placeholder="เช่น เว็บไซต์หลักโรงพยาบาล, ระบบจองคิวออนไลน์"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เลือกแบบประเมิน (Survey Version) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSurveyVersionId}
                  onChange={(e) => setSelectedSurveyVersionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
                >
                  {surveys.flatMap((s) =>
                    s.publishedVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {s.title} (เวอร์ชัน {v.versionNumber})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จุดบริการที่ผูก (Service Point)
                </label>
                <select
                  value={selectedServicePointId}
                  onChange={(e) => setSelectedServicePointId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
                >
                  <option value="">ทุกจุดบริการ (ตามที่แบบประเมินกำหนด)</option>
                  {servicePoints.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รูปแบบการแสดงผล (Display Style)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 ${
                      embedDisplayMode === "INLINE_IFRAME"
                        ? "border-teal-600 bg-teal-50/50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="displayMode"
                      value="INLINE_IFRAME"
                      checked={embedDisplayMode === "INLINE_IFRAME"}
                      onChange={() => setEmbedDisplayMode("INLINE_IFRAME")}
                      className="sr-only"
                    />
                    <span className="font-bold text-slate-800">Inline iframe</span>
                    <span className="text-[10px] text-slate-500">ฝังในเนื้อหาหน้าเว็บ</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 ${
                      embedDisplayMode === "JS_WIDGET"
                        ? "border-teal-600 bg-teal-50/50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="displayMode"
                      value="JS_WIDGET"
                      checked={embedDisplayMode === "JS_WIDGET"}
                      onChange={() => setEmbedDisplayMode("JS_WIDGET")}
                      className="sr-only"
                    />
                    <span className="font-bold text-slate-800">JavaScript Widget</span>
                    <span className="text-[10px] text-slate-500">ปุ่มเปิดหน้าต่าง Dialog</span>
                  </label>
                </div>
              </div>

              {embedDisplayMode === "JS_WIDGET" && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ข้อความบนปุ่ม</label>
                    <input
                      type="text"
                      value={widgetButtonText}
                      onChange={(e) => setWidgetButtonText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">สีของปุ่ม</label>
                    <div className="flex items-center gap-2">
                      {["#0f766e", "#4338ca", "#059669", "#d97706", "#e11d48", "#1e293b"].map(
                        (c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setWidgetThemeColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              widgetThemeColor === c ? "scale-110 border-white shadow-md ring-2 ring-teal-500" : "border-transparent"
                            }`}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Allowed Origins Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  รายชื่อเว็บไซต์ที่อนุญาต (Allowed Origins)
                </label>
                <p className="text-[11px] text-slate-400">
                  ต้องระบุเป็น Exact Origin เช่น <code>https://yourdomain.com</code> หรือ <code>http://localhost:3000</code>
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allowedOriginsInput}
                    onChange={(e) => setAllowedOriginsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOrigin();
                      }
                    }}
                    placeholder="https://yourhospital.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddOrigin}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0"
                  >
                    เพิ่ม
                  </button>
                </div>

                {allowedOriginsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allowedOriginsList.map((origin, index) => (
                      <span
                        key={origin}
                        className="inline-flex items-center gap-1 text-[11px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full"
                      >
                        {origin}
                        <button
                          type="button"
                          onClick={() => handleRemoveOrigin(index)}
                          className="hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {embedError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                  {embedError}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEmbedModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmbed}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingEmbed ? "กำลังบันทึก..." : "ยืนยันและสร้างโค้ด"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New API Key */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 space-y-5">
            <button
              onClick={() => setIsNewKeyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">สร้าง API Key ใหม่</h3>
                <p className="text-xs text-slate-500">
                  กำหนดชื่อระบบและสิทธิ์การเข้าถึง (Scopes) ตามหลัก Least Privilege
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อระบบ / วัตถุประสงค์ (Key Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="เช่น Hospital HIS Outpatient Registration"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  สิทธิ์การเข้าถึง (Scopes) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {ALL_API_SCOPES.map((sc) => (
                    <label
                      key={sc.id}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-colors ${
                        selectedScopes.includes(sc.id)
                          ? "bg-indigo-50/60 border-indigo-400 text-indigo-950"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(sc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScopes([...selectedScopes, sc.id]);
                          } else {
                            setSelectedScopes(selectedScopes.filter((s) => s !== sc.id));
                          }
                        }}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold block">{sc.label} (<code>{sc.id}</code>)</span>
                        <span className="text-[11px] text-slate-500">{sc.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จำกัดจุดบริการ (Service Point Scope)
                </label>
                <select
                  value={keyServicePointId}
                  onChange={(e) => setKeyServicePointId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">เข้าถึงได้ทุกจุดบริการขององค์กร</option>
                  {servicePoints.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">วันหมดอายุ</label>
                <select
                  value={keyExpiresInDays === null ? "never" : keyExpiresInDays}
                  onChange={(e) =>
                    setKeyExpiresInDays(e.target.value === "never" ? null : parseInt(e.target.value))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="365">1 ปี (แนะนำ)</option>
                  <option value="90">90 วัน</option>
                  <option value="30">30 วัน</option>
                  <option value="never">ไม่มีวันหมดอายุ (ต้องเพิกถอนด้วยตนเอง)</option>
                </select>
              </div>

              {keyError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                  {keyError}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKey}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingKey ? "กำลังสร้าง..." : "สร้างและรับกุญแจ API"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Show Newly Created API Key (SHOW ONCE!) */}
      {createdKeyRaw && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                API Key สำหรับ: {createdKeyName}
              </h3>
              <p className="text-xs text-amber-800 font-semibold mt-1">
                ⚠️ คำเตือนสำคัญ: ระบบจะแสดง API Key เต็มนี้เพียงครั้งเดียวเท่านั้น กรุณาคัดลอกและจัดเก็บไว้ใน Secret Manager หรือ Environment Variable ฝั่งเซิร์ฟเวอร์ทันที
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-teal-300 font-mono text-xs flex items-center justify-between gap-3 border border-slate-800">
              <span className="truncate select-all">{createdKeyRaw}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(createdKeyRaw, "rawKey")}
                className="shrink-0 text-white hover:text-teal-200 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl flex items-center gap-1 font-sans text-xs font-bold"
              >
                {copiedSnippet === "rawKey" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> คัดลอก
                  </>
                )}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCreatedKeyRaw(null)}
                className="w-full py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all text-xs"
              >
                ฉันได้บันทึก API Key นี้อย่างปลอดภัยแล้ว (ปิดหน้าต่าง)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
