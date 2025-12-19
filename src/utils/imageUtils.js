/**
 * 图片工具函数
 * 用于提取图片格式、分辨率等元数据
 */

/**
 * 获取文件扩展名（大写）
 * @param {string} filename - 文件名
 * @returns {string} 扩展名，例如 "JPG", "PNG", "RAW"
 */
export function getFileFormat(filename) {
  if (!filename) return 'UNKNOWN';

  const ext = filename.toLowerCase().match(/\.[^/.]+$/);
  if (!ext) return 'UNKNOWN';

  const format = ext[0].substring(1).toUpperCase();

  // RAW 格式统一显示为 RAW
  const rawFormats = ['CR2', 'NEF', 'ARW', 'DNG', 'RAF', 'ORF', 'RW2'];
  if (rawFormats.includes(format)) {
    return 'RAW';
  }

  // JPEG 简化显示
  if (format === 'JPEG') {
    return 'JPG';
  }

  return format;
}

/**
 * 获取格式角标的颜色
 * @param {string} format - 文件格式
 * @returns {object} 包含背景色和文字色的对象
 */
export function getFormatBadgeColor(format) {
  const colorMap = {
    'JPG': { bg: 'bg-blue-500', text: 'text-white' },
    'PNG': { bg: 'bg-green-500', text: 'text-white' },
    'WEBP': { bg: 'bg-purple-500', text: 'text-white' },
    'GIF': { bg: 'bg-pink-500', text: 'text-white' },
    'RAW': { bg: 'bg-orange-500', text: 'text-white' },
    'TIFF': { bg: 'bg-indigo-500', text: 'text-white' },
    'BMP': { bg: 'bg-gray-500', text: 'text-white' },
    'SVG': { bg: 'bg-yellow-500', text: 'text-gray-900' },
  };

  return colorMap[format] || { bg: 'bg-gray-400', text: 'text-white' };
}

/**
 * 从 File 对象异步获取图片尺寸
 * @param {File} file - 文件对象
 * @returns {Promise<{width: number, height: number}>} 图片尺寸
 */
export async function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小，例如 "2.5 MB"
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
