import { JSDOM } from 'jsdom';

/**
 * Sanitizes text by removing HTML tags (including script/style content) and normalizing whitespace.
 * @param {string} text - The text to sanitize.
 * @param {number} maxLength - Maximum length of the result.
 * @returns {string} - Sanitized text.
 */
export function sanitize(text, maxLength = 500) {
  if (!text) return '';

  // Use JSDOM to parse HTML
  const dom = new JSDOM(text);
  const doc = dom.window.document;

  // Remove script and style elements to prevent their content from appearing in textContent
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  // Extract text content
  let clean = doc.body.textContent || "";

  // Normalize whitespace (remove newlines, multiple spaces)
  clean = clean.replace(/\s+/g, ' ').trim();

  // Truncate
  if (clean.length > maxLength) {
    return clean.substring(0, maxLength) + '...';
  }

  return clean;
}
