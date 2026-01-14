import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toEqual([]);
  });

  it('should show toast with default type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Test message',
      type: 'info',
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('should show toast with custom type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Error message', 'error');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Error message',
      type: 'error',
    });
  });

  it('should show success toast using convenience method', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Success!');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Success!',
      type: 'success',
    });
  });

  it('should show error toast using convenience method', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error('Error!');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Error!',
      type: 'error',
    });
  });

  it('should show warning toast using convenience method', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.warning('Warning!');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Warning!',
      type: 'warning',
    });
  });

  it('should show info toast using convenience method', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info('Info!');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Info!',
      type: 'info',
    });
  });

  it('should close toast manually', () => {
    const { result } = renderHook(() => useToast());

    // Add toast
    act(() => {
      result.current.showToast('Test');
    });

    const toastId = result.current.toasts[0].id;

    // Close toast
    act(() => {
      result.current.closeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should automatically remove toast after TOAST.DURATION', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test');
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast forward 3000ms
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not remove toast before TOAST.DURATION', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test');
    });

    // Fast forward less than 3000ms
    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('should limit toasts to MAX_COUNT (5)', () => {
    const { result } = renderHook(() => useToast());

    // Add 7 toasts
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.showToast(`Toast ${i}`);
      }
    });

    // Should only keep the last 5
    expect(result.current.toasts).toHaveLength(5);
    expect(result.current.toasts[0].message).toBe('Toast 2');
    expect(result.current.toasts[4].message).toBe('Toast 6');
  });

  it('should generate unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Toast 1');
      result.current.showToast('Toast 2');
      result.current.showToast('Toast 3');
    });

    const ids = result.current.toasts.map(t => t.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3); // All IDs should be unique
  });

  it('should handle multiple toasts auto-removal independently', () => {
    const { result } = renderHook(() => useToast());

    // Add first toast
    act(() => {
      result.current.showToast('Toast 1');
    });

    // Wait 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Add second toast
    act(() => {
      result.current.showToast('Toast 2');
    });

    expect(result.current.toasts).toHaveLength(2);

    // Wait 2 more seconds (total 3 seconds from first toast)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // First toast should be removed, second remains
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Toast 2');

    // Wait 1 more second (total 3 seconds from second toast)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // All toasts removed
    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not affect other toasts when closing one toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Toast 1');
      result.current.showToast('Toast 2');
      result.current.showToast('Toast 3');
    });

    const toast2Id = result.current.toasts[1].id;

    // Close middle toast
    act(() => {
      result.current.closeToast(toast2Id);
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].message).toBe('Toast 1');
    expect(result.current.toasts[1].message).toBe('Toast 3');
  });
});
