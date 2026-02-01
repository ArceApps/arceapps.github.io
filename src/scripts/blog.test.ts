import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Blog Script', () => {
  let blogModule: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
        value: {
            writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true // Important to allow re-definition if needed
    });

    // Mock requestAnimationFrame to execute immediately
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
        fn(0);
        return 0;
    });

    // Import
    blogModule = await import('./blog');
  });

  describe('setupCopyButtons', () => {
    it('should add copy buttons to pre tags', () => {
        document.body.innerHTML = '<pre><code>const a = 1;</code></pre>';
        blogModule.setupCopyButtons();
        const btn = document.querySelector('.copy-code-btn');
        expect(btn).not.toBeNull();
    });

    it('should copy text on click', async () => {
        document.body.innerHTML = '<pre><code>test code</code></pre>';
        blogModule.setupCopyButtons();
        const btn = document.querySelector('.copy-code-btn') as HTMLButtonElement;

        btn.click();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test code');

        // Check visual feedback (async)
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(btn.classList.contains('text-green-400')).toBe(true);
        expect(btn.getAttribute('aria-label')).toBe('¡Copiado!');
        expect(btn.title).toBe('¡Copiado!');
    });
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
