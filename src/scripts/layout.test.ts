import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initLayout } from './layout';

describe('Layout Script', () => {
  let observeMock: any;
  let disconnectMock: any;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="scroll-sentinel"></div>
      <button id="scroll-to-top" class="translate-y-20 opacity-0 pointer-events-none"></button>
    `;

    observeMock = vi.fn();
    disconnectMock = vi.fn();

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn(function() {
      return {
        observe: observeMock,
        disconnect: disconnectMock,
        unobserve: vi.fn(),
      };
    }) as any;

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize scroll observer', () => {
    initLayout();

    expect(global.IntersectionObserver).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalledWith(document.getElementById('scroll-sentinel'));
  });

  it('should disconnect previous observers on re-initialization', () => {
    initLayout();
    initLayout(); // Call again to simulate navigation

    expect(disconnectMock).toHaveBeenCalled();
  });
});
