"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95"
    >
      <Printer className="w-3.5 h-3.5" />
      พิมพ์ป้ายตั้งโต๊ะ
    </button>
  );
}
