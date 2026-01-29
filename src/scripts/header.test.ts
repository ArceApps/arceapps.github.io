import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initHeader } from './header';

describe('Header Script', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="theme-toggle"></button>
      <button id="menu-toggle">
        <span class="material-icons">menu</span>
      </button>
      <div id="mobile-menu" class="hidden">
        <a href="#">Link 1</a>
      </div>
    `;
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.clearAllMocks();
  });

  it('should toggle theme on click', () => {
    initHeader();
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.click();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    themeToggle?.click();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should toggle mobile menu', () => {
    initHeader();
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    expect(mobileMenu?.classList.contains('hidden')).toBe(true);

    menuToggle?.click();
    expect(mobileMenu?.classList.contains('hidden')).toBe(false);
    expect(menuToggle?.getAttribute('aria-expanded')).toBe('true');

    menuToggle?.click();
    expect(mobileMenu?.classList.contains('hidden')).toBe(true);
  });
});
