/**
 * CSV Utilities
 * Functions for CSV formatting and security
 */

/**
 * Sanitize CSV fields against formula injection attacks
 * Prevents Excel from executing formulas by prefixing dangerous characters
 */
export function sanitizeCSVFormula(value: string | null | undefined): string {
  if (!value) return '';

  const str = String(value);
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];

  // If the string starts with a dangerous character, prefix with single quote
  if (dangerousChars.some((char) => str.startsWith(char))) {
    return `'${str}`;
  }

  return str;
}

/**
 * Format array of symptoms for CSV output
 */
export function formatSymptomsForCSV(symptoms: string[] | null): string {
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return 'Yok';
  }

  const sanitizedSymptoms = symptoms.map((symptom) => sanitizeCSVFormula(symptom));
  return sanitizedSymptoms.join(', ');
}

/**
 * Map symptom duration values to Turkish labels
 */
export function mapDurationToTurkish(duration: string | null): string {
  if (!duration) return 'Belirtilmedi';

  const durationMap: Record<string, string> = {
    'less-than-1-day': '1 günden az',
    '1-7-days': '1-7 gün',
    '1-4-weeks': '1-4 hafta',
    '1-6-months': '1-6 ay',
    'more-than-6-months': '6 aydan fazla',
  };

  return durationMap[duration] || duration;
}

/**
 * Escape CSV cell content for proper formatting
 * Handles quotes, commas, and newlines
 */
export function escapeCSVCell(cell: string | number | null | undefined): string {
  const cellStr = String(cell || '');

  // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
  if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
    return `"${cellStr.replace(/"/g, '""')}"`;
  }

  return cellStr;
}

/**
 * Generate CSV content from headers and rows
 * Includes UTF-8 BOM for Turkish character support in Excel
 */
export function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => escapeCSVCell(cell)).join(',')),
  ].join('\n');

  return BOM + csvContent;
}
