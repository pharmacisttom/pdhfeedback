const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

/**
 * Formats a Date or UTC string to Thai Buddhist Era (พ.ศ.) format.
 * E.g. "4 ต.ค. 2569, 12:45 น."
 */
export function formatThaiDate(
  dateInput: Date | string | number | null | undefined,
  options: { includeTime?: boolean; fullMonth?: boolean } = {}
): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";

  // Convert to Bangkok time (+7 hours offset calculation or Intl)
  const formatter = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: options.fullMonth ? "long" : "short",
    day: "numeric",
    hour: options.includeTime ? "2-digit" : undefined,
    minute: options.includeTime ? "2-digit" : undefined,
    hour12: false,
  });

  const formatted = formatter.format(d);
  return options.includeTime ? `${formatted} น.` : formatted;
}

/**
 * Returns Start and End of day in UTC for a given YYYY-MM-DD in Asia/Bangkok (+07:00).
 */
export function getBangkokDayBoundaries(dateStr: string): { startUtc: Date; endUtc: Date } {
  // dateStr is YYYY-MM-DD
  // 00:00:00 Bangkok is previous day 17:00:00 UTC
  // 23:59:59.999 Bangkok is current day 16:59:59.999 UTC
  const startBangkok = new Date(`${dateStr}T00:00:00+07:00`);
  const endBangkok = new Date(`${dateStr}T23:59:59.999+07:00`);
  return {
    startUtc: startBangkok,
    endUtc: endBangkok,
  };
}

/**
 * Returns date range boundaries for preset filter (e.g. today, 7days, 30days, thisMonth)
 */
export function getDateRangePreset(preset: "today" | "7d" | "30d" | "thisMonth" | "all"): {
  startDate: Date | null;
  endDate: Date | null;
} {
  const now = new Date();
  if (preset === "all") return { startDate: null, endDate: null };

  if (preset === "today") {
    const todayStr = now.toISOString().split("T")[0];
    const { startUtc, endUtc } = getBangkokDayBoundaries(todayStr);
    return { startDate: startUtc, endDate: endUtc };
  }

  if (preset === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now };
  }

  if (preset === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now };
  }

  if (preset === "thisMonth") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: firstDay, endDate: now };
  }

  return { startDate: null, endDate: null };
}
