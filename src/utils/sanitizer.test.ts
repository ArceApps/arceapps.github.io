import { describe, it, expect } from 'vitest';
import { sanitizeForSearch } from './sanitizer';

describe('sanitizeForSearch', () => {
  it('should handle empty input', () => {
    expect(sanitizeForSearch('')).toBe('');
    // @ts-ignore
    expect(sanitizeForSearch(null)).toBe('');
    // @ts-ignore
    expect(sanitizeForSearch(undefined)).toBe('');
  });

  it('should strip HTML tags', () => {
    const input = '<p>Hello <b>World</b></p>';
    expect(sanitizeForSearch(input)).toBe('Hello World');
  });

  it('should normalize whitespace', () => {
    const input = 'Hello   \n   World';
    expect(sanitizeForSearch(input)).toBe('Hello World');
  });

  it('should truncate long text', () => {
    const input = 'a'.repeat(300);
    const result = sanitizeForSearch(input, 10);
    expect(result.length).toBe(13); // 10 chars + 3 dots
    expect(result).toBe('aaaaaaaaaa...');
  });

  it('should handle text shorter than limit', () => {
    const input = 'Short text';
    expect(sanitizeForSearch(input, 20)).toBe('Short text');
  });

  it('should strip HTML and then truncate', () => {
    const input = '<b>Bold</b> text that is very long and needs truncation';
    const result = sanitizeForSearch(input, 9);
    expect(result).toBe('Bold text...');
  });
});
