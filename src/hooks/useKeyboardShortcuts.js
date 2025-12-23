import { useEffect, useCallback } from 'react';
import { KEYBOARD_SHORTCUTS, CATEGORY } from '../constants';

/**
 * 键盘快捷键 Hook
 * 处理所有键盘操作：分类标记、导航等
 */
export function useKeyboardShortcuts({
  selectedPhotoId,
  selectedPhotos,
  filteredPhotos,
  setCategory,
  setCategoryBatch,
  setSelectedPhotoId,
  clearSelection,
  togglePhotoSelection,  // 🆕 添加用于范围选择
  setSelectedPhotos,      // 🆕 添加用于全选
}) {
  // 导航到下一张
  const moveToNext = useCallback(() => {
    if (!selectedPhotoId || filteredPhotos.length === 0) return;
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhotoId);
    if (idx < filteredPhotos.length - 1) {
      setSelectedPhotoId(filteredPhotos[idx + 1].id);
    }
  }, [selectedPhotoId, filteredPhotos, setSelectedPhotoId]);

  // 导航到上一张
  const moveToPrev = useCallback(() => {
    if (!selectedPhotoId || filteredPhotos.length === 0) return;
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhotoId);
    if (idx > 0) {
      setSelectedPhotoId(filteredPhotos[idx - 1].id);
    }
  }, [selectedPhotoId, filteredPhotos, setSelectedPhotoId]);

  // 🆕 跳到第一张
  const moveToFirst = useCallback(() => {
    if (filteredPhotos.length === 0) return;
    setSelectedPhotoId(filteredPhotos[0].id);
  }, [filteredPhotos, setSelectedPhotoId]);

  // 🆕 跳到最后一张
  const moveToLast = useCallback(() => {
    if (filteredPhotos.length === 0) return;
    setSelectedPhotoId(filteredPhotos[filteredPhotos.length - 1].id);
  }, [filteredPhotos, setSelectedPhotoId]);

  // 🆕 范围选择：扩展选择到下一张
  const extendSelectionNext = useCallback(() => {
    if (!selectedPhotoId || filteredPhotos.length === 0) return;
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhotoId);
    if (idx < filteredPhotos.length - 1) {
      const nextPhoto = filteredPhotos[idx + 1];
      togglePhotoSelection(nextPhoto.id);
      setSelectedPhotoId(nextPhoto.id);
    }
  }, [selectedPhotoId, filteredPhotos, togglePhotoSelection, setSelectedPhotoId]);

  // 🆕 范围选择：扩展选择到上一张
  const extendSelectionPrev = useCallback(() => {
    if (!selectedPhotoId || filteredPhotos.length === 0) return;
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhotoId);
    if (idx > 0) {
      const prevPhoto = filteredPhotos[idx - 1];
      togglePhotoSelection(prevPhoto.id);
      setSelectedPhotoId(prevPhoto.id);
    }
  }, [selectedPhotoId, filteredPhotos, togglePhotoSelection, setSelectedPhotoId]);

  // 🆕 全选所有可见照片
  const selectAll = useCallback(() => {
    if (filteredPhotos.length === 0) return;
    const allPhotoIds = filteredPhotos.map(p => p.id);
    setSelectedPhotos(allPhotoIds);
  }, [filteredPhotos, setSelectedPhotos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 防止干扰表单输入
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // 确定目标图片：框选的图片或当前选中的图片
      const targetPhotos =
        selectedPhotos.length > 0
          ? selectedPhotos
          : selectedPhotoId
          ? [selectedPhotoId]
          : [];

      // 如果没有选中任何图片，默认选中第一张
      if (targetPhotos.length === 0 && filteredPhotos.length > 0) {
        setSelectedPhotoId(filteredPhotos[0].id);
        return;
      }

      if (targetPhotos.length === 0) return;

      // 批量打标签
      const batchSetCategory = (category) => {
        e.preventDefault();

        if (targetPhotos.length > 1) {
          setCategoryBatch(targetPhotos, category);
        } else {
          setCategory(targetPhotos[0], category);
        }

        // 清除框选
        if (selectedPhotos.length > 0) {
          clearSelection();
        }

        // 如果是单张图片，移动到下一张
        if (targetPhotos.length === 1) {
          moveToNext();
        }
      };

      // 处理快捷键
      if (e.key === KEYBOARD_SHORTCUTS.CORRECT) {
        batchSetCategory(CATEGORY.CORRECT);
      } else if (e.key === KEYBOARD_SHORTCUTS.MEDIUM) {
        batchSetCategory(CATEGORY.MEDIUM);
      } else if (e.key === KEYBOARD_SHORTCUTS.WRONG) {
        batchSetCategory(CATEGORY.WRONG);
      } else if (KEYBOARD_SHORTCUTS.CLEAR.includes(e.key)) {
        batchSetCategory(null);
      } else if (e.key === KEYBOARD_SHORTCUTS.PREV) {
        e.preventDefault();
        if (e.shiftKey) {
          extendSelectionPrev();
        } else {
          moveToPrev();
        }
      } else if (e.key === KEYBOARD_SHORTCUTS.NEXT) {
        e.preventDefault();
        if (e.shiftKey) {
          extendSelectionNext();
        } else {
          moveToNext();
        }
      } else if (e.key === KEYBOARD_SHORTCUTS.FIRST) {
        e.preventDefault();
        moveToFirst();
      } else if (e.key === KEYBOARD_SHORTCUTS.LAST) {
        e.preventDefault();
        moveToLast();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [
    selectedPhotoId,
    selectedPhotos,
    filteredPhotos,
    setCategory,
    setCategoryBatch,
    setSelectedPhotoId,
    clearSelection,
    moveToNext,
    moveToPrev,
    moveToFirst,
    moveToLast,
    extendSelectionNext,
    extendSelectionPrev,
    selectAll,
  ]);
}
