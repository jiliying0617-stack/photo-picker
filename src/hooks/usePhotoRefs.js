import { useRef, useCallback } from 'react';

/**
 * 照片引用管理 Hook
 * 用 O(1) 的 Map 查找替换 O(n) 的 querySelectorAll
 */
export function usePhotoRefs() {
  const photoRefsMap = useRef(new Map());
  const gridRef = useRef(null);

  // 设置照片引用
  const setPhotoRef = useCallback((photoId, element) => {
    if (element) {
      photoRefsMap.current.set(photoId, element);
    } else {
      photoRefsMap.current.delete(photoId);
    }
  }, []);

  // 获取照片引用
  const getPhotoRef = useCallback((photoId) => {
    return photoRefsMap.current.get(photoId);
  }, []);

  // 滚动到指定照片 - O(1) 性能
  const scrollToPhoto = useCallback((photoId, options = {}) => {
    const element = photoRefsMap.current.get(photoId);
    if (element) {
      element.scrollIntoView({
        behavior: options.behavior || 'smooth',
        block: options.block || 'center',
      });
      return true;
    }
    return false;
  }, []);

  // 滚动到指定索引（用于虚拟列表）
  const scrollToIndex = useCallback((rowIndex, columnIndex = 0) => {
    if (gridRef.current && gridRef.current.scrollToItem) {
      gridRef.current.scrollToItem({
        rowIndex,
        columnIndex,
        align: 'start',
      });
      return true;
    }
    return false;
  }, []);

  // 清空所有引用
  const clearRefs = useCallback(() => {
    photoRefsMap.current.clear();
  }, []);

  return {
    gridRef,
    setPhotoRef,
    getPhotoRef,
    scrollToPhoto,
    scrollToIndex,
    clearRefs,
  };
}
