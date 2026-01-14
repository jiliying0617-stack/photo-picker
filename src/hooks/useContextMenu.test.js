import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContextMenu } from './useContextMenu';

describe('useContextMenu', () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should initialize with null context menu', () => {
    const { result } = renderHook(() => useContextMenu());

    expect(result.current.contextMenu).toBe(null);
  });

  it('should open context menu with correct position and photoId', () => {
    const { result } = renderHook(() => useContextMenu());

    act(() => {
      result.current.openContextMenu(100, 200, 'photo123');
    });

    expect(result.current.contextMenu).toEqual({
      x: 100,
      y: 200,
      photoId: 'photo123',
    });
  });

  it('should close context menu', () => {
    const { result } = renderHook(() => useContextMenu());

    // Open menu
    act(() => {
      result.current.openContextMenu(100, 200, 'photo123');
    });

    expect(result.current.contextMenu).not.toBe(null);

    // Close menu
    act(() => {
      result.current.closeContextMenu();
    });

    expect(result.current.contextMenu).toBe(null);
  });

  it('should add window click event listener when menu is opened', () => {
    const { result } = renderHook(() => useContextMenu());

    act(() => {
      result.current.openContextMenu(100, 200, 'photo123');
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('should close menu when window is clicked', () => {
    const { result } = renderHook(() => useContextMenu());

    // Open menu
    act(() => {
      result.current.openContextMenu(100, 200, 'photo123');
    });

    expect(result.current.contextMenu).not.toBe(null);

    // Simulate window click
    act(() => {
      const clickHandler = addEventListenerSpy.mock.calls[0][1];
      clickHandler();
    });

    expect(result.current.contextMenu).toBe(null);
  });

  it('should remove event listener when menu is closed', () => {
    const { result } = renderHook(() => useContextMenu());

    // Open menu
    act(() => {
      result.current.openContextMenu(100, 200, 'photo123');
    });

    const clickHandler = addEventListenerSpy.mock.calls[0][1];

    // Close menu
    act(() => {
      result.current.closeContextMenu();
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', clickHandler);
  });

  it('should remove event listener on unmount when menu is open', () => {
    const { result, unmount } = renderHook(() => useContextMenu());

    // Open menu
    act(() => {
      result.current.openContextMenu(100, 200, 'photo123');
    });

    const clickHandler = addEventListenerSpy.mock.calls[0][1];

    // Unmount
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', clickHandler);
  });

  it('should not add event listener when menu is null', () => {
    renderHook(() => useContextMenu());

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should update menu position when opened again', () => {
    const { result } = renderHook(() => useContextMenu());

    // Open at first position
    act(() => {
      result.current.openContextMenu(100, 200, 'photo1');
    });

    expect(result.current.contextMenu).toEqual({
      x: 100,
      y: 200,
      photoId: 'photo1',
    });

    // Open at second position
    act(() => {
      result.current.openContextMenu(300, 400, 'photo2');
    });

    expect(result.current.contextMenu).toEqual({
      x: 300,
      y: 400,
      photoId: 'photo2',
    });
  });

  it('should handle rapid open/close sequences', () => {
    const { result } = renderHook(() => useContextMenu());

    act(() => {
      result.current.openContextMenu(100, 200, 'photo1');
      result.current.closeContextMenu();
      result.current.openContextMenu(300, 400, 'photo2');
    });

    expect(result.current.contextMenu).toEqual({
      x: 300,
      y: 400,
      photoId: 'photo2',
    });
  });
});
