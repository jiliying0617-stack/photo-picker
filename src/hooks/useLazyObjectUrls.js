import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 懒加载 Object URLs Hook
 * 只为可见区域的照片创建 Object URLs，极大提升大数据集性能
 *
 * 优化说明：
 * - 按需创建：只为可见+缓冲区照片创建URL
 * - 延迟清理：滚动出视野的URL不立即清理（避免频繁创建/销毁）
 * - 智能缓存：保留最近使用的URL（LRU策略）
 * - 支持800+组文件：因为只创建可见的URL，内存占用极低
 */
export function useLazyObjectUrls(allPhotos) {
  // URL缓存 Map: photoId -> { url, lastUsed }
  const urlCacheRef = useRef(new Map());
  const [, forceUpdate] = useState(0);

  // 清理过期的URL（LRU策略）
  const cleanupStaleUrls = useCallback(() => {
    const cache = urlCacheRef.current;
    const now = Date.now();
    const STALE_TIMEOUT = 30000; // 30秒未使用的URL被清理
    const MAX_CACHE_SIZE = 200; // 最多缓存200个URL

    // 如果缓存太大，清理最旧的
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      // 按最后使用时间排序
      entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

      // 清理最旧的20%
      const toRemove = Math.floor(cache.size * 0.2);
      for (let i = 0; i < toRemove; i++) {
        const [id, { url }] = entries[i];
        URL.revokeObjectURL(url);
        cache.delete(id);
      }
    }

    // 清理过期的URL
    cache.forEach(({ url, lastUsed }, id) => {
      if (now - lastUsed > STALE_TIMEOUT) {
        // 检查这个照片是否还存在于allPhotos中
        const photoExists = allPhotos.some(p => p.id === id);
        if (!photoExists) {
          URL.revokeObjectURL(url);
          cache.delete(id);
        }
      }
    });
  }, [allPhotos]);

  // 定期清理过期URL
  useEffect(() => {
    const interval = setInterval(cleanupStaleUrls, 10000); // 每10秒清理一次
    return () => clearInterval(interval);
  }, [cleanupStaleUrls]);

  // 组件卸载时清理所有URL
  useEffect(() => {
    return () => {
      urlCacheRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
      urlCacheRef.current.clear();
    };
  }, []);

  // 获取或创建照片的Object URL
  const getPhotoUrl = useCallback((photo) => {
    if (!photo || !photo.file) return null;

    const cache = urlCacheRef.current;
    const cached = cache.get(photo.id);

    if (cached) {
      // 更新最后使用时间
      cached.lastUsed = Date.now();
      return cached.url;
    }

    // 创建新的URL
    const url = URL.createObjectURL(photo.file);
    cache.set(photo.id, { url, lastUsed: Date.now() });

    return url;
  }, []);

  // 批量预加载照片URL（优化：使用 requestIdleCallback 避免阻塞主线程）
  const preloadUrls = useCallback((photos) => {
    if (!photos || photos.length === 0) return;

    // 分批处理，每批10个，避免一次性创建太多URL阻塞UI
    const batchSize = 10;
    let currentIndex = 0;

    const processBatch = () => {
      const batch = photos.slice(currentIndex, currentIndex + batchSize);
      let created = 0;

      batch.forEach(photo => {
        if (photo && photo.file && !urlCacheRef.current.has(photo.id)) {
          getPhotoUrl(photo);
          created++;
        }
      });

      currentIndex += batchSize;

      // 如果还有未处理的照片，继续下一批
      if (currentIndex < photos.length) {
        // 使用 requestIdleCallback 或 setTimeout 避免阻塞
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(processBatch, { timeout: 100 });
        } else {
          setTimeout(processBatch, 0);
        }
      } else if (created > 0) {
        // 所有批次完成后才触发重新渲染
        forceUpdate(prev => prev + 1);
      }
    };

    // 立即开始第一批（确保首屏快速显示）
    processBatch();
  }, [getPhotoUrl]);

  return {
    getPhotoUrl,      // 获取单个照片的URL
    preloadUrls,      // 批量预加载URLs
    cacheSize: urlCacheRef.current.size, // 当前缓存大小（调试用）
  };
}
