/**
 * PDF Utilities
 * Functions for PDF generation and text sanitization
 */

/**
 * Turkish character mappings for PDF compatibility
 * Some PDF fonts don't support Turkish characters, so we map them
 */
const TURKISH_CHAR_MAP: Record<string, string> = {
  ğ: 'g',
  Ğ: 'G',
  ü: 'u',
  Ü: 'U',
  ş: 's',
  Ş: 'S',
  ı: 'i',
  İ: 'I',
  ö: 'o',
  Ö: 'O',
  ç: 'c',
  Ç: 'C',
};

/**
 * Sanitize text for PDF compatibility by removing/replacing Turkish characters
 * This ensures text displays correctly in PDF documents
 */
export function sanitizeTextForPDF(text: string): string {
  if (!text) return '';

  return text.replace(/[ğĞüÜşŞıİöÖçÇ]/g, (match) => TURKISH_CHAR_MAP[match] || match);
}

/**
 * Format date for PDF display
 */
export function formatDateForPDF(date: Date | string | null): string {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format timestamp for PDF display
 */
export function formatTimestampForPDF(date: Date | string | null): string {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`;
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format array as bulleted list for PDF
 */
export function formatListForPDF(items: string[], prefix: string = '•'): string {
  if (!items || items.length === 0) return 'None';
  return items.map((item) => `${prefix} ${item}`).join('\n');
}
