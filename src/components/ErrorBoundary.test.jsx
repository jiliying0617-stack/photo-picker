import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('应用遇到错误')).toBeInTheDocument();
    expect(screen.getByText('很抱歉,应用遇到了一个意外错误。请刷新页面重试。')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should display error details', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const details = screen.getByText('错误详情');
    expect(details).toBeInTheDocument();

    // Check that error message is in the details
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('刷新页面');
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton.tagName).toBe('BUTTON');
  });

  it('should call window.location.reload when clicking refresh button', () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: vi.fn() };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('刷新页面');
    refreshButton.click();

    expect(window.location.reload).toHaveBeenCalled();

    // Restore original location
    window.location = originalLocation;
  });

  it('should log error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorCall = consoleErrorSpy.mock.calls.find(call =>
      call[0].includes('ErrorBoundary caught an error')
    );
    expect(errorCall).toBeDefined();
  });

  it('should not render error UI initially', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    );

    expect(screen.queryByText('应用遇到错误')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should have correct styling for error UI', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = container.firstChild;
    expect(errorContainer).toHaveClass('h-screen');
    expect(errorContainer).toHaveClass('flex');
    expect(errorContainer).toHaveClass('items-center');
    expect(errorContainer).toHaveClass('justify-center');
  });

  it('should render details element as collapsed by default', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const details = screen.getByText('错误详情').closest('details');
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute('open');
  });

  it('should render error message in pre tag', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const preElement = screen.getByText(/Test error/).closest('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveClass('text-xs');
    expect(preElement).toHaveClass('overflow-auto');
  });
});
