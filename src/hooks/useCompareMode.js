import { useMemo, useEffect, useRef, useState } from 'react';
import { COMPARE_MODE, COMPARE_TRANSITION } from '../constants';
import { devLog, devWarn } from '../utils/devLog';

/**
 * 对比模式逻辑 Hook
 * 处理多文件夹对比、图片对齐、模式切换等
 */
export function useCompareMode(selectedFolders, filteredPhotos, folderMap, displayCount, columns, setSelectedPhotoId, scrollToPhoto, currentPhotoId, virtualGridRef) {
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

    // 返回文件夹内图片（保持 filteredPhotos 中的原始顺序，不额外排序）
    return selectedFolders.map(folderPath => {
      const photos = folderToPhotosMap.get(folderPath);
      return photos; // 保持文件夹内的原始顺序
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

    // 对比模式：使用对齐后的照片并分页，过滤掉占位符（主面板不显示占位符）
    const slicedPhotos = alignedPhotos.slice(0, displayCount * compareColumns);
    // 增强过滤: 确保过滤掉 null、undefined 和无效对象
    return slicedPhotos.filter(p => p !== null && p !== undefined && p.id);
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

      devLog('🔄 对比模式退出，准备定位到照片:', targetPhotoId);

      if (targetPhotoId) {
        // 增加延迟确保虚拟滚动完成重新渲染
        setTimeout(() => {
          const photoIndex = filteredPhotos.findIndex(p => p && p.id === targetPhotoId);

          if (photoIndex >= 0) {
            // 优先使用虚拟网格的scrollToCell API（可靠性更高）
            if (virtualGridRef?.scrollToCell) {
              const rowIndex = Math.floor(photoIndex / columns);
              const columnIndex = photoIndex % columns;

              devLog('🎯 使用虚拟网格滚动，行:', rowIndex, '列:', columnIndex);

              virtualGridRef.scrollToCell({
                rowIndex,
                columnIndex,
                rowAlign: 'start',
                behavior: 'smooth',
              });

              setTimeout(() => {
                if (setSelectedPhotoId) {
                  setSelectedPhotoId(targetPhotoId);
                }
              }, 100);
            } else {
              // 备用方案：使用scrollToPhoto
              if (scrollToPhoto) {
                scrollToPhoto(targetPhotoId, {
                  behavior: 'smooth',
                  block: 'start',
                });
                if (setSelectedPhotoId) {
                  setSelectedPhotoId(targetPhotoId);
                }
              }
            }
          } else {
            devWarn('⚠️ 未找到目标照片，可能已被过滤');
          }
        }, COMPARE_TRANSITION.SCROLL_DELAY);
      } else if (filteredPhotos.length > 0) {
        // 如果没有目标照片，跳转到第一张照片
        const firstPhoto = filteredPhotos[0];

        if (firstPhoto && virtualGridRef && virtualGridRef.scrollToCell) {
          setTimeout(() => {
            virtualGridRef.scrollToCell({
              rowIndex: 0,
              columnIndex: 0,
              rowAlign: 'start',
              behavior: 'smooth',
            });
            if (setSelectedPhotoId && firstPhoto.id) {
              setSelectedPhotoId(firstPhoto.id);
            }
          }, COMPARE_TRANSITION.SCROLL_DELAY);
        }
      }
    }

    prevIsCompareModeRef.current = isCompareMode;
  }, [isCompareMode, lastCompareModePhotoId, currentPhotoId, filteredPhotos, columns, setSelectedPhotoId, scrollToPhoto, virtualGridRef]);

  return {
    isCompareMode,
    compareColumns,
    displayPhotos,
  };
}
