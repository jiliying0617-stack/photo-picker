import { useCallback } from 'react';

/**
 * 照片文件操作 Hook
 *
 * 提供在访达中显示文件和复制文件路径的功能
 *
 * @param {Array} photos - 照片列表
 * @param {Function} setContextMenu - 设置右键菜单状态
 * @param {Function} showNotification - 显示通知回调
 * @returns {Object} { handleShowInFinder, handleCopyPath }
 */
export function usePhotoFileOperations(photos, setContextMenu, showNotification) {
  // 在访达中显示文件
  const handleShowInFinder = useCallback(async (photoId) => {
    const photo = photos.find(p => p && p.id === photoId);
    if (!photo) return;

    try {
      // 优先方案: 使用浏览器扩展（真正的系统级打开）
      if (window.showInFinder && photo.path) {
        try {
          await window.showInFinder(photo.path);
          console.log('✅ 已通过扩展在访达中打开:', photo.path);
          setContextMenu(null);
          return;
        } catch (extError) {
          console.warn('扩展调用失败，回退到下载方案:', extError.message);
        }
      }

      // 回退方案1: 如果有 fileHandle，使用它来触发下载
      if (photo.fileHandle) {
        const file = await photo.fileHandle.getFile();
        const url = URL.createObjectURL(file);

        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        console.log('📁 已触发下载，请在浏览器下载栏点击"在访达中显示"');
        setContextMenu(null);
      }
      // 回退方案2: 如果有 file 对象
      else if (photo.file) {
        const url = URL.createObjectURL(photo.file);

        const a = document.createElement('a');
        a.href = url;
        a.download = photo.file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        console.log('📁 已触发下载，请在浏览器下载栏点击"在访达中显示"');
        setContextMenu(null);
      }
    } catch (error) {
      console.error('操作失败:', error);
    }
  }, [photos, setContextMenu]);

  // 复制文件路径到剪贴板
  const handleCopyPath = useCallback(async (photoId) => {
    const photo = photos.find(p => p && p.id === photoId);
    if (!photo) return;

    try {
      // 复制文件路径到剪贴板
      await navigator.clipboard.writeText(photo.path);

      // 显示成功提示
      showNotification(true);
      setTimeout(() => showNotification(false), 2000);

      console.log('📋 已复制文件路径:', photo.path);
    } catch (error) {
      console.error('复制路径失败:', error);
      // 降级方案：使用旧的复制方法
      const textArea = document.createElement('textarea');
      textArea.value = photo.path;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showNotification(true);
        setTimeout(() => showNotification(false), 2000);
      } catch (err) {
        console.error('降级复制方法也失败:', err);
      }
      document.body.removeChild(textArea);
    }
  }, [photos, showNotification]);

  return {
    handleShowInFinder,
    handleCopyPath,
  };
}
