import { useMemo, useEffect, useRef, useState } from 'react';
import { COMPARE_MODE, COMPARE_TRANSITION } from '../constants';

/**
 * 对比模式逻辑 Hook
 * 处理多文件夹对比、图片对齐、模式切换等
 */
export function useCompareMode(selectedFolders, filteredPhotos, folderMap, displayCount, columns, setSelectedPhotoId, scrollToPhoto, currentPhotoId) {
  const [lastCompareModePhotoId, setLastCompareModePhotoId] = useState(null);
  const prevIsCompareModeRef = useRef(false);

  // 是否为对比模式
  const isCompareMode =
    selectedFolders.length >= COMPARE_MODE.MIN_FOLDERS &&
    selectedFolders.length <= COMPARE_MODE.MAX_FOLDERS;

  const compareColumns = isCompareMode ? selectedFolders.length : columns;

  // 辅助函数：获取不含扩展名的文件名
  const getBaseName = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  };

  // 步骤1: 计算文件夹分组（优化：使用Map快速查找，避免重复遍历）
  const folderPhotoGroups = useMemo(() => {
    if (!isCompareMode) return [];

    // 预先构建文件夹到照片的映射（只遍历一次）
    const folderToPhotosMap = new Map();

    selectedFolders.forEach(folderPath => {
      folderToPhotosMap.set(folderPath, []);
    });

    // 单次遍历所有照片，分配到对应文件夹
    filteredPhotos.forEach(photo => {
      const photoFolder = photo.folder.replace(/\\/g, '/').toLowerCase();

      selectedFolders.forEach(folderPath => {
        const normalizedFolderPath = folderPath.replace(/\\/g, '/').toLowerCase();

        if (photoFolder === normalizedFolderPath ||
            photoFolder.startsWith(normalizedFolderPath + '/')) {
          folderToPhotosMap.get(folderPath).push(photo);
        }
      });
    });

    // 排序并返回
    return selectedFolders.map(folderPath => {
      const photos = folderToPhotosMap.get(folderPath);
      return photos.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [isCompareMode, selectedFolders, filteredPhotos]);

  // 步骤2: 计算对齐后的照片（优化：使用Map替代find，O(n²) → O(n)）
  const alignedPhotos = useMemo(() => {
    if (!isCompareMode) return [];

    // 为每个文件夹构建 baseName -> photo 的 Map（O(n)）
    const folderMaps = folderPhotoGroups.map(group => {
      const map = new Map();
      group.forEach(photo => {
        map.set(getBaseName(photo.name), photo);
      });
      return map;
    });

    // 收集所有唯一的 baseName（使用 Set 去重）
    const allBaseNames = new Set();
    folderPhotoGroups.forEach(group => {
      group.forEach(photo => {
        allBaseNames.add(getBaseName(photo.name));
      });
    });

    // 按字母顺序排序（保持一致性）
    const orderedBaseNames = Array.from(allBaseNames).sort();

    // 构建对比列表 - 使用 Map.get 快速查找（O(1)）
    const aligned = [];
    orderedBaseNames.forEach(baseName => {
      folderMaps.forEach(folderMap => {
        aligned.push(folderMap.get(baseName) || null);
      });
    });

    return aligned;
  }, [isCompareMode, folderPhotoGroups]);

  // 步骤3: 最终显示的照片（分页，只在 displayCount 变化时重新切片）
  const displayPhotos = useMemo(() => {
    if (!isCompareMode) {
      // 普通模式：直接使用已过滤的图片
      return filteredPhotos.slice(0, displayCount);
    }

    // 对比模式：使用对齐后的照片并分页
    return alignedPhotos.slice(0, displayCount * compareColumns);
  }, [isCompareMode, filteredPhotos, alignedPhotos, displayCount, compareColumns]);

  // 对比模式下追踪当前照片（使用selectedPhotoId）
  useEffect(() => {
    if (isCompareMode && currentPhotoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastCompareModePhotoId(currentPhotoId);
    }
  }, [isCompareMode, currentPhotoId]);

  // 监听对比模式切换，实现自动定位
  useEffect(() => {
    // 从对比模式切换到普通模式
    if (prevIsCompareModeRef.current && !isCompareMode) {
      const targetPhotoId = lastCompareModePhotoId || currentPhotoId;

      if (targetPhotoId && scrollToPhoto) {
        setTimeout(() => {
          // 优先尝试使用 refs 滚动
          const success = scrollToPhoto(targetPhotoId, {
            behavior: 'smooth',
            block: 'center',
          });

          // 选中跳转后的图片
          if (success && setSelectedPhotoId) {
            setSelectedPhotoId(targetPhotoId);
          }
        }, COMPARE_TRANSITION.SCROLL_DELAY);
      } else if (displayPhotos.length > 0) {
        // 如果没有目标照片，跳转到第一张真实照片
        const firstRealPhoto = displayPhotos.find(p => p && p.id);
        if (firstRealPhoto && scrollToPhoto) {
          setTimeout(() => {
            scrollToPhoto(firstRealPhoto.id, {
              behavior: 'smooth',
              block: 'center',
            });
            if (setSelectedPhotoId) {
              setSelectedPhotoId(firstRealPhoto.id);
            }
          }, COMPARE_TRANSITION.SCROLL_DELAY);
        }
      }
    }

    prevIsCompareModeRef.current = isCompareMode;
  }, [isCompareMode, lastCompareModePhotoId, currentPhotoId, displayPhotos, setSelectedPhotoId, scrollToPhoto]);

  return {
    isCompareMode,
    compareColumns,
    displayPhotos,
  };
}
