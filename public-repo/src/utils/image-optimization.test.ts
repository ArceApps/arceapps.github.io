import { describe, it, expect } from 'vitest';
import { optimizeGooglePlayImage } from './image-optimization';

describe('optimizeGooglePlayImage', () => {
  it('should return undefined for undefined input', () => {
    expect(optimizeGooglePlayImage(undefined, 100)).toBeUndefined();
  });

  it('should return original URL for non-Google domains', () => {
    const url = 'https://example.com/image.jpg';
    expect(optimizeGooglePlayImage(url, 100)).toBe(url);
  });

  it('should append width parameter to clean Google Play URL', () => {
    const url = 'https://play-lh.googleusercontent.com/xyz';
    expect(optimizeGooglePlayImage(url, 500)).toBe('https://play-lh.googleusercontent.com/xyz=w500');
  });

  it('should append square parameter when type is square', () => {
    const url = 'https://play-lh.googleusercontent.com/xyz';
    expect(optimizeGooglePlayImage(url, 100, 'square')).toBe('https://play-lh.googleusercontent.com/xyz=s100');
  });

  it('should replace existing single parameter', () => {
    const url = 'https://play-lh.googleusercontent.com/xyz=s512';
    expect(optimizeGooglePlayImage(url, 200, 'width')).toBe('https://play-lh.googleusercontent.com/xyz=w200');
  });

  it('should replace existing complex parameter', () => {
    const url = 'https://play-lh.googleusercontent.com/xyz=w1200-h600-rw';
    expect(optimizeGooglePlayImage(url, 800)).toBe('https://play-lh.googleusercontent.com/xyz=w800');
  });

  it('should handle ggpht.com domain', () => {
    const url = 'https://lh3.ggpht.com/xyz=s180';
    expect(optimizeGooglePlayImage(url, 120)).toBe('https://lh3.ggpht.com/xyz=w120');
  });

  it('should handle square type correctly replacing existing param', () => {
    const url = 'https://play-lh.googleusercontent.com/xyz=w1000';
    expect(optimizeGooglePlayImage(url, 64, 'square')).toBe('https://play-lh.googleusercontent.com/xyz=s64');
  });
});
