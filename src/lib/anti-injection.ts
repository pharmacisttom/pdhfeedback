/**
 * Sanitizes input text against CSV/Excel spreadsheet formula injection.
 * Any string starting with =, +, -, @, or tab/carriage return is prefixed with a single quote (').
 */
export function sanitizeForSpreadsheet(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();

  // If the cell begins with dangerous formula triggers
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }

  return str;
}

/**
 * Formats CSV rows safely with UTF-8 BOM for Thai language compatibility in Microsoft Excel.
 */
export function generateSafeCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const sanitizeCell = (cell: unknown): string => {
    const sanitized = sanitizeForSpreadsheet(cell);
    // Escape quotes and enclose in quotes if contains comma, quote, or newline
    const escaped = sanitized.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const headerLine = headers.map(sanitizeCell).join(",");
  const rowLines = rows.map((r) => r.map(sanitizeCell).join(","));

  // Prepend UTF-8 BOM (\uFEFF) for Excel Thai encoding support
  return "\uFEFF" + [headerLine, ...rowLines].join("\r\n");
}
