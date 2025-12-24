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
  togglePhotoSelection,
  setSelectedPhotos,
  previewPhotos, // 🔥 检测 Lightbox 是否打开
}) {
  // 统一的导航函数 (消除 moveToNext/Prev 重复)
  const navigateTo = useCallback((direction) => {
    if (!selectedPhotoId || filteredPhotos.length === 0) return;
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhotoId);
    const newIdx = idx + direction;

    if (newIdx >= 0 && newIdx < filteredPhotos.length) {
      setSelectedPhotoId(filteredPhotos[newIdx].id);
    }
  }, [selectedPhotoId, filteredPhotos, setSelectedPhotoId]);

  // 统一的范围选择函数 (消除 extendSelectionNext/Prev 重复)
  const extendSelection = useCallback((direction) => {
    if (!selectedPhotoId || filteredPhotos.length === 0) return;
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhotoId);
    const newIdx = idx + direction;

    if (newIdx >= 0 && newIdx < filteredPhotos.length) {
      const targetPhoto = filteredPhotos[newIdx];
      togglePhotoSelection(targetPhoto.id);
      setSelectedPhotoId(targetPhoto.id);
    }
  }, [selectedPhotoId, filteredPhotos, togglePhotoSelection, setSelectedPhotoId]);

  // 跳到边界 (消除 moveToFirst/Last 重复)
  const jumpToEdge = useCallback((toEnd) => {
    if (filteredPhotos.length === 0) return;
    const targetPhoto = toEnd
      ? filteredPhotos[filteredPhotos.length - 1]
      : filteredPhotos[0];
    setSelectedPhotoId(targetPhoto.id);
  }, [filteredPhotos, setSelectedPhotoId]);

  // 全选
  const selectAll = useCallback(() => {
    if (filteredPhotos.length === 0) return;
    setSelectedPhotos(filteredPhotos.map(p => p.id));
  }, [filteredPhotos, setSelectedPhotos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 防止干扰表单输入
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // 🔥 如果 Lightbox 打开，跳过数字键处理（防止双重执行）
      if (previewPhotos && (e.key === '1' || e.key === '2' || e.key === '3' ||
          e.key === '0' || e.key === 'x' || e.key === 'X' ||
          e.key === 'Delete' || e.key === 'Backspace')) {
        return; // 让 LightboxPreview 处理
      }

      // 确定目标图片
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
          navigateTo(1);
        }
      };

      // 查找表：替代 if-else 链 (Linus style)
      const simpleKeyMap = {
        [KEYBOARD_SHORTCUTS.CORRECT]: () => batchSetCategory(CATEGORY.CORRECT),
        [KEYBOARD_SHORTCUTS.MEDIUM]: () => batchSetCategory(CATEGORY.MEDIUM),
        [KEYBOARD_SHORTCUTS.WRONG]: () => batchSetCategory(CATEGORY.WRONG),
        [KEYBOARD_SHORTCUTS.FIRST]: () => jumpToEdge(false),
        [KEYBOARD_SHORTCUTS.LAST]: () => jumpToEdge(true),
      };

      // 处理数组类型的快捷键 (CLEAR)
      if (KEYBOARD_SHORTCUTS.CLEAR.includes(e.key)) {
        batchSetCategory(null);
        return;
      }

      // 处理简单按键映射
      if (simpleKeyMap[e.key]) {
        e.preventDefault();
        simpleKeyMap[e.key]();
        return;
      }

      // 处理方向键 (支持 Shift 修饰键)
      if (e.key === KEYBOARD_SHORTCUTS.PREV || e.key === KEYBOARD_SHORTCUTS.NEXT) {
        e.preventDefault();
        const direction = e.key === KEYBOARD_SHORTCUTS.NEXT ? 1 : -1;

        if (e.shiftKey) {
          extendSelection(direction);
        } else {
          navigateTo(direction);
        }
        return;
      }

      // 处理 Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
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
    navigateTo,
    extendSelection,
    jumpToEdge,
    selectAll,
    previewPhotos, // 🔥 添加依赖，检测 Lightbox 状态变化
  ]);
}
