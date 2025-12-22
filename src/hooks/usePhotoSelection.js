import { useState } from 'react';

/**
 * 图片框选逻辑 Hook
 * 处理多选（框选）操作
 * 注意：单选 (selectedPhotoId) 由 store 管理，不在此 hook 中
 */
export function usePhotoSelection() {
  const [selectedPhotos, setSelectedPhotos] = useState([]); // 框选的图片ID数组

  // 切换框选状态
  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // 清除框选
  const clearSelection = () => {
    setSelectedPhotos([]);
  };

  return {
    selectedPhotos,
    setSelectedPhotos,
    togglePhotoSelection,
    clearSelection,
  };
}
