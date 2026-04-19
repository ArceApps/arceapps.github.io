/**
 * Safely serializes data to a JSON string for use in JSON-LD <script> tags.
 * Escapes characters that could be used for script injection or that have
 * special meaning in HTML, while preserving valid JSON.
 *
 * @param data The object to serialize
 * @returns A safe JSON string
 */
export function safeJsonLd(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
