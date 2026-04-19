import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerHapticFeedback } from './haptics';

describe('triggerHapticFeedback', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
  });

  it('should call navigator.vibrate with default duration (50ms)', () => {
    const vibrateMock = vi.fn();
    vi.stubGlobal('navigator', {
      vibrate: vibrateMock,
    });

    triggerHapticFeedback();

    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  it('should call navigator.vibrate with custom duration', () => {
    const vibrateMock = vi.fn();
    vi.stubGlobal('navigator', {
      vibrate: vibrateMock,
    });

    triggerHapticFeedback(100);

    expect(vibrateMock).toHaveBeenCalledWith(100);
  });

  it('should not throw if navigator is undefined', () => {
    vi.stubGlobal('navigator', undefined);

    expect(() => triggerHapticFeedback()).not.toThrow();
  });

  it('should not throw if navigator.vibrate is not a function', () => {
    vi.stubGlobal('navigator', {});

    expect(() => triggerHapticFeedback()).not.toThrow();
  });
});
