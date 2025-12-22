/**
 * 缩略图生成工具
 * 使用 Canvas API 将图片压缩为低分辨率缩略图，提升网格性能
 */

/**
 * 生成低分辨率缩略图
 * @param {File} file - 原始图片文件
 * @param {number} maxSize - 缩略图最大尺寸（宽或高）
 * @param {number} quality - JPEG 压缩质量 (0-1)
 * @returns {Promise<Blob>} 缩略图 Blob
 */
export async function generateThumbnail(file, maxSize = 300, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // 计算缩略图尺寸（保持宽高比）
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        // 创建 Canvas 并绘制缩小的图片
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        // 使用高质量缩放算法
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法生成缩略图'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };

    img.src = objectUrl;
  });
}

/**
 * 批量生成缩略图（使用 requestIdleCallback 避免阻塞）
 * @param {Array} files - 文件数组
 * @param {number} maxSize - 缩略图最大尺寸
 * @param {number} quality - JPEG 压缩质量
 * @param {Function} onProgress - 进度回调 (current, total)
 * @returns {Promise<Map>} 文件ID到缩略图Blob的映射
 */
export async function generateThumbnailsBatch(files, maxSize = 300, quality = 0.8, onProgress = null) {
  const thumbnails = new Map();
  let completed = 0;
  const total = files.length;

  for (const file of files) {
    try {
      const thumbnail = await generateThumbnail(file, maxSize, quality);
      thumbnails.set(file, thumbnail);
      completed++;

      if (onProgress) {
        onProgress(completed, total);
      }

      // 让出主线程，避免阻塞 UI
      if (completed % 5 === 0) {
        await new Promise(resolve => {
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(resolve, { timeout: 50 });
          } else {
            setTimeout(resolve, 0);
          }
        });
      }
    } catch (error) {
      console.warn('生成缩略图失败:', file.name, error);
      // 跳过失败的文件，继续处理
    }
  }

  return thumbnails;
}

/**
 * 计算缩略图相对原图的文件大小减少比例
 * @param {File} originalFile - 原始文件
 * @param {Blob} thumbnail - 缩略图 Blob
 * @returns {number} 减少百分比 (0-100)
 */
export function calculateSizeReduction(originalFile, thumbnail) {
  const originalSize = originalFile.size;
  const thumbnailSize = thumbnail.size;
  return Math.round(((originalSize - thumbnailSize) / originalSize) * 100);
}
