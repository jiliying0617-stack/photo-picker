import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectionToolbar from './SelectionToolbar';

describe('SelectionToolbar', () => {
  it('should render null when no photos selected', () => {
    const { container } = render(
      <SelectionToolbar selectedPhotos={[]} onPreview={vi.fn()} onClear={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when photos are selected', () => {
    const selectedPhotos = ['photo1', 'photo2', 'photo3'];

    render(
      <SelectionToolbar selectedPhotos={selectedPhotos} onPreview={vi.fn()} onClear={vi.fn()} />
    );

    expect(screen.getByText('已选择 3 张图片')).toBeInTheDocument();
    expect(screen.getByText('大图对比')).toBeInTheDocument();
    expect(screen.getByText('清除选择')).toBeInTheDocument();
  });

  it('should display correct count for single photo', () => {
    const selectedPhotos = ['photo1'];

    render(
      <SelectionToolbar selectedPhotos={selectedPhotos} onPreview={vi.fn()} onClear={vi.fn()} />
    );

    expect(screen.getByText('已选择 1 张图片')).toBeInTheDocument();
  });

  it('should display correct count for multiple photos', () => {
    const selectedPhotos = ['photo1', 'photo2', 'photo3', 'photo4', 'photo5'];

    render(
      <SelectionToolbar selectedPhotos={selectedPhotos} onPreview={vi.fn()} onClear={vi.fn()} />
    );

    expect(screen.getByText('已选择 5 张图片')).toBeInTheDocument();
  });

  it('should call onPreview when clicking preview button', () => {
    const onPreview = vi.fn();
    const selectedPhotos = ['photo1', 'photo2'];

    render(
      <SelectionToolbar selectedPhotos={selectedPhotos} onPreview={onPreview} onClear={vi.fn()} />
    );

    fireEvent.click(screen.getByText('大图对比'));

    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('should call onClear when clicking clear button', () => {
    const onClear = vi.fn();
    const selectedPhotos = ['photo1', 'photo2'];

    render(
      <SelectionToolbar selectedPhotos={selectedPhotos} onPreview={vi.fn()} onClear={onClear} />
    );

    fireEvent.click(screen.getByText('清除选择'));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should have correct positioning styles', () => {
    const { container } = render(
      <SelectionToolbar selectedPhotos={['photo1']} onPreview={vi.fn()} onClear={vi.fn()} />
    );

    const toolbar = container.firstChild;
    expect(toolbar).toHaveClass('fixed');
    expect(toolbar).toHaveClass('bottom-24');
    expect(toolbar).toHaveClass('left-1/2');
    expect(toolbar).toHaveClass('-translate-x-1/2');
    expect(toolbar).toHaveClass('z-40');
  });

  it('should have proper button colors', () => {
    render(
      <SelectionToolbar selectedPhotos={['photo1']} onPreview={vi.fn()} onClear={vi.fn()} />
    );

    const previewButton = screen.getByText('大图对比');
    const clearButton = screen.getByText('清除选择');

    expect(previewButton).toHaveClass('text-blue-600');
    expect(clearButton).toHaveClass('text-red-600');
  });
});
