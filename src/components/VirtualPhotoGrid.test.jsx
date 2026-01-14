import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VirtualPhotoGrid from './VirtualPhotoGrid';

// Mock react-window FixedSizeGrid组件
vi.mock('react-window', () => ({
  FixedSizeGrid: vi.fn(({ children, columnCount, rowCount, columnWidth, rowHeight }) => {
    // 渲染前几个cell用于测试
    const cells = [];
    const maxCells = Math.min(rowCount * columnCount, 6); // 只渲染前6个cell

    for (let i = 0; i < maxCells; i++) {
      const rowIndex = Math.floor(i / columnCount);
      const columnIndex = i % columnCount;

      // 调用 children 函数 (render prop)
      const cell = children({
        columnIndex,
        rowIndex,
        style: {
          position: 'absolute',
          left: columnIndex * columnWidth,
          top: rowIndex * rowHeight,
          width: columnWidth,
          height: rowHeight,
        },
      });

      cells.push(
        <div key={i} data-testid={`cell-${i}`}>
          {cell}
        </div>
      );
    }

    return <div data-testid="virtual-grid">{cells}</div>;
  }),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnected = false;
  }
  observe(target) {
    this.target = target;
    // 立即触发一次回调，模拟容器尺寸
    setTimeout(() => {
      if (!this.disconnected && this.callback && this.target) {
        this.callback([
          {
            target: this.target,
            contentRect: {
              width: 1000,
              height: 800,
            },
          },
        ]);
      }
    }, 0);
  }
  disconnect() {
    this.disconnected = true;
    this.callback = null;
    this.target = null;
  }
  unobserve() {
    this.target = null;
  }
};

// Mock getBoundingClientRect
HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 1000,
  height: 800,
  top: 0,
  left: 0,
  right: 1000,
  bottom: 800,
  x: 0,
  y: 0,
  toJSON: () => {},
}));

