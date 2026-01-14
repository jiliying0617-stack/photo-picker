import { useMemo, useCallback, useRef, useEffect } from 'react';
import { devLog } from '../utils/devLog';

/**
 * 组导航 Hook
 *
 * 管理对比模式或分组浏览模式下的组跳转功能
 *
 * @param {Object} params
 * @param {boolean} params.enableGroupNavigation - 是否启用组导航
 * @param {Object} params.folderMap - 文件夹映射 { folderPath: [photos] }
 * @param {Array} params.displayPhotos - 当前显示的照片列表
 * @param {number} params.compareColumns - 对比列数
 * @param {Object|null} params.virtualGridRef - 虚拟网格引用
 * @param {Function} params.setSelectedPhotoId - 选中照片回调
 * @param {Function} params.scrollToPhoto - 滚动到照片回调
 * @returns {Object} { totalGroups, scrollToGroup }
 */
export function useGroupNavigation({
  enableGroupNavigation,
  folderMap,
  displayPhotos,
  compareColumns,
  virtualGridRef,
  setSelectedPhotoId,
  scrollToPhoto,
}) {
  // 计算总组数 - 基于第一个文件夹的图片数量
  const totalGroups = useMemo(() => {
    if (!enableGroupNavigation) return 0;

    // 获取第一个文件夹的图片数量
    const folderPaths = Object.keys(folderMap).sort();
    if (folderPaths.length === 0) return 0;

    const firstFolderPath = folderPaths[0];
    const firstFolderPhotos = folderMap[firstFolderPath] || [];
    return firstFolderPhotos.length;
  }, [enableGroupNavigation, folderMap]);

  // 使用 useRef 存储 scrollToGroup 函数引用，避免递归调用时的 ESLint 错误
  const scrollToGroupRef = useRef(null);

  // 自动检索组跳转：根据输入的组号，找到第一个文件夹的第N张图片，并跳转到该图片在主列表中的位置
  const scrollToGroup = useCallback(
    (photoNumber) => {
      // photoNumber 是用户输入的图片序号(从0开始)

      if (!enableGroupNavigation) {
        console.warn('⚠️ 组导航未启用');
        return;
      }

      // 1. 获取第一个文件夹
      const folderPaths = Object.keys(folderMap).sort();
      if (folderPaths.length === 0) {
        console.error('❌ 没有找到文件夹');
        return;
      }

      const firstFolderPath = folderPaths[0];
      const firstFolderPhotos = folderMap[firstFolderPath] || [];

      devLog('📁 第一个文件夹:', firstFolderPath, '共', firstFolderPhotos.length, '张图片');

      // 2. 检查图片序号是否有效
      if (photoNumber < 0 || photoNumber >= firstFolderPhotos.length) {
        console.warn('⚠️ 图片序号越界:', photoNumber + 1, '/', firstFolderPhotos.length);
        alert(`第一个文件夹只有 ${firstFolderPhotos.length} 张图片，请输入 1-${firstFolderPhotos.length} 之间的数字`);
        return;
      }

      // 3. 获取第N张图片
      const targetPhoto = firstFolderPhotos[photoNumber];
      if (!targetPhoto) {
        console.error('❌ 未找到目标图片');
        return;
      }

      devLog('🎯 目标图片:', targetPhoto.name, '(第一个文件夹的第', photoNumber + 1, '张)');

      // 4. 在 displayPhotos 中找到该图片的索引
      const photoIndexInDisplay = displayPhotos.findIndex(p => p && p.id === targetPhoto.id);
      if (photoIndexInDisplay < 0) {
        console.error('❌ 目标图片不在当前显示列表中(可能被过滤)');
        alert(`图片 "${targetPhoto.name}" 不在当前显示列表中，可能被分类过滤隐藏了`);
        return;
      }

      devLog('📍 图片在主列表中的位置:', photoIndexInDisplay + 1, '/', displayPhotos.length);

      // 5. 滚动到该图片
      if (!virtualGridRef) {
        console.warn('⚠️ virtualGridRef 未初始化，稍后重试...');
        // 使用 ref 进行递归调用，避免 ESLint 错误
        setTimeout(() => scrollToGroupRef.current?.(photoNumber), 200);
        return;
      }

      try {
        if (typeof virtualGridRef.scrollToCell !== 'function') {
          console.error('❌ scrollToCell 方法不存在');
          return;
        }

        const rowIndex = Math.floor(photoIndexInDisplay / compareColumns);
        const columnIndex = photoIndexInDisplay % compareColumns;

        virtualGridRef.scrollToCell({
          rowIndex,
          columnIndex,
          rowAlign: 'center',
          columnAlign: 'center',
          behavior: 'smooth',
        });

        devLog('✓ 滚动到行', rowIndex, '列', columnIndex);

        // 选中该图片
        setTimeout(() => {
          setSelectedPhotoId(targetPhoto.id);
          devLog('✓ 已选中图片:', targetPhoto.name);
        }, 300);
      } catch (error) {
        console.error('❌ 滚动失败:', error);
        // 回退方案
        scrollToPhoto(targetPhoto.id, {
          behavior: 'smooth',
          block: 'center',
        });
      }
    },
    [enableGroupNavigation, folderMap, displayPhotos, compareColumns, virtualGridRef, setSelectedPhotoId, scrollToPhoto]
  );

  // 在 effect 中更新 ref，避免在渲染期间更新
  useEffect(() => {
    scrollToGroupRef.current = scrollToGroup;
  }, [scrollToGroup]);

  return {
    totalGroups,
    scrollToGroup,
  };
}
