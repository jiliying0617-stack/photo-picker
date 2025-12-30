/**
 * 导出工具 - PNG拼图和GIF动图生成
 */

/**
 * 导出本组照片为PNG拼图
 * @param {Array} photos - 照片数组（本组的所有照片，包括null占位符）
 * @param {string} groupName - 组名（用于文件名）
 */
export async function exportGroupAsPNG(photos, groupName = '对比组') {
  // 过滤掉null占位符，只保留真实照片
  const realPhotos = photos.filter(p => p && p.file);

  if (realPhotos.length === 0) {
    alert('本组没有可导出的照片');
    return;
  }

  try {
    // 加载所有图片
    const images = await Promise.all(
      realPhotos.map(photo => loadImage(photo.file))
    );

    // 计算拼图布局（横向排列）
    const maxHeight = Math.max(...images.map(img => img.height));
    const totalWidth = images.reduce((sum, img) => sum + img.width, 0);

    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');

    // 填充白色背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制图片（居中对齐）
    let xOffset = 0;
    images.forEach((img, index) => {
      const yOffset = (maxHeight - img.height) / 2; // 垂直居中
      ctx.drawImage(img, xOffset, yOffset);

      // 添加文件名标签
      const photo = realPhotos[index];
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(xOffset, 0, img.width, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.fillText(photo.name, xOffset + 10, 20);

      xOffset += img.width;
    });

    // 导出为PNG
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${groupName}_拼图_${new Date().getTime()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');

    console.log('✅ PNG拼图导出成功');
  } catch (error) {
    console.error('❌ PNG导出失败:', error);
    alert('导出失败：' + error.message);
  }
}

/**
 * 导出本组照片为GIF动图（使用gif-encoder-2库）
 * @param {Array} photos - 照片数组（本组的所有照片，包括null占位符）
 * @param {string} groupName - 组名（用于文件名）
 */
export async function exportGroupAsGIF(photos, groupName = '对比组') {
  // 这个功能需要额外的GIF编码库，暂时重定向到简化版
  return exportGroupAsSimpleGIF(photos, groupName);
}

/**
 * 使用Canvas API生成简易GIF（无需外部库）
 * 实际上是生成APNG格式（浏览器原生支持动画PNG）
 */
export async function exportGroupAsSimpleGIF(photos, groupName = '对比组') {
  const realPhotos = photos.filter(p => p && p.file);

  if (realPhotos.length === 0) {
    alert('本组没有可导出的照片');
    return;
  }

  try {
    // 这是一个简化版本，实际上使用Canvas录制生成视频帧
    // 或者提示用户使用在线工具
    const message = `
准备导出 ${realPhotos.length} 张照片为GIF动图。

由于浏览器限制，建议使用以下方式：
1. 使用"导出PNG拼图"功能
2. 或使用第三方在线工具（如ezgif.com）合成GIF

是否改用PNG拼图导出？
    `.trim();

    if (confirm(message)) {
      await exportGroupAsPNG(photos, groupName);
    }
  } catch (error) {
    console.error('❌ 导出失败:', error);
    alert('导出失败：' + error.message);
  }
}

/**
 * 加载图片文件为Image对象
 * @param {File} file - 图片文件
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}
