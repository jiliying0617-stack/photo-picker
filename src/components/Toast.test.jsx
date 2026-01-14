import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render multiple toast messages', () => {
    const toasts = [
      { id: '1', type: 'success', message: 'Success message' },
      { id: '2', type: 'error', message: 'Error message' },
    ];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render success toast with correct styling', () => {
    const toasts = [{ id: '1', type: 'success', message: 'Success!' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    const toastElement = screen.getByText('Success!').closest('div');
    expect(toastElement).toHaveClass('bg-green-500');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should render error toast with correct styling', () => {
    const toasts = [{ id: '1', type: 'error', message: 'Error!' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    const toastElement = screen.getByText('Error!').closest('div');
    expect(toastElement).toHaveClass('bg-red-500');
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('should render warning toast with correct styling', () => {
    const toasts = [{ id: '1', type: 'warning', message: 'Warning!' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    const toastElement = screen.getByText('Warning!').closest('div');
    expect(toastElement).toHaveClass('bg-yellow-500');
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('should render info toast with correct styling', () => {
    const toasts = [{ id: '1', type: 'info', message: 'Info!' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    const toastElement = screen.getByText('Info!').closest('div');
    expect(toastElement).toHaveClass('bg-blue-500');
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('should call onClose when clicking close button', () => {
    const toasts = [{ id: '1', type: 'info', message: 'Test message' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('should auto-close toast after 3000ms', () => {
    const toasts = [{ id: '1', type: 'info', message: 'Auto-close test' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('should not auto-close before 3000ms', () => {
    const toasts = [{ id: '1', type: 'info', message: 'Test' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    vi.advanceTimersByTime(2999);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should render empty when no toasts', () => {
    const onClose = vi.fn();

    const { container } = render(<Toast toasts={[]} onClose={onClose} />);

    // Container should have the wrapper div but no toast items
    expect(container.querySelector('.fixed')).toBeInTheDocument();
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });

  it('should handle multiple toasts with different IDs', () => {
    const toasts = [
      { id: '1', type: 'success', message: 'First' },
      { id: '2', type: 'error', message: 'Second' },
      { id: '3', type: 'info', message: 'Third' },
    ];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('should cleanup timer on unmount', () => {
    const toasts = [{ id: '1', type: 'info', message: 'Test' }];
    const onClose = vi.fn();

    const { unmount } = render(<Toast toasts={toasts} onClose={onClose} />);

    unmount();

    // Advance timers after unmount
    vi.advanceTimersByTime(3000);

    // onClose should not be called after unmount
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should use default styling for unknown type', () => {
    const toasts = [{ id: '1', type: 'unknown', message: 'Unknown type' }];
    const onClose = vi.fn();

    render(<Toast toasts={toasts} onClose={onClose} />);

    const toastElement = screen.getByText('Unknown type').closest('div');
    // Should fall back to info styling
    expect(toastElement).toHaveClass('bg-blue-500');
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });
});
