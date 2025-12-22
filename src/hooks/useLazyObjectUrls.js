import { useState, useEffect, useCallback, useRef } from 'react';
import { generateThumbnail } from '../utils/thumbnailGenerator';

/**
 * 懒加载 Object URLs Hook（支持缩略图优化）
 * 只为可见区域的照片创建 Object URLs，极大提升大数据集性能
 *
 * 优化说明：
 * - 按需创建：只为可见+缓冲区照片创建URL
 * - 双URL策略：缩略图（300px）用于网格，完整图用于预览
 * - 延迟清理：滚动出视野的URL不立即清理（避免频繁创建/销毁）
 * - 智能缓存：保留最近使用的URL（LRU策略）
 * - 支持800+组文件：因为只创建可见的URL，内存占用极低
 */
export function useLazyObjectUrls(allPhotos) {
  // URL缓存 Map: photoId -> { thumbnailUrl, fullUrl, lastUsed }
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
        const [id, { thumbnailUrl, fullUrl }] = entries[i];
        if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
        if (fullUrl) URL.revokeObjectURL(fullUrl);
        cache.delete(id);
      }
    }

    // 清理过期的URL
    cache.forEach(({ thumbnailUrl, fullUrl, lastUsed }, id) => {
      if (now - lastUsed > STALE_TIMEOUT) {
        // 检查这个照片是否还存在于allPhotos中
        const photoExists = allPhotos.some(p => p && p.id === id);
        if (!photoExists) {
          if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
          if (fullUrl) URL.revokeObjectURL(fullUrl);
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
    const urlCache = urlCacheRef.current; // 复制 ref 值，避免 cleanup 时引用已改变的值
    return () => {
      urlCache.forEach(({ thumbnailUrl, fullUrl }) => {
        if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
        if (fullUrl) URL.revokeObjectURL(fullUrl);
      });
      urlCache.clear();
    };
  }, []);

  // 获取或创建缩略图 URL（用于网格显示）
  const getThumbnailUrl = useCallback(async (photo) => {
    if (!photo || !photo.file) return null;

    const cache = urlCacheRef.current;
    const cached = cache.get(photo.id);

    if (cached && cached.thumbnailUrl) {
      // 更新最后使用时间
      cached.lastUsed = Date.now();
      return cached.thumbnailUrl;
    }

    try {
      // 生成缩略图（300px，质量 0.8）
      const thumbnailBlob = await generateThumbnail(photo.file, 300, 0.8);
      const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

      // 更新缓存
      if (cached) {
        cached.thumbnailUrl = thumbnailUrl;
        cached.lastUsed = Date.now();
      } else {
        cache.set(photo.id, {
          thumbnailUrl,
          fullUrl: null,
          lastUsed: Date.now(),
        });
      }

      return thumbnailUrl;
    } catch (error) {
      console.warn('缩略图生成失败，使用原图:', photo.name, error);
      // 降级：使用原图
      return getFullUrl(photo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // getFullUrl 是稳定的（依赖数组为空），不需要添加到依赖中

  // 获取或创建完整图 URL（用于预览）
  const getFullUrl = useCallback((photo) => {
    if (!photo || !photo.file) return null;

    const cache = urlCacheRef.current;
    const cached = cache.get(photo.id);

    if (cached && cached.fullUrl) {
      // 更新最后使用时间
      cached.lastUsed = Date.now();
      return cached.fullUrl;
    }

    // 创建完整图 URL
    const fullUrl = URL.createObjectURL(photo.file);

    // 更新缓存
    if (cached) {
      cached.fullUrl = fullUrl;
      cached.lastUsed = Date.now();
    } else {
      cache.set(photo.id, {
        thumbnailUrl: null,
        fullUrl,
        lastUsed: Date.now(),
      });
    }

    return fullUrl;
  }, []);

  // 兼容旧代码：默认返回缩略图（同步版本）
  const getPhotoUrl = useCallback((photo) => {
    if (!photo || !photo.file) return null;

    const cache = urlCacheRef.current;
    const cached = cache.get(photo.id);

    // 优先返回已缓存的缩略图
    if (cached && cached.thumbnailUrl) {
      cached.lastUsed = Date.now();
      return cached.thumbnailUrl;
    }

    // 如果没有缩略图，返回完整图
    if (cached && cached.fullUrl) {
      cached.lastUsed = Date.now();
      return cached.fullUrl;
    }

    // 都没有，返回完整图（同步）
    return getFullUrl(photo);
  }, [getFullUrl]);

  // 批量预加载缩略图（优化：使用 requestIdleCallback 避免阻塞主线程）
  const preloadUrls = useCallback(async (photos) => {
    if (!photos || photos.length === 0) return;

    // 分批处理，每批5个（缩略图生成需要时间）
    const batchSize = 5;
    let currentIndex = 0;
    let createdCount = 0;

    const processBatch = async () => {
      const batch = photos.slice(currentIndex, currentIndex + batchSize);

      // 并行生成当前批次的缩略图
      await Promise.all(
        batch.map(async (photo) => {
          if (photo && photo.file) {
            const cached = urlCacheRef.current.get(photo.id);
            // 只为没有缩略图的照片生成
            if (!cached || !cached.thumbnailUrl) {
              await getThumbnailUrl(photo);
              createdCount++;
            }
          }
        })
      );

      currentIndex += batchSize;

      // 如果还有未处理的照片，继续下一批
      if (currentIndex < photos.length) {
        // 使用 requestIdleCallback 或 setTimeout 避免阻塞
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(processBatch, { timeout: 100 });
        } else {
          setTimeout(processBatch, 0);
        }
      } else if (createdCount > 0) {
        // 所有批次完成后触发重新渲染
        forceUpdate(prev => prev + 1);
      }
    };

    // 立即开始第一批（确保首屏快速显示）
    processBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // getThumbnailUrl 是稳定的，forceUpdate 也是稳定的，不需要添加到依赖中

  return {
    getPhotoUrl,        // 获取单个照片的URL（兼容旧代码，优先返回缩略图）
    getThumbnailUrl,    // 获取缩略图URL（异步，用于网格）
    getFullUrl,         // 获取完整图URL（同步，用于预览）
    preloadUrls,        // 批量预加载缩略图
    cacheSize: urlCacheRef.current.size, // 当前缓存大小（调试用）
  };
}
