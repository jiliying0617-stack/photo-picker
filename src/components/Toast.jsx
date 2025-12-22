import { useEffect } from 'react';

/**
 * Toast 通知组件
 * 替代原始的 alert() 调用
 */
function Toast({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const { id, message, type } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`
        ${typeStyles[type] || typeStyles.info}
        px-6 py-3 rounded-xl shadow-2xl
        flex items-center gap-3
        pointer-events-auto
        animate-slideIn
        min-w-[300px] max-w-[500px]
      `}
    >
      <span className="text-xl font-bold">{typeIcons[type] || typeIcons.info}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="text-white/80 hover:text-white text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
