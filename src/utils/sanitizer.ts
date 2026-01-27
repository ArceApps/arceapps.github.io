/**
 * Sanitizes and truncates text for search index.
 * Strips HTML tags and limits length to prevent DoS payloads.
 *
 * @param text The text to sanitize
 * @param maxLength The maximum length of the result (default 200)
 * @returns Sanitized and truncated string
 */
export function sanitizeForSearch(text: string, maxLength: number = 200): string {
  if (!text) return "";

  // 1. Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, "");

  // 2. Normalize whitespace (remove newlines, multiple spaces)
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // 3. Truncate
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + "...";
  }

  return cleaned;
}
