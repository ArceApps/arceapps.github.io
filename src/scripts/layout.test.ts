import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initLayout, initServiceWorker } from './layout';

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

  describe('initServiceWorker', () => {
    let registerMock: any;

    beforeEach(() => {
      registerMock = vi.fn();

      // Mock navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: registerMock,
        },
        configurable: true,
        writable: true,
      });

    });

    it('should register service worker if supported', async () => {
      registerMock.mockResolvedValue({ scope: '/' });

      initServiceWorker();

      expect(registerMock).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle registration failure asynchronously', async () => {
      const error = new Error('SW failed asynchronously');
      registerMock.mockRejectedValue(error);

      initServiceWorker();

      expect(registerMock).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle registration failure synchronously', () => {
      const error = new Error('SW failed synchronously');
      registerMock.mockImplementation(() => {
        throw error;
      });

      initServiceWorker();

      expect(registerMock).toHaveBeenCalledWith('/sw.js');
    });

    it('should not register if serviceWorker is not in navigator', () => {
      // @ts-ignore
      delete navigator.serviceWorker;

      initServiceWorker();

      expect(registerMock).not.toHaveBeenCalled();
    });
  });
});
