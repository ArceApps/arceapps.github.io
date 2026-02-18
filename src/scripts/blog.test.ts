import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Blog Script', () => {
  let blogModule: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock requestAnimationFrame to execute immediately
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
        fn(0);
        return 0;
    });

    // Import
    blogModule = await import('./blog');
  });

  describe('setupProgressBar', () => {
    it('should update progress bar width on scroll', () => {
        document.body.innerHTML = '<div id="progress-bar" style="width: 0%"></div>';

        // Mock dimensions
        Object.defineProperty(document.documentElement, 'scrollTop', { value: 50, configurable: true });
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 200, configurable: true });
        Object.defineProperty(document.documentElement, 'clientHeight', { value: 100, configurable: true });
        // scrollHeight (200) - clientHeight (100) = 100 max scroll. scrollTop 50 => 50%.

        blogModule.setupProgressBar();

        // Trigger scroll
        window.dispatchEvent(new Event('scroll'));

        const bar = document.getElementById('progress-bar');
        expect(bar?.style.width).toBe('50%');
    });
  });
});
