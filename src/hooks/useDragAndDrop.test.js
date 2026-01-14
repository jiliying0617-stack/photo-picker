import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from './useDragAndDrop';

describe('useDragAndDrop', () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;
  let dispatchEventSpy;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    // Don't need to mock document since jsdom provides it
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    dispatchEventSpy.mockRestore();
  });

  it('should initialize with isDragging false', () => {
    const { result } = renderHook(() => useDragAndDrop());

    expect(result.current.isDragging).toBe(false);
  });

  it('should register drag event listeners on mount', () => {
    renderHook(() => useDragAndDrop());

    expect(addEventListenerSpy).toHaveBeenCalledWith('dragenter', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
  });

  it('should set isDragging to true on dragenter', () => {
    const { result } = renderHook(() => useDragAndDrop());

    const dragenterHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragenter'
    )[1];

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    act(() => {
      dragenterHandler(mockEvent);
    });

    expect(result.current.isDragging).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should not set isDragging to false on dragleave if target is not body/documentElement', () => {
    const { result } = renderHook(() => useDragAndDrop());

    // First set to true
    const dragenterHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragenter'
    )[1];

    act(() => {
      dragenterHandler({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });

    expect(result.current.isDragging).toBe(true);

    // Dragleave with different target
    const dragleaveHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragleave'
    )[1];

    act(() => {
      dragleaveHandler({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: document.createElement('div'), // Not body or documentElement
      });
    });

    // Should still be true
    expect(result.current.isDragging).toBe(true);
  });

  it('should set isDragging to false on dragleave if target is body', () => {
    const { result } = renderHook(() => useDragAndDrop());

    // First set to true
    const dragenterHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragenter'
    )[1];

    act(() => {
      dragenterHandler({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });

    // Dragleave with body as target
    const dragleaveHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragleave'
    )[1];

    act(() => {
      dragleaveHandler({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: document.body,
      });
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should set isDragging to false on dragleave if target is documentElement', () => {
    const { result } = renderHook(() => useDragAndDrop());

    // First set to true
    const dragenterHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragenter'
    )[1];

    act(() => {
      dragenterHandler({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });

    // Dragleave with documentElement as target
    const dragleaveHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragleave'
    )[1];

    act(() => {
      dragleaveHandler({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: document.documentElement,
      });
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should set isDragging to false and dispatch custom event on drop', () => {
    const { result } = renderHook(() => useDragAndDrop());

    // First set to true
    const dragenterHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragenter'
    )[1];

    act(() => {
      dragenterHandler({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });

    expect(result.current.isDragging).toBe(true);

    // Drop event
    const dropHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'drop')[1];

    const mockDataTransfer = {};
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: mockDataTransfer,
    };

    act(() => {
      dropHandler(mockEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();

    // Check custom event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
    const customEvent = dispatchEventSpy.mock.calls[0][0];
    expect(customEvent.type).toBe('dropFolder');
    expect(customEvent.detail).toBe(mockDataTransfer);
  });

  it('should prevent default on dragover', () => {
    renderHook(() => useDragAndDrop());

    const dragoverHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'dragover')[1];

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    dragoverHandler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => useDragAndDrop());

    const dragenterHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragenter'
    )[1];
    const dragoverHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'dragover')[1];
    const dragleaveHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'dragleave'
    )[1];
    const dropHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'drop')[1];

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('dragenter', dragenterHandler);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('dragover', dragoverHandler);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('dragleave', dragleaveHandler);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('drop', dropHandler);
  });
});
