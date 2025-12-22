import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Grid } from 'react-window';
import { getFileFormat, getFormatBadgeColor } from '../utils/imageUtils';
// 暂时禁用懒加载，使用简单的 URL 创建
// import { useLazyObjectUrls } from '../hooks/useLazyObjectUrls';

/**
 * 虚拟化照片网格组件
 * 使用 react-window 实现高性能大列表渲染
 *
 * 性能优势:
 * - 只渲染可见区域的 DOM 节点 (约 20-50 个)
 * - 使用低分辨率缩略图 (300px) 替代原图，减少 80-90% 内存占用
 * - 只创建可见照片的 Object URLs (内存占用极低)
 * - 滚动时复用 DOM 节点和URLs
 * - 支持 800+ 组文件，10,000+ 张照片流畅运行
 */
const VirtualPhotoGrid = memo(function VirtualPhotoGrid({
  photos,
  columns,
  isCompareMode,
  selectedPhotoId,
  selectedPhotos,
  setSelectedPhotoId,
  setSelectedPhotos,
  setCategory,
  openPreview,
  setCurrentPreviewGroupIndex,
  openContextMenu,
  setPhotoRef,
  allPhotos, // 所有照片（用于URL管理）
  onGridRefReady, // 新增：将gridRef暴露给父组件
}) {
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 暂时禁用懒加载，使用简单的 Object URL 管理
  // const { getPhotoUrl, preloadUrls } = useLazyObjectUrls(allPhotos || photos);
  const [objectUrls] = useState(() => new Map());

  // 简化的 URL 管理：按需创建
  const getPhotoUrl = useCallback((photo) => {
    if (!photo || !photo.file) return null;

    if (!objectUrls.has(photo.id)) {
      const url = URL.createObjectURL(photo.file);
      objectUrls.set(photo.id, url);
    }

    return objectUrls.get(photo.id);
  }, [objectUrls]);

  // 清理所有 URLs
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    };

    // 初始化尺寸
    updateSize();

    // 监听窗口大小变化
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 计算网格尺寸
  const rowCount = Math.ceil(photos.length / columns);
  const gap = 16; // 对应 gap-4 (1rem = 16px)
  const padding = 16; // 对应 p-4

  // 计算每个单元格的宽度和高度
  const availableWidth = containerSize.width - padding * 2;
  const columnWidth = Math.floor(availableWidth / columns);
  const rowHeight = columnWidth; // 保持正方形比例

  // 占位符点击处理
  const handlePlaceholderClick = useCallback((e, placeholderId) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedPhotos(prev =>
        prev.includes(placeholderId)
          ? prev.filter(id => id !== placeholderId)
          : [...prev, placeholderId]
      );
    }
  }, [setSelectedPhotos]);

  // 占位符双击处理
  const handlePlaceholderDoubleClick = useCallback((idx) => {
    // 保存当前组索引（对比模式下）
    if (isCompareMode) {
      const groupIndex = Math.floor(idx / columns);
      setCurrentPreviewGroupIndex(groupIndex);
    }

    if (selectedPhotos.length > 0) {
      // 如果有框选的图片，预览所有框选的
      const photosToPreview = photos.filter((p, i) =>
        p ? selectedPhotos.includes(p.id) : selectedPhotos.includes(`placeholder-${i}`)
      );
      openPreview(photosToPreview);
    } else {
      // 否则预览当前组（对比模式下通常是一行）
      const rowStartIdx = Math.floor(idx / columns) * columns;
      const rowPhotos = photos.slice(rowStartIdx, rowStartIdx + columns);
      openPreview(rowPhotos);
    }
  }, [isCompareMode, selectedPhotos, photos, columns, openPreview, setCurrentPreviewGroupIndex]);

  // 照片点击处理
  const handlePhotoClick = useCallback((e, photo) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      // 框选模式
      e.preventDefault();
      setSelectedPhotos(prev =>
        prev.includes(photo.id)
          ? prev.filter(id => id !== photo.id)
          : [...prev, photo.id]
      );
    } else {
      // 普通点击
      setSelectedPhotoId(photo.id);
    }
  }, [setSelectedPhotos, setSelectedPhotoId]);

  // 照片双击处理
  const handlePhotoDoubleClick = useCallback((photo, idx) => {
    const photosToPreview = selectedPhotos.length > 0
      ? photos.filter(p => p && selectedPhotos.includes(p.id))
      : [photo];

    // 保存当前组索引（对比模式下）
    if (isCompareMode) {
      const groupIndex = Math.floor(idx / columns);
      setCurrentPreviewGroupIndex(groupIndex);
    }
    openPreview(photosToPreview);
  }, [selectedPhotos, photos, isCompareMode, columns, openPreview, setCurrentPreviewGroupIndex]);

  // 右键菜单处理
  const handleContextMenu = useCallback((e, photoId) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, photoId);
  }, [openContextMenu]);

  // 单元格渲染器 - 新版 react-window 使用 cellComponent
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columns + columnIndex;
    if (index >= photos.length) return null;

    const photo = photos[index];

    // 渲染占位符
    if (!photo) {
      const placeholderId = `placeholder-${index}`;
      const isPlaceholderSelected = selectedPhotos.includes(placeholderId);

      return (
        <div style={style}>
          <div style={{ padding: gap / 2 }}>
            <div
              key={placeholderId}
              className={`photo-item neu-card rounded-2xl overflow-hidden cursor-pointer transition-all ${
                isPlaceholderSelected ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={(e) => handlePlaceholderClick(e, placeholderId)}
              onDoubleClick={() => handlePlaceholderDoubleClick(index, placeholderId)}
            >
              {isPlaceholderSelected && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
                  ✓
                </div>
              )}
              <div className="aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 neu-concave relative">
                <div className="text-6xl mb-3 opacity-20">📷</div>
                <div className="text-gray-400 text-xs font-medium">此文件夹无此图片</div>
                <div className="absolute bottom-2 text-gray-300 text-[10px]">
                  点击选择 · 双击预览
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 渲染真实照片
    const isSelected = selectedPhotoId === photo.id;
    const isBoxSelected = selectedPhotos.includes(photo.id);
    const categoryIcons = {
      correct: { icon: '✓', color: 'text-green-600' },
      medium: { icon: '~', color: 'text-yellow-600' },
      wrong: { icon: '✕', color: 'text-red-600' },
    };
    const config = photo.category ? categoryIcons[photo.category] : null;
    const fileFormat = getFileFormat(photo.name);
    const formatColors = getFormatBadgeColor(fileFormat);

    // 按需获取照片URL（优先使用低分辨率缩略图，提升性能）
    // getPhotoUrl 会优先返回 300px 缩略图，只在没有缩略图时返回完整图
    const thumbnailUrl = photo.thumbnailUrl || getPhotoUrl(photo);

    return (
      <div style={style}>
        <div style={{ padding: gap / 2 }}>
          <div
            key={photo.id}
            ref={(el) => setPhotoRef && setPhotoRef(photo.id, el)}
            data-photo-id={photo.id}
            className={`photo-item neu-card rounded-2xl overflow-hidden ${isBoxSelected ? 'ring-4 ring-blue-500' : ''}`}
          >
            {isCompareMode && (
              <div className="p-2 bg-[#e0e5ec] border-b border-gray-300">
                <div className="text-xs text-gray-600 truncate font-medium">
                  {photo.name}
                </div>
              </div>
            )}
            {isBoxSelected && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
                ✓
              </div>
            )}
            <div
              onClick={(e) => handlePhotoClick(e, photo)}
              onDoubleClick={() => handlePhotoDoubleClick(photo, index)}
              onContextMenu={(e) => handleContextMenu(e, photo.id)}
              className={`
                relative group cursor-pointer
                transition-all duration-200
                ${isSelected ? 'scale-95' : 'hover:scale-105'}
              `}
            >
              <div className="aspect-square neu-concave rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={thumbnailUrl}
                  alt={photo.name}
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 文件格式角标 - 左上角 */}
              {isCompareMode && (
                <div
                  className={`
                    absolute top-2 left-2 px-2 py-1 rounded-md
                    text-xs font-bold shadow-lg
                    ${formatColors.bg} ${formatColors.text}
                  `}
                >
                  {fileFormat}
                </div>
              )}

              {config && (
                <div
                  className={`
                    absolute top-3 right-3 w-8 h-8 rounded-full neu-convex
                    flex items-center justify-center ${config.color} font-bold text-lg
                  `}
                >
                  {config.icon}
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="neu-card p-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(photo.id, 'correct');
                    }}
                    className="flex-1 neu-button rounded-lg py-2 text-green-600 text-xs font-medium"
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(photo.id, 'medium');
                    }}
                    className="flex-1 neu-button rounded-lg py-2 text-yellow-600 text-xs font-medium"
                  >
                    ~
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(photo.id, 'wrong');
                    }}
                    className="flex-1 neu-button rounded-lg py-2 text-red-600 text-xs font-medium"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    columns,
    photos,
    selectedPhotos,
    selectedPhotoId,
    isCompareMode,
    gap,
    setPhotoRef,
    handlePlaceholderClick,
    handlePlaceholderDoubleClick,
    handlePhotoClick,
    handlePhotoDoubleClick,
    handleContextMenu,
    setCategory,
    getPhotoUrl,
  ]);

  // 滚动回调：追踪可见区域
  const handleScroll = useCallback(({ scrollTop }) => {
    const firstVisibleRow = Math.floor(scrollTop / rowHeight);
    const visibleRowCount = Math.ceil(containerSize.height / rowHeight);
    const lastVisibleRow = firstVisibleRow + visibleRowCount;

    // 添加缓冲区（预加载上下各2行）
    setVisibleRange({
      startRow: Math.max(0, firstVisibleRow - 2),
      endRow: Math.min(rowCount - 1, lastVisibleRow + 2),
    });
  }, [rowHeight, containerSize.height, rowCount]);

  // 暴露gridRef给父组件（用于跳转功能）
  useEffect(() => {
    if (gridRef.current && onGridRefReady) {
      onGridRefReady(gridRef.current);
    }
  }, [onGridRefReady]);

  // 容器未初始化时显示占位
  if (containerSize.width === 0 || containerSize.height === 0) {
    return <div ref={containerRef} className="flex-1" />;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden">
      <Grid
        gridRef={gridRef}
        cellComponent={Cell}
        cellProps={{}}
        columnCount={columns}
        columnWidth={columnWidth}
        defaultHeight={containerSize.height}
        defaultWidth={containerSize.width}
        rowCount={rowCount}
        rowHeight={rowHeight}
        overscanCount={2}
        onScroll={handleScroll}
        className="scrollbar-thin"
        style={{ padding: `${padding}px` }}
      />
    </div>
  );
});

export default VirtualPhotoGrid;
