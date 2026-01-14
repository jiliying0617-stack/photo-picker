import { useCallback } from 'react';
import { devLog } from '../utils/devLog';
import { ANIMATION } from '../constants';

/**
 * 预览关闭处理 Hook
 *
 * 管理预览关闭后的滚动定位逻辑
 *
 * @param {Object} params
 * @param {boolean} params.enableGroupNavigation - 是否启用组导航
 * @param {number} params.currentPreviewGroupIndex - 当前预览的组索引
 * @param {Array} params.displayPhotos - 当前显示的照片列表
 * @param {number} params.compareColumns - 对比列数
 * @param {Object|null} params.virtualGridRef - 虚拟网格引用
 * @param {Function} params.setSelectedPhotoId - 选中照片回调
 * @param {Function} params.closePreview - 关闭预览回调
 * @param {Function} params.clearSelection - 清除选择回调
 * @param {Function} params.scrollToGroup - 滚动到组回调
 * @returns {Function} onClose 回调函数
 */
export function usePreviewCloseHandler({
  enableGroupNavigation,
  currentPreviewGroupIndex,
  displayPhotos,
  compareColumns,
  virtualGridRef,
  setSelectedPhotoId,
  closePreview,
  clearSelection,
  scrollToGroup,
}) {
  return useCallback(
    (lastViewedPhotoId) => {
      devLog('📥 App收到关闭请求，照片ID:', lastViewedPhotoId);

      // 关闭预览并清除选择
      closePreview();
      clearSelection();

      // 关闭预览后滚动到组的位置
      if (enableGroupNavigation && currentPreviewGroupIndex >= 0) {
        // 对比模式或分组浏览模式：滚动到组的位置
        devLog('📍 关闭预览，跳转到组:', currentPreviewGroupIndex);
        setTimeout(() => scrollToGroup(currentPreviewGroupIndex), ANIMATION.TRANSITION_DELAY);
      } else if (lastViewedPhotoId) {
        // 普通模式：滚动到具体照片
        const finalPhoto = displayPhotos.find(p => p && p.id === lastViewedPhotoId);
        if (finalPhoto) {
          setTimeout(() => {
            const photoIndex = displayPhotos.findIndex(p => p && p.id === finalPhoto.id);

            if (photoIndex >= 0 && virtualGridRef?.scrollToCell) {
              const rowIndex = Math.floor(photoIndex / compareColumns);
              const columnIndex = photoIndex % compareColumns;

              devLog('📍 关闭预览，跳转到照片:', finalPhoto.id, '位置:', rowIndex, columnIndex);

              virtualGridRef.scrollToCell({
                rowIndex,
                columnIndex,
                rowAlign: 'center',
                columnAlign: 'center',
                behavior: 'smooth',
              });

              setTimeout(() => setSelectedPhotoId(finalPhoto.id), ANIMATION.SELECT_AFTER_SCROLL_DELAY);
            } else {
              // 备用方案：直接选中照片
              setSelectedPhotoId(finalPhoto.id);
            }
          }, ANIMATION.TRANSITION_DELAY);
        }
      }
    },
    [
      enableGroupNavigation,
      currentPreviewGroupIndex,
      displayPhotos,
      compareColumns,
      virtualGridRef,
      setSelectedPhotoId,
      closePreview,
      clearSelection,
      scrollToGroup,
    ]
  );
}
