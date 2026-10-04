"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Star,
  Smile,
  Phone,
  User,
  Clock,
  Building2,
  MapPin,
} from "lucide-react";

interface QuestionOption {
  id: string;
  optionText: string;
  optionValue: string;
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  helpText?: string | null;
  isRequired: boolean;
  isOverallCSAT: boolean;
  minChars?: number | null;
  maxChars?: number | null;
  options: QuestionOption[];
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  logoUrl?: string | null;
}

interface ServicePoint {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

interface SurveyVersion {
  id: string;
  title: string;
  description?: string | null;
  thankYouTitle: string;
  thankYouMessage: string;
  allowComments: boolean;
  allowContactRequest: boolean;
  questions: Question[];
}

interface Props {
  publicCode: string;
  organization: Organization;
  servicePoint?: ServicePoint | null;
  surveyVersion: SurveyVersion;
  invitationToken?: string;
  isKioskMode?: boolean;
  hidePoweredBy?: boolean;
}

const RATING_LABELS: Record<number, { th: string; color: string; desc: string }> = {
  1: { th: "ปรับปรุง", color: "text-red-500 border-red-200 hover:bg-red-50", desc: "1 = ควรปรับปรุง" },
  2: { th: "พอใช้", color: "text-amber-500 border-amber-200 hover:bg-amber-50", desc: "2 = พอใช้" },
  3: { th: "ปานกลาง", color: "text-yellow-500 border-yellow-200 hover:bg-yellow-50", desc: "3 = ปานกลาง" },
  4: { th: "ดี", color: "text-teal-600 border-teal-200 hover:bg-teal-50", desc: "4 = ดี" },
  5: { th: "ดีมาก", color: "text-emerald-600 border-emerald-200 hover:bg-emerald-50", desc: "5 = ดีมาก" },
};

export default function RespondentSurveyClient({
  publicCode,
  organization,
  servicePoint,
  surveyVersion,
  invitationToken,
  isKioskMode,
  hidePoweredBy = false,
}: Props) {
  // Idempotency key per session load
  const [idempotencyKey] = useState<string>(() => {
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  });

  // Answers map: { [questionId]: { ratingValue?, textValue?, booleanValue?, selectedOptions? } }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [commentText, setCommentText] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Contact info
  const [wantContact, setWantContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  // UI state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [thankYouInfo, setThankYouInfo] = useState({
    title: surveyVersion.thankYouTitle,
    message: surveyVersion.thankYouMessage,
  });

