import { useState } from 'react';

/**
 * 图片预览 Hook
 * 管理大图预览的状态和操作
 */
export function usePhotoPreview() {
  const [previewPhotos, setPreviewPhotos] = useState(null);
  const [currentPreviewGroupIndex, setCurrentPreviewGroupIndex] = useState(0);

  const openPreview = (photos, groupIndex = 0) => {
    setPreviewPhotos(photos);
    setCurrentPreviewGroupIndex(groupIndex);
  };

  const closePreview = () => {
    setPreviewPhotos(null);
  };

  const updatePreviewPhotos = (photos) => {
    setPreviewPhotos(photos);
  };

  return {
    previewPhotos,
    currentPreviewGroupIndex,
    openPreview,
    closePreview,
    updatePreviewPhotos,
    setCurrentPreviewGroupIndex,
  };
}
