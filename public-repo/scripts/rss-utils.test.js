import { describe, it, expect } from 'vitest';
import { sanitize } from './rss-utils.js';

describe('sanitize', () => {
  it('should handle empty, null, or undefined input', () => {
    expect(sanitize('')).toBe('');
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
  });

  it('should strip simple HTML tags', () => {
    const input = '<p>Hello <b>World</b></p>';
    expect(sanitize(input)).toBe('Hello World');
  });

  it('should remove script and style tags and their content', () => {
    const input = '<div>Text<script>alert("xss")</script><style>body {color: red;}</style> more text</div>';
    expect(sanitize(input)).toBe('Text more text');
  });

  it('should normalize whitespace', () => {
    const input = '  Hello   \n   \t World  ';
    expect(sanitize(input)).toBe('Hello World');
  });

  it('should truncate text to maxLength and add ellipsis', () => {
    const input = 'This is a long sentence that should be truncated.';
    const maxLength = 10;
    const result = sanitize(input, maxLength);
    expect(result).toBe('This is a ...');
    expect(result.length).toBe(maxLength + 3);
  });

  it('should not truncate if text is shorter than or equal to maxLength', () => {
    const input = 'Short text';
    expect(sanitize(input, 20)).toBe('Short text');
    expect(sanitize(input, 10)).toBe('Short text');
  });

  it('should handle complex HTML and normalize whitespace from it', () => {
    const input = `
      <div>
        <h1>Title</h1>
        <p>Paragraph with <a href="#">link</a>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `;
    // JSDOM body.textContent will typically join block elements with their content,
    // and our regex will collapse the resulting whitespace.
    const result = sanitize(input);
    expect(result).toContain('Title Paragraph with link. Item 1 Item 2');
  });

  it('should handle text with no HTML', () => {
    const input = 'Just plain text without any tags.';
    expect(sanitize(input)).toBe('Just plain text without any tags.');
  });
});
