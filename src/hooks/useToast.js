import { useState, useCallback } from 'react';
import { TOAST } from '../constants';

/**
 * Toast 通知 Hook
 * 提供显示各种类型通知的方法
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random(); // 确保唯一性

    setToasts((prev) => {
      // 限制最多显示的 Toast 数量
      const newToasts = [...prev, { id, message, type }];
      return newToasts.slice(-TOAST.MAX_COUNT);
    });

    // 自动移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST.DURATION);
  }, []);

  const closeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 便捷方法
  const success = useCallback((message) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message) => showToast(message, 'error'), [showToast]);
  const warning = useCallback((message) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message) => showToast(message, 'info'), [showToast]);

  return {
    toasts,
    showToast,
    closeToast,
    success,
    error,
    warning,
    info,
  };
}
