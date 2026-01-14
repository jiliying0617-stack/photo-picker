import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, runWhenIdle } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls when called multiple times', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2', 'arg3');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should use default wait time of 300ms', () => {
    const fn = vi.fn();
    const debounced = debounce(fn);

    debounced();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on each call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);

    debounced();
    vi.advanceTimersByTime(50);

    // Should not have been called yet (timer was reset)
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('runWhenIdle', () => {
  it('should use requestIdleCallback when available', () => {
    const callback = vi.fn();
    const mockRequestIdleCallback = vi.fn();

    global.requestIdleCallback = mockRequestIdleCallback;

    runWhenIdle(callback);

    expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback);
    expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);

    delete global.requestIdleCallback;
  });

  it('should fallback to setTimeout when requestIdleCallback is unavailable', () => {
    const callback = vi.fn();
    const originalRequestIdleCallback = global.requestIdleCallback;

    // Temporarily remove requestIdleCallback
    delete global.requestIdleCallback;

    vi.useFakeTimers();
    runWhenIdle(callback);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.useRealTimers();

    // Restore original
    if (originalRequestIdleCallback) {
      global.requestIdleCallback = originalRequestIdleCallback;
    }
  });
});
