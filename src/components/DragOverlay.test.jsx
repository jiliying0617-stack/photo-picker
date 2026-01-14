import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DragOverlay from './DragOverlay';

describe('DragOverlay', () => {
  it('should render null when not dragging', () => {
    const { container } = render(<DragOverlay isDragging={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render overlay when dragging', () => {
    render(<DragOverlay isDragging={true} />);

    expect(screen.getByText('松开鼠标导入文件夹')).toBeInTheDocument();
    expect(screen.getByText('支持拖入包含图片的文件夹')).toBeInTheDocument();
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('should have correct styling when dragging', () => {
    const { container } = render(<DragOverlay isDragging={true} />);

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('fixed');
    expect(overlay).toHaveClass('inset-0');
    expect(overlay).toHaveClass('z-50');
    expect(overlay).toHaveClass('pointer-events-none');
  });

  it('should render with backdrop blur effect', () => {
    const { container } = render(<DragOverlay isDragging={true} />);

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('backdrop-blur-sm');
  });

  it('should center content', () => {
    const { container } = render(<DragOverlay isDragging={true} />);

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('flex');
    expect(overlay).toHaveClass('items-center');
    expect(overlay).toHaveClass('justify-center');
  });
});