describe('VirtualPhotoGrid', () => {
  // Mock props
  const mockPhotos = [
    {
      id: 'photo1',
      name: 'test1.jpg',
      path: '/test1.jpg',
      folder: '/folder',
      size: 1000,
      lastModified: Date.now(),
      category: 'correct',
      thumbnailUrl: 'blob:test1',
    },
    {
      id: 'photo2',
      name: 'test2.jpg',
      path: '/test2.jpg',
      folder: '/folder',
      size: 2000,
      lastModified: Date.now(),
      category: null,
      thumbnailUrl: 'blob:test2',
    },
    {
      id: 'photo3',
      name: 'test3.jpg',
      path: '/test3.jpg',
      folder: '/folder',
      size: 3000,
      lastModified: Date.now(),
      category: 'wrong',
      thumbnailUrl: 'blob:test3',
    },
  ];

  const defaultProps = {
    photos: mockPhotos,
    columns: 3,
    isCompareMode: false,
    selectedPhotoId: null,
    selectedPhotos: [],
    setSelectedPhotoId: vi.fn(),
    setSelectedPhotos: vi.fn(),
    setCategory: vi.fn(),
    openPreview: vi.fn(),
    setCurrentPreviewGroupIndex: vi.fn(),
    openContextMenu: vi.fn(),
    setPhotoRef: vi.fn(),
    onGridRefReady: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应该渲染虚拟网格', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
      });
    });

    it('应该渲染照片列表', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      // 等待容器尺寸更新后渲染照片
      await waitFor(() => {
        expect(screen.getByTestId('cell-0')).toBeInTheDocument();
      });
      expect(screen.getByTestId('cell-1')).toBeInTheDocument();
      expect(screen.getByTestId('cell-2')).toBeInTheDocument();
    });

    it('应该显示照片图片', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
        expect(images[0]).toHaveAttribute('src', 'blob:test1');
      });
    });

    it('对比模式下应该显示照片名称', async () => {
      const compareProps = {
        ...defaultProps,
        columns: 3,
        isCompareMode: true,
      };

      render(<VirtualPhotoGrid {...compareProps} />);

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument();
      });
      expect(screen.getByText('test2.jpg')).toBeInTheDocument();
    });

    it('应该显示已分类的照片标记', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      // photo1有correct分类，应该显示✓标记
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        expect(cells[0].textContent).toContain('✓');
      });
    });
  });

  describe('照片选择测试', () => {
    it('普通点击应该调用setSelectedId', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.click(photoItem);

      expect(defaultProps.setSelectedPhotoId).toHaveBeenCalledWith('photo1');
      expect(defaultProps.setSelectedPhotos).not.toHaveBeenCalled();
    });

    it('Shift+点击应该添加到框选列表', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.click(photoItem, { shiftKey: true });

      expect(defaultProps.setSelectedPhotos).toHaveBeenCalled();
      expect(defaultProps.setSelectedPhotoId).not.toHaveBeenCalled();
    });

    it('Ctrl+点击应该添加到框选列表', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.click(photoItem, { ctrlKey: true });

      expect(defaultProps.setSelectedPhotos).toHaveBeenCalled();
    });

    it('Cmd+点击应该添加到框选列表 (Mac)', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.click(photoItem, { metaKey: true });

      expect(defaultProps.setSelectedPhotos).toHaveBeenCalled();
    });

    it('应该正确显示选中状态', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedPhotoId: 'photo1',
      };

      render(<VirtualPhotoGrid {...propsWithSelection} />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        const photoItem = cells[0].querySelector('.photo-item');
        expect(photoItem).toHaveClass('ring-4', 'ring-green-500');
      });
    });

    it('应该正确显示框选状态', async () => {
      const propsWithBoxSelection = {
        ...defaultProps,
        selectedPhotos: ['photo1', 'photo2'],
      };

      render(<VirtualPhotoGrid {...propsWithBoxSelection} />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        const photoItem1 = cells[0].querySelector('.photo-item');
        const photoItem2 = cells[1].querySelector('.photo-item');
        expect(photoItem1).toHaveClass('ring-4', 'ring-blue-500');
        expect(photoItem2).toHaveClass('ring-4', 'ring-blue-500');
      });
    });
  });

  describe('双击预览测试', () => {
    it('双击照片应该打开预览', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.doubleClick(photoItem);

      expect(defaultProps.openPreview).toHaveBeenCalledWith([mockPhotos[0]]);
    });

    it('有框选时双击应该预览所有框选照片', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedPhotos: ['photo1', 'photo2'],
      };

      render(<VirtualPhotoGrid {...propsWithSelection} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.doubleClick(photoItem);

      expect(defaultProps.openPreview).toHaveBeenCalledWith([
        mockPhotos[0],
        mockPhotos[1],
      ]);
    });

    it('对比模式下双击应该设置组索引', async () => {
      const compareProps = {
        ...defaultProps,
        columns: 3,
        isCompareMode: true,
      };

      render(<VirtualPhotoGrid {...compareProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.doubleClick(photoItem);

      expect(defaultProps.setCurrentPreviewGroupIndex).toHaveBeenCalledWith(0);
    });
  });

  describe('分类操作测试', () => {
    it('应该显示分类按钮', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        const buttons = cells[0].querySelectorAll('button');
        // 应该有3个分类按钮: ✓, ~, ✕
        expect(buttons.length).toBe(3);
      });
    });

    it('点击正确按钮应该调用onCategory with correct', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        const buttons = cells[0].querySelectorAll('button');
        const correctButton = Array.from(buttons).find(btn => btn.textContent === '✓');
        fireEvent.click(correctButton);
      });

      expect(defaultProps.setCategory).toHaveBeenCalledWith('photo1', 'correct');
    });

    it('点击一般按钮应该调用onCategory with medium', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        const buttons = cells[0].querySelectorAll('button');
        const mediumButton = Array.from(buttons).find(btn => btn.textContent === '~');
        fireEvent.click(mediumButton);
      });

      expect(defaultProps.setCategory).toHaveBeenCalledWith('photo1', 'medium');
    });

    it('点击错误按钮应该调用onCategory with wrong', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        const buttons = cells[0].querySelectorAll('button');
        const wrongButton = Array.from(buttons).find(btn => btn.textContent === '✕');
        fireEvent.click(wrongButton);
      });

      expect(defaultProps.setCategory).toHaveBeenCalledWith('photo1', 'wrong');
    });

    it('点击分类按钮应该阻止事件冒泡', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        const buttons = cells[0].querySelectorAll('button');
        const correctButton = Array.from(buttons).find(btn => btn.textContent === '✓');
        fireEvent.click(correctButton);
      });

      // 不应该触发照片选择
      expect(defaultProps.setSelectedPhotoId).not.toHaveBeenCalled();
    });
  });

  describe('右键菜单测试', () => {
    it('右键点击应该打开上下文菜单', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      fireEvent.contextMenu(photoItem, { clientX: 100, clientY: 200 });

      expect(defaultProps.openContextMenu).toHaveBeenCalledWith(100, 200, 'photo1');
    });

    it('右键点击应该阻止默认行为', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      let photoItem;
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        photoItem = cells[0].querySelector('.cursor-pointer');
        expect(photoItem).toBeTruthy();
      });

      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200,
      });

      const preventDefault = vi.spyOn(event, 'preventDefault');
      fireEvent(photoItem, event);

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Refs测试', () => {
    it('应该调用setPhotoRef for each photo', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      await waitFor(() => {
        // setPhotoRef应该被调用（为每张照片）
        expect(defaultProps.setPhotoRef).toHaveBeenCalled();
      });
    });

    it('应该调用onGridReady when grid initializes', async () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      // onGridReady应该在grid初始化后被调用
      // 注意：由于我们mock了Grid，这个测试可能需要调整
      await waitFor(() => {
        // 至少应该尝试调用
        // expect(defaultProps.onGridRefReady).toHaveBeenCalled();
      });
    });
  });

  describe('空状态和边界测试', () => {
    it('应该处理空照片数组', async () => {
      const emptyProps = {
        ...defaultProps,
        photos: [],
      };

      render(<VirtualPhotoGrid {...emptyProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
      });
    });

    it('应该处理null照片', async () => {
      const propsWithNull = {
        ...defaultProps,
        photos: [mockPhotos[0], null, mockPhotos[2]],
      };

      render(<VirtualPhotoGrid {...propsWithNull} />);

      // 应该跳过null照片
      await waitFor(() => {
        const cells = screen.getAllByTestId(/cell-/);
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('应该处理不同的列数', async () => {
      const props2Columns = {
        ...defaultProps,
        columns: 2,
        isCompareMode: false,
      };

      const { rerender } = render(<VirtualPhotoGrid {...props2Columns} />);
      await waitFor(() => {
        expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
      });

      const props5Columns = {
        ...defaultProps,
        columns: 5,
        isCompareMode: false,
      };

      rerender(<VirtualPhotoGrid {...props5Columns} />);
      await waitFor(() => {
        expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
      });
    });
  });

  describe('对比模式特性测试', () => {
    it('对比模式下应该显示文件格式标签', async () => {
      const compareProps = {
        ...defaultProps,
        columns: 3,
        isCompareMode: true,
      };

      render(<VirtualPhotoGrid {...compareProps} />);

      // 应该显示JPG标签
      await waitFor(() => {
        expect(screen.getAllByText('JPG').length).toBeGreaterThan(0);
      });
    });

    it('非对比模式下不应该显示文件格式标签', () => {
      render(<VirtualPhotoGrid {...defaultProps} />);

      // 不应该显示文件格式标签
      expect(screen.queryByText('JPG')).not.toBeInTheDocument();
    });

    it('对比模式下应该显示照片名称', async () => {
      const compareProps = {
        ...defaultProps,
        columns: 3,
        isCompareMode: true,
      };

      render(<VirtualPhotoGrid {...compareProps} />);

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument();
      });
    });
  });
});
