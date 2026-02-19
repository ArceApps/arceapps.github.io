import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Code Copy Script', () => {
  let copyModule: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
        value: {
            writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true
    });

    // Mock getComputedStyle
    vi.stubGlobal('getComputedStyle', () => ({
        position: 'static'
    }));

    // Import
    copyModule = await import('./code-copy');
  });

  describe('setupCopyButtons', () => {
    it('should add copy buttons to pre tags', () => {
        document.body.innerHTML = '<pre><code>const a = 1;</code></pre>';
        copyModule.setupCopyButtons();
        const btn = document.querySelector('.copy-code-btn');
        expect(btn).not.toBeNull();
    });

    it('should set position relative on pre tag if static', () => {
        document.body.innerHTML = '<pre><code>const a = 1;</code></pre>';
        const pre = document.querySelector('pre') as HTMLElement;

        // Mock style property
        Object.defineProperty(pre, 'style', {
            value: { position: '' },
            writable: true
        });

        copyModule.setupCopyButtons();
        expect(pre.style.position).toBe('relative');
    });

    it('should copy text on click', async () => {
        document.body.innerHTML = '<pre><code>test code</code></pre>';
        copyModule.setupCopyButtons();
        const btn = document.querySelector('.copy-code-btn') as HTMLButtonElement;

        if (btn) {
            btn.click();
        }

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test code');

        // Check visual feedback (async)
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(btn.classList.contains('text-green-400')).toBe(true);
        expect(btn.getAttribute('aria-label')).toBe('¡Copiado!');
        expect(btn.title).toBe('¡Copiado!');
    });

    it('should not add duplicate buttons', () => {
        document.body.innerHTML = '<pre><button class="copy-code-btn"></button><code>test code</code></pre>';
        copyModule.setupCopyButtons();
        const buttons = document.querySelectorAll('.copy-code-btn');
        expect(buttons.length).toBe(1);
    });
  });
});
