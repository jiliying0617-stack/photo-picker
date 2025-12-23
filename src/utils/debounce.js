/**
 * 防抖函数 - 延迟执行，减少高频调用
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 使用 requestIdleCallback 的异步执行
 * 在浏览器空闲时执行，不阻塞主线程
 */
export function runWhenIdle(callback) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback);
  } else {
    // 降级方案：使用 setTimeout
    setTimeout(callback, 1);
  }
}
