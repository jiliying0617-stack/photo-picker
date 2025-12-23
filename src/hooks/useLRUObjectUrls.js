import { useMemo, useEffect, useCallback } from 'react';

/**
 * LRU 缓存的 Object URL 管理
 *
 * 优势:
 * - 限制最大 URL 数量，防止内存无限增长
 * - 自动淘汰最少使用的 URL
 * - 组件卸载时自动清理所有 URL
 *
 * @param {number} maxSize - 最大缓存数量 (默认 200)
 * @returns {function} getPhotoUrl - 获取照片 URL 的函数
 */
export function useLRUObjectUrls(maxSize = 200) {
  const cache = useMemo(() => {
    const urlMap = new Map(); // key: photoId, value: url

    return {
      get(photo) {
        if (!photo?.file) return null;

        // 缓存命中：移动到末尾 (LRU 策略)
        if (urlMap.has(photo.id)) {
          const url = urlMap.get(photo.id);
          urlMap.delete(photo.id);
          urlMap.set(photo.id, url);
          return url;
        }

        // 缓存已满：删除最旧的 URL
        if (urlMap.size >= maxSize) {
          const oldestKey = urlMap.keys().next().value;
          const oldestUrl = urlMap.get(oldestKey);
          URL.revokeObjectURL(oldestUrl);
          urlMap.delete(oldestKey);
        }

        // 创建新 URL 并加入缓存
        const url = URL.createObjectURL(photo.file);
        urlMap.set(photo.id, url);
        return url;
      },

      clear() {
        urlMap.forEach(url => URL.revokeObjectURL(url));
        urlMap.clear();
      },

      getSize() {
        return urlMap.size;
      }
    };
  }, [maxSize]);

  // 组件卸载时清理所有 URL
  useEffect(() => {
    return () => {
      cache.clear();
    };
  }, [cache]);

  const getPhotoUrl = useCallback((photo) => {
    return cache.get(photo);
  }, [cache]);

  return getPhotoUrl;
}
