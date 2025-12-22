import { useState, useEffect, useMemo } from 'react';

/**
 * Object URLs 生命周期管理 Hook
 * 创建、缓存和清理图片的 Object URLs
 */
export function useObjectUrls(displayPhotos, allPhotos) {
  const [objectUrls, setObjectUrls] = useState(new Map());

  // 管理 Object URLs 生命周期
  useEffect(() => {
    setObjectUrls((prevUrls) => {
      const newUrls = new Map(prevUrls);
      const allPhotoIds = new Set(allPhotos.map((p) => p.id));

      // 为需要的照片创建 URL
      displayPhotos.forEach((photo) => {
        if (photo && photo.file && !newUrls.has(photo.id)) {
          const url = URL.createObjectURL(photo.file);
          newUrls.set(photo.id, url);
        }
      });

      // 只清理已经从 photos 数组中删除的 URL
      const idsToRemove = [];
      newUrls.forEach((url, id) => {
        if (!allPhotoIds.has(id)) {
          URL.revokeObjectURL(url);
          idsToRemove.push(id);
        }
      });
      idsToRemove.forEach((id) => newUrls.delete(id));

      return newUrls;
    });
  }, [displayPhotos, allPhotos]);

  // 组件卸载时清理所有 URLs
  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 为显示的图片附加 URL
  const displayPhotosWithUrls = useMemo(() => {
    return displayPhotos.map((photo) => {
      if (!photo) return null;

      // 如果已经有 thumbnailUrl，直接返回原对象
      if (photo.thumbnailUrl) {
        return photo;
      }

      const url = objectUrls.get(photo.id);
      if (url) {
        return { ...photo, thumbnailUrl: url };
      }
      return photo;
    });
  }, [displayPhotos, objectUrls]);

  return displayPhotosWithUrls;
}
