import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initHeader } from './header';

describe('Header Script', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <button id="theme-toggle"></button>
      <button id="menu-toggle"></button>
      <div id="mobile-menu" class="hidden">
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

    // Simulate click to close
    menuToggle?.click();
    expect(mobileMenu?.classList.contains('hidden')).toBe(true);
  });
});
