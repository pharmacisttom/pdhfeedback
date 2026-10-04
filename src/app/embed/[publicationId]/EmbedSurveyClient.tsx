"use client";

import React, { useState, useEffect, useRef } from "react";
import { Star, CheckCircle2, AlertCircle, Heart, MessageSquare, Send } from "lucide-react";

interface QuestionOption {
  id: string;
  optionText: string;
  optionValue: string;
  displayOrder: number;
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  helpText?: string | null;
  isRequired: boolean;
  displayOrder: number;
  options: QuestionOption[];
}

interface EmbedProps {
  publicationId: string;
  publicCode: string;
  parentOrigin?: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  servicePoint?: {
    id: string;
    name: string;
    code: string;
  } | null;
  surveyVersion: {
    id: string;
    title: string;
    description?: string | null;
    thankYouTitle: string;
    thankYouMessage: string;
    allowComments: boolean;
    questions: Question[];
  };
  widgetConfig?: {
    buttonText?: string;
    themeColor?: string;
    language?: string;
    dialogTitle?: string;
  };
  hidePoweredBy?: boolean;
}

export default function EmbedSurveyClient({
  publicationId,
  publicCode,
  parentOrigin,
  organization,
  servicePoint,
  surveyVersion,
  widgetConfig,
  hidePoweredBy = false,
}: EmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const themeColor = widgetConfig?.themeColor || "#0f766e"; // teal-700 default

  // Helper to post safe messages to parent window
  const postToParent = (type: string, payload: Record<string, any> = {}) => {
    if (typeof window === "undefined" || window.parent === window) return;

    const message = {
      type: `pdhfeedback:${type}`,
      publicationId: publicCode || publicationId,
      ...payload,
    };

    // Use specific parentOrigin if provided and valid, otherwise fallback safely
    const target = parentOrigin && parentOrigin.startsWith("http") ? parentOrigin : "*";
    try {
      window.parent.postMessage(message, target);
    } catch (e) {
      console.warn("postMessage dispatch failed:", e);
    }
  };

  // 1. Notify parent window on mount: "ready"
  useEffect(() => {
    postToParent("ready");
  }, []);

  // 2. Observe height changes and post debounced "resize" to parent
  useEffect(() => {
    if (!containerRef.current) return;

    let resizeTimer: any = null;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.ceil(entry.contentRect.height + 32); // add padding buffer
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          postToParent("resize", { height });
        }, 50);
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [isSubmitted, rating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setErrorMsg("กรุณาเลือกคะแนนความพึงพอใจ 1–5 ดาว");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        ...(typeof val === "number" ? { ratingValue: val } : {}),
        ...(typeof val === "string" ? { textValue: val } : {}),
        ...(Array.isArray(val) ? { selectedOptions: JSON.stringify(val) } : {}),
      }));

      const res = await fetch(`/api/v1/public/surveys/${publicCode}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating: rating,
          commentText: comment.trim() || undefined,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "บันทึกคำตอบไม่สำเร็จ");
      }

      setIsSubmitted(true);
      // Notify parent: "submitted" (NO PII, score, or comments included!)
      postToParent("submitted", { timestamp: Date.now() });
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการส่งคำตอบ");
      postToParent("error", { code: "SUBMISSION_FAILED" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const starLabels = ["ต้องปรับปรุง", "พอใช้", "ปานกลาง", "ดี", "ดีมาก"];

  return (
    <div
      ref={containerRef}
      className="w-full max-w-lg mx-auto p-4 sm:p-6 font-sans text-slate-800 bg-white"
    >
      {/* Header */}
      <div className="text-center mb-6">
        {organization.logoUrl && (
          <div className="mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={organization.logoUrl}
              alt={organization.name}
              className="h-10 mx-auto object-contain"
            />
          </div>
        )}
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {surveyVersion.title}
        </h2>
        {servicePoint && (
          <span className="inline-block mt-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
            จุดบริการ: {servicePoint.name}
          </span>
        )}
        {surveyVersion.description && (
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {surveyVersion.description}
          </p>
        )}
      </div>

      {isSubmitted ? (
        /* Thank You View */
        <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {surveyVersion.thankYouTitle}
          </h3>
          <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            {surveyVersion.thankYouMessage}
          </p>
          <div className="pt-2 text-[11px] text-slate-400">
            ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการพัฒนาบริการของเรา
          </div>
        </div>
      ) : (
        /* Survey Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall 1-5 Star Rating */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 text-center space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              ความพึงพอใจโดยรวมในการรับบริการ <span className="text-rose-500">*</span>
            </label>

            {/* Stars Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating || 0) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setErrorMsg(null);
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-xl transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label={`ให้ ${star} ดาว (${starLabels[star - 1]})`}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                        active
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "text-slate-300 fill-slate-100 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Rating Description Label */}
            <div className="h-4 text-xs font-bold text-teal-800 transition-all">
              {(hoverRating || rating) ? starLabels[(hoverRating || rating)! - 1] : ""}
            </div>
          </div>

          {/* Additional Survey Questions (if defined in survey version) */}
          {surveyVersion.questions
            .filter((q) => q.type !== "RATING_1_5")
            .map((q) => (
              <div key={q.id} className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">
                  {q.questionText} {q.isRequired && <span className="text-rose-500">*</span>}
                </label>
                {q.helpText && <p className="text-[11px] text-slate-400">{q.helpText}</p>}

                {q.type === "SINGLE_CHOICE" && (
                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          answers[q.id] === opt.optionValue
                            ? "bg-teal-50/60 border-teal-500 text-teal-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.optionValue}
                          checked={answers[q.id] === opt.optionValue}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>{opt.optionText}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "SHORT_TEXT" && (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="พิมพ์คำตอบของคุณ..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                )}
              </div>
            ))}

          {/* Feedback & Suggestion Comments */}
          {surveyVersion.allowComments && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>ข้อเสนอแนะเพิ่มเติมเพื่อการปรับปรุง (ไม่บังคับ)</span>
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ระบุข้อเสนอแนะ ข้อคิดเห็น หรือสิ่งที่ต้องการให้พัฒนา..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 resize-none transition-colors"
                maxLength={1000}
              />
              <div className="text-right text-[10px] text-slate-400">
                {comment.length} / 1000 ตัวอักษร
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !rating}
            style={{ backgroundColor: themeColor }}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "กำลังส่งคำตอบ..." : "ส่งแบบประเมิน"}</span>
          </button>
        </form>
      )}

      {/* Powered by Tomvis Footer */}
      {!hidePoweredBy && (
        <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Powered by <strong className="text-slate-500">PdhFeedback</strong>
        </div>
      )}
    </div>
  );
}
