import { useState, useEffect } from 'react';

/**
 * 拖放功能 Hook
 * 处理文件夹拖放到窗口的交互
 */
export function useDragAndDrop() {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const dragHandlers = {
      dragenter: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      dragover: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      dragleave: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === document.body || e.target === document.documentElement) {
          setIsDragging(false);
        }
      },
      drop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const importEvent = new CustomEvent('dropFolder', { detail: e.dataTransfer });
        window.dispatchEvent(importEvent);
      },
    };

    // 批量注册事件监听器
    Object.entries(dragHandlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });

    // 批量清理
    return () => {
      Object.entries(dragHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  }, []);

  return { isDragging };
}
