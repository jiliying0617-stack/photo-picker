/**
 * 复制路径成功通知组件
 *
 * 显示在屏幕顶部中央的成功提示
 */
function CopyPathNotification({ show }) {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[80] bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in">
      <span className="text-2xl">✅</span>
      <div>
        <div className="font-bold">路径已复制到剪贴板</div>
        <div className="text-sm opacity-90">在访达中按 Cmd+Shift+G 粘贴路径打开</div>
      </div>
    </div>
  );
}

export default CopyPathNotification;
