import { useEffect } from 'react';

/**
 * Lightbox 键盘快捷键处理 Hook
 *
 * @param {Object} params
 * @param {Function} params.onClose - 关闭预览回调
 * @param {Function} params.onSpaceKey - 空格键处理（切换下一组）
 * @param {Function} params.onNextGroup - 下一组回调
 * @param {Function} params.onPrevGroup - 上一组回调
 * @param {Function} params.onCategory - 分类回调
 * @param {Function} params.onRotate - 旋转回调
 * @param {Function} params.onResetTransform - 重置缩放/平移
 * @param {Function} params.onCompareModeChange - 对比模式切换
 * @param {Object|null} params.contextMenu - 右键菜单状态
 * @param {Function} params.setContextMenu - 设置右键菜单
 * @param {string|null} params.lastViewedPhotoId - 最后查看的照片ID
 * @param {Array} params.photosWithUrls - 照片列表（用于Q键判断）
 */
export function useLightboxKeyboard({
  onClose,
  onSpaceKey,
  onNextGroup,
  onPrevGroup,
  onCategory,
  onRotate,
  onResetTransform,
  onCompareModeChange,
  contextMenu,
  setContextMenu,
  lastViewedPhotoId,
  photosWithUrls,
}) {
  // 主键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
        } else {
          console.log('🚪 关闭预览，最后查看的照片ID:', lastViewedPhotoId);
          onClose(lastViewedPhotoId);
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // 空格键：第一张图不动，其余图片切换下一组
        e.preventDefault();
        onSpaceKey();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onPrevGroup();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNextGroup();
      } else if (e.key === '1') {
        e.preventDefault();
        e.stopPropagation(); // 🔥 阻止事件冒泡到全局处理器
        onCategory('correct');
      } else if (e.key === '2') {
        e.preventDefault();
        e.stopPropagation(); // 🔥 阻止事件冒泡到全局处理器
        onCategory('medium');
      } else if (e.key === '3') {
        e.preventDefault();
        e.stopPropagation(); // 🔥 阻止事件冒泡到全局处理器
        onCategory('wrong');
      } else if (e.key === '0' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        e.stopPropagation(); // 🔥 阻止事件冒泡到全局处理器
        onCategory(null);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onResetTransform();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onRotate('counterclockwise'); // A键：逆时针旋转
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onRotate('clockwise'); // B键：顺时针旋转
      } else if (e.key === 'q' || e.key === 'Q') {
        // Q键按下时已在keydown单独处理，这里不做处理
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onClose,
    onSpaceKey,
    onNextGroup,
    onPrevGroup,
    onCategory,
    onRotate,
    onResetTransform,
    contextMenu,
    setContextMenu,
    lastViewedPhotoId,
  ]);

  // Q键按住对比，松开恢复
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        if (e.repeat) return; // 忽略长按重复事件
        e.preventDefault();

        // 计算真实照片总数（过滤null）
        const realPhotos = photosWithUrls.photos.filter(p => p);

        if (realPhotos.length < 2) {
          // 少于2张照片，无法对比
          return;
        }

        // 按下Q：开启对比模式
        onCompareModeChange(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        // 松开Q：关闭对比模式
        onCompareModeChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [photosWithUrls, onCompareModeChange]);
}
