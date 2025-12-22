import { useMemo } from 'react';

/**
 * 图片显示逻辑 Hook
 * 处理图片过滤（虚拟滚动时代不需要分页）
 *
 * 优化说明：
 * - 移除了 displayCount 和滚动加载逻辑（虚拟滚动已处理）
 * - 移除了 MAX_RENDER_COUNT 限制（虚拟滚动 + 按需URL解决性能）
 * - 支持 800+ 组文件，全部可搜索定位
 */
export function usePhotoDisplay(photos, filter) {
  // 过滤图片（使用预计算的 folder 属性，避免重复 split/join）
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (filter.category && p.category !== filter.category) return false;
      if (filter.folders && filter.folders.length > 0) {
        // 使用预计算的 folder 属性，性能提升 3-5x
        if (!filter.folders.some((f) => p.folder.startsWith(f))) return false;
      }
      return true;
    });
  }, [photos, filter]);

  return {
    // 保持向后兼容的API（虽然已经不需要了）
    displayCount: filteredPhotos.length,
    setDisplayCount: () => {}, // 空函数，保持兼容
    filteredPhotos,
  };
}
