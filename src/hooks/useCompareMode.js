import { useMemo, useEffect, useRef, useState } from 'react';
import { COMPARE_MODE, COMPARE_TRANSITION } from '../constants';

/**
 * 对比模式逻辑 Hook
 * 处理多文件夹对比、图片对齐、模式切换等
 */
export function useCompareMode(selectedFolders, photos, folderMap, filter, displayCount, columns, setSelectedPhotoId) {
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

  // 对比模式下的图片排列
  const displayPhotos = useMemo(() => {
    if (!isCompareMode) {
      // 普通模式：直接返回过滤后的图片
      return photos.filter((p) => {
        if (filter.category && p.category !== filter.category) return false;
        if (filter.folders && filter.folders.length > 0) {
          const photoFolder = p.path.split('/').slice(0, -1).join('/');
          if (!filter.folders.some((f) => photoFolder.startsWith(f))) return false;
        }
        return true;
      }).slice(0, displayCount);
    }

    // 对比模式：按选择顺序排列
    const folderPhotoGroups = selectedFolders.map((folderPath) => {
      const photosInFolder = [];
      const photoIdSet = new Set();

      const normalizedFolderPath = folderPath.replace(/\\/g, '/');

      // 方法1: 从 folderMap 精确查找
      if (folderMap[folderPath]) {
        folderMap[folderPath].forEach((photo) => {
          photoIdSet.add(photo.id);
          photosInFolder.push(photo);
        });
      }

      // 方法2: 遍历所有照片（兜底方案）
      photos.forEach((photo) => {
        if (photoIdSet.has(photo.id)) return;

        const photoFolder = photo.path.split('/').slice(0, -1).join('/');
        const normalizedPhotoFolder = photoFolder.replace(/\\/g, '/');

        if (
          normalizedPhotoFolder.toLowerCase() === normalizedFolderPath.toLowerCase() ||
          normalizedPhotoFolder.toLowerCase().startsWith(normalizedFolderPath.toLowerCase() + '/')
        ) {
          photoIdSet.add(photo.id);
          photosInFolder.push(photo);
        }
      });

      // 应用过滤器
      const filtered = photosInFolder.filter((p) => {
        if (filter.category && p.category !== filter.category) return false;
        return true;
      });

      // 按文件名排序
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    });

    // 使用第一个文件夹的图片顺序作为基准
    const baseGroup = folderPhotoGroups[0] || [];
    const baseNames = baseGroup.map((p) => getBaseName(p.name));

    // 收集其他文件夹中的额外文件名
    const additionalNames = new Set();
    folderPhotoGroups.slice(1).forEach((group) => {
      group.forEach((p) => {
        const baseName = getBaseName(p.name);
        if (!baseNames.includes(baseName)) {
          additionalNames.add(baseName);
        }
      });
    });

    // 最终顺序
    const orderedBaseNames = [...baseNames, ...Array.from(additionalNames).sort()];

    // 构建对比列表 - 按照选定的顺序对齐
    const alignedPhotos = [];
    orderedBaseNames.forEach((baseName) => {
      folderPhotoGroups.forEach((group) => {
        const photo = group.find((p) => getBaseName(p.name) === baseName);
        alignedPhotos.push(photo || null); // null 作为占位符
      });
    });

    // 分页
    return alignedPhotos.slice(0, displayCount * compareColumns);
  }, [isCompareMode, selectedFolders, folderMap, photos, filter, displayCount, compareColumns]);

  // 监听对比模式切换，实现自动定位
  useEffect(() => {
    // 从对比模式切换到普通模式
    if (prevIsCompareModeRef.current && !isCompareMode && lastCompareModePhotoId) {
      setTimeout(() => {
        const container = document.getElementById('photo-container');
        if (!container) return;

        const photoElements = container.querySelectorAll('.photo-item');
        const targetIndex = displayPhotos.findIndex((p) => p && p.id === lastCompareModePhotoId);

        if (targetIndex >= 0 && photoElements[targetIndex]) {
          photoElements[targetIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          // 选中跳转后的图片
          if (setSelectedPhotoId) {
            setSelectedPhotoId(lastCompareModePhotoId);
          }
        }
      }, COMPARE_TRANSITION.SCROLL_DELAY);
    }

    // 在对比模式下，记录当前滚动位置的照片
    if (isCompareMode) {
      const container = document.getElementById('photo-container');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const photoElements = container.querySelectorAll('.photo-item');

        for (let i = 0; i < photoElements.length; i++) {
          const element = photoElements[i];
          const rect = element.getBoundingClientRect();

          if (
            rect.top >= containerRect.top &&
            rect.top <= containerRect.top + containerRect.height / 2
          ) {
            const photo = displayPhotos[i];
            if (photo && photo.id) {
              setLastCompareModePhotoId(photo.id);
              break;
            }
          }
        }
      }
    }

    prevIsCompareModeRef.current = isCompareMode;
  }, [isCompareMode, lastCompareModePhotoId, displayPhotos, setSelectedPhotoId]);

  return {
    isCompareMode,
    compareColumns,
    displayPhotos,
  };
}
