import { describe, expect, it } from 'vitest';
import { isPublished } from './publishing';

describe('isPublished', () => {
  it('publica un post fechado hoy aunque el build corra antes de medianoche UTC', () => {
    // 2026-08-26 00:17 CEST == 2026-08-25T22:17Z: en UTC aún es "ayer"
    const now = new Date('2026-08-25T22:17:00Z');
    const pubDate = new Date('2026-08-26T00:00:00Z');
    expect(isPublished(pubDate, now)).toBe(true);
  });

  it('publica posts con fecha pasada', () => {
    const now = new Date('2026-08-26T10:00:00Z');
    expect(isPublished(new Date('2025-11-15T00:00:00Z'), now)).toBe(true);
  });

  it('oculta posts con fecha futura', () => {
    const now = new Date('2026-08-26T10:00:00Z');
    expect(isPublished(new Date('2026-08-27T00:00:00Z'), now)).toBe(false);
  });

  it('oculta un post hasta que su día llega en la zona horaria del sitio', () => {
    // 2026-08-25 23:59 CEST == 2026-08-25T21:59Z: aún no es día 26 en Madrid
    const now = new Date('2026-08-25T21:59:00Z');
    expect(isPublished(new Date('2026-08-26T00:00:00Z'), now)).toBe(false);
  });
});
