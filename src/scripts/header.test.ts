import { describe, it, expect, beforeEach } from 'vitest';
import { initHeader } from './header';

const memoryStorage = new Map<string, string>();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      clear: () => memoryStorage.clear(),
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
    },
  });
}

describe('Header Script', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <button id="theme-toggle"></button>
      <button id="menu-toggle" aria-expanded="false" aria-controls="mobile-menu"></button>
      <div id="mobile-menu" class="hidden" aria-hidden="true" data-state="closed">
        <a href="/">Home</a>
      </div>
    `;

    // Clear localStorage
    localStorage.clear();
  });

  it('should initialize theme toggle listener', () => {
    initHeader();

    const themeToggle = document.getElementById('theme-toggle');
    expect(themeToggle).not.toBeNull();

    // Simulate click
    themeToggle?.click();

    // Check if dark mode is toggled (defaults to light usually, so adds dark)
    // Actually initHeader sets up listener.
    // The listener does: element.classList.toggle("dark");
    // Default classList is empty.
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should initialize mobile menu listeners', () => {
    initHeader();

    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    // Simulate click to open
    menuToggle?.click();
    expect(mobileMenu?.classList.contains('hidden')).toBe(false);
    expect(menuToggle?.getAttribute('aria-expanded')).toBe('true');
    expect(mobileMenu?.getAttribute('aria-hidden')).toBe('false');
    expect(mobileMenu?.getAttribute('data-state')).toBe('open');
    expect(document.activeElement).toBe(mobileMenu?.querySelector('a'));

    // Simulate click to close
    menuToggle?.click();
    expect(mobileMenu?.classList.contains('hidden')).toBe(true);
    expect(menuToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(mobileMenu?.getAttribute('aria-hidden')).toBe('true');
    expect(mobileMenu?.getAttribute('data-state')).toBe('closed');
    expect(document.activeElement).toBe(menuToggle);
  });

  it('should close the mobile menu on Escape and return focus to the trigger', () => {
    initHeader();

    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    menuToggle?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(mobileMenu?.classList.contains('hidden')).toBe(true);
    expect(mobileMenu?.getAttribute('aria-hidden')).toBe('true');
    expect(menuToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menuToggle);
  });
});