  // Kiosk countdown
  const [countdown, setCountdown] = useState(15);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (submitSuccess && isKioskMode) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleReset();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [submitSuccess, isKioskMode]);

  const handleReset = () => {
    setAnswers({});
    setCommentText("");
    setWantContact(false);
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setPreferredTime("");
    setValidationErrors({});
    setSubmitSuccess(false);
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ratingValue: rating,
      },
    }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleBooleanChange = (questionId: string, val: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        booleanValue: val,
      },
    }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleSingleChoiceChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptions: [val],
      },
    }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        textValue: text,
      },
    }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    let firstMissingId: string | null = null;

    for (const q of surveyVersion.questions) {
      if (q.isRequired) {
        const ans = answers[q.id];
        let hasAnswer = false;
        if (q.type.startsWith("RATING_") || q.type === "NPS_0_10") {
          hasAnswer = typeof ans?.ratingValue === "number";
        } else if (q.type === "YES_NO") {
          hasAnswer = typeof ans?.booleanValue === "boolean";
        } else if (q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") {
          hasAnswer = Array.isArray(ans?.selectedOptions) && ans.selectedOptions.length > 0;
        } else if (q.type === "SHORT_TEXT" || q.type === "LONG_TEXT") {
          hasAnswer = Boolean(ans?.textValue && ans.textValue.trim().length > 0);
        }

        if (!hasAnswer) {
          errors[q.id] = "กรุณาตอบคำถามข้อนี้";
          if (!firstMissingId) firstMissingId = q.id;
        }
      }
    }

    if (wantContact && !contactPhone && !contactEmail) {
      errors["contact_info"] = "กรุณาระบุเบอร์โทรศัพท์หรืออีเมลสำหรับติดต่อกลับ";
      if (!firstMissingId) firstMissingId = "contact_info";
    }

    setValidationErrors(errors);

    if (firstMissingId) {
      const el = questionRefs.current[firstMissingId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus?.();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        ratingValue: ans.ratingValue ?? null,
        textValue: ans.textValue ?? null,
        booleanValue: ans.booleanValue ?? null,
        selectedOptions: ans.selectedOptions ?? null,
      }));

      const res = await fetch("/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicCode,
          idempotencyKey,
          answers: payloadAnswers,
          commentText: commentText || null,
          contact: wantContact
            ? {
                name: contactName || null,
                phone: contactPhone || null,
                email: contactEmail || null,
                preferredTime: preferredTime || null,
                consentGiven: true,
              }
            : null,
          honeypot: honeypot || null,
          invitationToken: invitationToken || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการส่งคำตอบ");
      }

      setSubmitSuccess(true);
      setThankYouInfo({
        title: data.thankYouTitle || surveyVersion.thankYouTitle,
        message: data.thankYouMessage || surveyVersion.thankYouMessage,
      });

      // Launch celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err.message || "ไม่สามารถส่งแบบประเมินได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate completion progress
  const answeredCount = Object.keys(answers).filter((k) => {
    const a = answers[k];
    return a.ratingValue !== undefined || a.booleanValue !== undefined || a.textValue !== undefined || (a.selectedOptions && a.selectedOptions.length > 0);
  }).length;
  const progressPct = Math.min(100, Math.round((answeredCount / Math.max(1, surveyVersion.questions.length)) * 100));

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/70 via-slate-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-teal-100/80 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-3">{thankYouInfo.title}</h2>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            {thankYouInfo.message}
          </p>

          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-xs text-slate-500 mb-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>คำตอบของท่านถูกบันทึกเรียบร้อย ปลอดภัยและไม่ระบุตัวตน</span>
          </div>

          {isKioskMode ? (
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-3">
                หน้านี้จะรีเซ็ตอัตโนมัติสำหรับผู้รับบริการท่านถัดไปในอีก{" "}
                <span className="font-bold text-teal-700 text-sm">{countdown}</span> วินาที
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm transition-all shadow-md active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                เริ่มทำแบบประเมินสำหรับคนต่อไปทันที
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-teal-700 hover:text-teal-800 font-medium underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ตอบแบบประเมินอีกครั้ง
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Mobile App Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              {organization.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 truncate leading-tight">
                {organization.name}
              </h1>
              {servicePoint && (
                <p className="text-xs text-teal-700 font-medium truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {servicePoint.name}
                </p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {answeredCount}/{surveyVersion.questions.length} ข้อ
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-gradient-to-r from-teal-600 to-emerald-500 h-1 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-xl mx-auto px-4 pt-5 pb-20">
        {/* Survey Banner Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-5">
          <h2 className="text-lg font-bold text-slate-800 leading-snug mb-1">
            {surveyVersion.title}
          </h2>
          {surveyVersion.description && (
            <p className="text-xs text-slate-500 leading-relaxed">
              {surveyVersion.description}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>ใช้เวลาตอบประมาณ 30 - 60 วินาที • ข้อมูลปลอดภัย</span>
          </div>
        </div>

        {submitError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">ไม่สามารถส่งข้อมูลได้</p>
              <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot field (hidden from real users, lures spam bots) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {surveyVersion.questions.map((q, idx) => {
              const hasError = Boolean(validationErrors[q.id]);
              const currentAns = answers[q.id];

              return (
                <div
                  key={q.id}
                  id={`q-${q.id}`}
                  ref={(el) => {
                    questionRefs.current[q.id] = el;
                  }}
                  tabIndex={-1}
                  className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs ${
                    hasError
                      ? "border-red-400 ring-2 ring-red-100 bg-red-50/20"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <label className="text-sm font-bold text-slate-800 leading-snug">
                      <span className="text-teal-700 font-semibold mr-1.5">{idx + 1}.</span>
                      {q.questionText}
                      {q.isRequired && (
                        <span className="text-red-500 ml-1 font-semibold" title="จำเป็นต้องตอบ">
                          *
                        </span>
                      )}
                    </label>
                  </div>

                  {q.helpText && (
                    <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                      {q.helpText}
                    </p>
                  )}

                  {/* Render based on Question Type */}
                  {/* 1. Rating 1-5 (Stars or Standard) */}
                  {(q.type === "RATING_1_5" || q.type === "RATING_SMILEY_1_5") && (
                    <div className="mt-2">
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => {
                          const isSelected = currentAns?.ratingValue === score;
                          const meta = RATING_LABELS[score];
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleRatingChange(q.id, score)}
                              className={`min-h-[56px] py-2 px-1 flex flex-col items-center justify-center rounded-xl border font-medium transition-all duration-150 active:scale-95 ${
                                isSelected
                                  ? "bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-200 scale-102"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                              }`}
                              aria-label={meta.desc}
                            >
                              <div className="flex items-center justify-center mb-0.5">
                                {q.type === "RATING_SMILEY_1_5" ? (
                                  <Smile className={`w-5 h-5 ${isSelected ? "text-white" : meta.color.split(" ")[0]}`} />
                                ) : (
                                  <Star
                                    className={`w-5 h-5 ${
                                      isSelected
                                        ? "fill-white text-white"
                                        : "fill-amber-300 text-amber-400"
                                    }`}
                                  />
                                )}
                              </div>
                              <span className="text-xs font-bold leading-none mb-0.5">{score}</span>
                              <span className={`text-[10px] leading-tight ${isSelected ? "text-teal-100" : "text-slate-400"}`}>
                                {meta.th}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
                        <span>1 = ควรปรับปรุง</span>
                        <span>5 = ดีมากที่สุด</span>
                      </div>
                    </div>
                  )}

                  {/* 2. NPS 0-10 Scale */}
                  {q.type === "NPS_0_10" && (
                    <div className="mt-2">
                      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                          const isSelected = currentAns?.ratingValue === score;
                          const isPromoter = score >= 9;
                          const isPassive = score >= 7 && score <= 8;
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleRatingChange(q.id, score)}
                              className={`min-h-[46px] rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all duration-150 active:scale-95 ${
                                isSelected
                                  ? isPromoter
                                    ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200"
                                    : isPassive
                                    ? "bg-amber-500 text-white border-amber-500 ring-2 ring-amber-200"
                                    : "bg-red-500 text-white border-red-500 ring-2 ring-red-200"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                              aria-label={`คะแนนความน่าจะแนะนำ ${score} จาก 10`}
                            >
                              <span>{score}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
                        <span>0 = ไม่แนะนำเลย</span>
                        <span>10 = แนะนำแน่นอน</span>
                      </div>
                    </div>
                  )}

                  {/* 3. Yes/No */}
                  {q.type === "YES_NO" && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[
                        { label: "ใช่ / มี", val: true },
                        { label: "ไม่ใช่ / ไม่มี", val: false },
                      ].map((item) => {
                        const isSelected = currentAns?.booleanValue === item.val;
                        return (
                          <button
                            key={String(item.val)}
                            type="button"
                            onClick={() => handleBooleanChange(q.id, item.val)}
                            className={`min-h-[48px] rounded-xl border text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-teal-700 text-white border-teal-700 ring-2 ring-teal-200"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. Single Choice */}
                  {q.type === "SINGLE_CHOICE" && (
                    <div className="space-y-2 mt-2">
                      {q.options.map((opt) => {
                        const isSelected = currentAns?.selectedOptions?.[0] === opt.optionValue;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSingleChoiceChange(q.id, opt.optionValue)}
                            className={`w-full min-h-[46px] text-left px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                              isSelected
                                ? "bg-teal-50/80 border-teal-600 text-teal-900 ring-1 ring-teal-600"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{opt.optionText}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? "border-teal-700 bg-teal-700" : "border-slate-300"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 5. Short/Long Text */}
                  {(q.type === "SHORT_TEXT" || q.type === "LONG_TEXT") && (
                    <div className="mt-2">
                      {q.type === "SHORT_TEXT" ? (
                        <input
                          type="text"
                          value={currentAns?.textValue || ""}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          placeholder="พิมพ์ข้อความที่นี่..."
                          className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                        />
                      ) : (
                        <textarea
                          rows={3}
                          value={currentAns?.textValue || ""}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          placeholder="พิมพ์ข้อเสนอแนะของท่านที่นี่..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                        />
                      )}
                    </div>
                  )}

                  {hasError && (
                    <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {validationErrors[q.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Additional Comments Section (if enabled and not redundant) */}
          {surveyVersion.allowComments && (
            <div className="mt-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <label htmlFor="general-comment" className="block text-sm font-bold text-slate-800 mb-1">
                ข้อเสนอแนะเพิ่มเติมเพื่อการปรับปรุงบริการ (ถ้ามี)
              </label>
              <div className="text-[11px] text-amber-600 bg-amber-50/80 border border-amber-200/70 p-2.5 rounded-xl mb-3 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  กรุณาไม่ระบุเลขบัตรประชาชน ข้อมูลสุขภาพ หรือข้อมูลส่วนบุคคลของผู้อื่น
                </span>
              </div>
              <textarea
                id="general-comment"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="มีสิ่งใดที่เราสามารถทำให้ท่านพึงพอใจมากยิ่งขึ้น..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Callback Request (Optional, off by default, separated consent) */}
          {surveyVersion.allowContactRequest && (
            <div
              id="contact_info"
              ref={(el) => {
                questionRefs.current["contact_info"] = el;
              }}
              className="mt-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    ต้องการให้เจ้าหน้าที่ติดต่อกลับหรือไม่?
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตอบโดยไม่ต้องระบุชื่อได้ (เว้นว่างไว้หากไม่ประสงค์ให้ติดต่อกลับ)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWantContact(!wantContact)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                    wantContact ? "bg-teal-700" : "bg-slate-300"
                  }`}
                  aria-pressed={wantContact}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      wantContact ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {wantContact && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้ติดต่อ (ไม่บังคับ)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="ชื่อ หรือชื่อเล่น"
                        className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="08X-XXX-XXXX"
                        className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ช่วงเวลาที่สะดวกให้ติดต่อกลับ
                    </label>
                    <input
                      type="text"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      placeholder="เช่น ช่วงเช้า 09:00 - 12:00 น."
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  {validationErrors["contact_info"] && (
                    <p className="text-xs text-red-600 font-medium">
                      {validationErrors["contact_info"]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Powered by Tomvis Footer */}
          {!hidePoweredBy && (
            <div className="text-center text-[11px] text-slate-400 py-4 pb-16">
              Powered by <span className="font-semibold text-slate-600">Tomvis</span> • ระบบประเมินความพึงพอใจการบริการ
            </div>
          )}

          {/* Submit Button Bar (Sticky Mobile Touch Friendly) */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
            <div className="max-w-xl mx-auto flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-base transition-all shadow-md active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังส่งแบบประเมิน...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ส่งแบบประเมิน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
