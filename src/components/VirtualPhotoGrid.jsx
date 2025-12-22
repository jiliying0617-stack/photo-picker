import { memo, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import PhotoGridItem from './PhotoGridItem';

/**
 * 虚拟化照片网格组件
 * 使用 react-window 实现高性能大列表渲染
 */
const VirtualPhotoGrid = memo(function VirtualPhotoGrid({
  photos,
  columns,
  isCompareMode,
  selectedPhotoId,
  selectedPhotos,
  onPhotoClick,
  onPhotoDoubleClick,
  onPhotoContextMenu,
  onPlaceholderClick,
  onPlaceholderDoubleClick,
  setCategory,
  setSelectedPhotos,
}) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const gridRef = useRef(null);

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
  const availableWidth = containerSize.width - padding * 2 - gap * (columns - 1);
  const columnWidth = Math.floor(availableWidth / columns);
  const rowHeight = columnWidth; // 保持正方形比例

  // 单元格渲染器
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columns + columnIndex;
    if (index >= photos.length) return null;

    const photo = photos[index];

    return (
      <div style={style}>
        <div style={{ padding: gap / 2 }}>
          <PhotoGridItem
            photo={photo}
            index={index}
            isCompareMode={isCompareMode}
            selectedPhotoId={selectedPhotoId}
            selectedPhotos={selectedPhotos}
            onPhotoClick={onPhotoClick}
            onPhotoDoubleClick={onPhotoDoubleClick}
            onPhotoContextMenu={onPhotoContextMenu}
            onPlaceholderClick={onPlaceholderClick}
            onPlaceholderDoubleClick={onPlaceholderDoubleClick}
            setCategory={setCategory}
            setSelectedPhotos={setSelectedPhotos}
          />
        </div>
      </div>
    );
  };

  if (containerSize.width === 0 || containerSize.height === 0) {
    return <div ref={containerRef} className="flex-1" />;
  }

  return (
    <div ref={containerRef} className="flex-1">
      <Grid
        ref={gridRef}
        columnCount={columns}
        columnWidth={columnWidth + gap}
        height={containerSize.height}
        rowCount={rowCount}
        rowHeight={rowHeight + gap}
        width={containerSize.width}
        overscanRowCount={2}
        className="scrollbar-thin"
      >
        {Cell}
      </Grid>
    </div>
  );
});

export default VirtualPhotoGrid;
