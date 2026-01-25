import { describe, it, expect } from 'vitest';
import { slugify } from './slugs';

describe('slugify', () => {
  it('should convert text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with dashes', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('should remove accents/diacritics', () => {
    expect(slugify('fútbòl')).toBe('futbol');
    expect(slugify('El Niño')).toBe('el-nino');
  });

  it('should remove special characters', () => {
    expect(slugify('hello@world!')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('should handle multiple dashes', () => {
    expect(slugify('hello--world')).toBe('hello-world');
  });

  it('should trim dashes from start and end', () => {
    expect(slugify('-hello world-')).toBe('hello-world');
  });

  it('should handle empty strings', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle numbers', () => {
    expect(slugify('Article 123')).toBe('article-123');
  });
});
