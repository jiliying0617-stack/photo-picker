import { useMemo, useEffect, useCallback, useState } from 'react';

/**
 * LRU 缓存的 Object URL 管理 (性能优化版)
 *
 * 优势:
 * - 限制最大 URL 数量，防止内存无限增长
 * - 自动淘汰最少使用的 URL
 * - 组件卸载时自动清理所有 URL
 * - 🔥 按需加载: 只在显示时才从 fileHandle 读取文件
 *
 * @param {number} maxSize - 最大缓存数量 (默认 200)
 * @returns {function} getPhotoUrl - 获取照片 URL 的函数
 */
export function useLRUObjectUrls(maxSize = 200) {
  const cache = useMemo(() => {
    const urlMap = new Map(); // key: photoId, value: url
    const pendingMap = new Map(); // key: photoId, value: Promise (防止重复加载)

    return {
      async get(photo) {
        // 优先使用 fileHandle (性能优化路径)
        if (photo?.fileHandle) {
          // 缓存命中：移动到末尾 (LRU 策略)
          if (urlMap.has(photo.id)) {
            const url = urlMap.get(photo.id);
            urlMap.delete(photo.id);
            urlMap.set(photo.id, url);
            return url;
          }

          // 正在加载中: 复用 Promise
          if (pendingMap.has(photo.id)) {
            return pendingMap.get(photo.id);
          }

          // 缓存已满：删除最旧的 URL
          if (urlMap.size >= maxSize) {
            const oldestKey = urlMap.keys().next().value;
            const oldestUrl = urlMap.get(oldestKey);
            URL.revokeObjectURL(oldestUrl);
            urlMap.delete(oldestKey);
          }

          // 🔥 按需加载: 从 fileHandle 获取文件 (只有在需要显示时才加载)
          const loadPromise = (async () => {
            try {
              const file = await photo.fileHandle.getFile();
              const url = URL.createObjectURL(file);
              urlMap.set(photo.id, url);
              pendingMap.delete(photo.id);
              return url;
            } catch (error) {
              console.error('Failed to load file from fileHandle:', error);
              pendingMap.delete(photo.id);
              return null;
            }
          })();

          pendingMap.set(photo.id, loadPromise);
          return loadPromise;
        }

        // 回退方案: 如果有 file 对象 (兼容旧逻辑)
        if (photo?.file) {
          // 缓存命中
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
        }

        return null;
      },

      clear() {
        urlMap.forEach(url => URL.revokeObjectURL(url));
        urlMap.clear();
        pendingMap.clear();
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

  const getPhotoUrl = useCallback(async (photo) => {
    return await cache.get(photo);
  }, [cache]);

  return getPhotoUrl;
}

/**
 * 在组件中使用照片 URL 的 Hook (处理异步加载)
 * @param {object} photo - 照片对象
 * @param {function} getPhotoUrl - URL 获取函数
 * @returns {string|null} URL 或 null
 */
export function usePhotoUrlLoader(photo, getPhotoUrl) {
  const [url, setUrl] = useState(() => {
    // 初始化时优先返回缩略图
    return photo?.thumbnailUrl || null;
  });

  useEffect(() => {
    let cancelled = false;

    // 优先使用预生成的缩略图
    if (photo?.thumbnailUrl) {
      setUrl(photo.thumbnailUrl);
      return;
    }

    // 异步加载 URL
    if (photo && getPhotoUrl) {
      getPhotoUrl(photo).then(loadedUrl => {
        if (!cancelled && loadedUrl) {
          setUrl(loadedUrl);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [photo?.id, photo?.thumbnailUrl, getPhotoUrl]);

  return url;
}
