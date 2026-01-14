/**
 * Lightbox 右键菜单组件
 *
 * 提供照片分类、文件操作等快捷菜单
 */
function LightboxContextMenu({
  contextMenu,      // { x, y, photoId } | null
  onCategory,       // (photoId, category) => void
  onShowInFinder,   // (photoId) => void
  onCopyPath,       // (photoId) => void
  onClose,          // () => void
}) {
  if (!contextMenu) return null;

  return (
    <div
      className="fixed z-[70] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-2 min-w-[200px]">
        {/* 正确 */}
        <button
          onClick={() => {
            onCategory(contextMenu.photoId, 'correct');
            onClose();
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-green-500 font-bold text-xl">✓</span>
          <span className="text-white font-medium">正确</span>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">1</span>
        </button>

        {/* 中等 */}
        <button
          onClick={() => {
            onCategory(contextMenu.photoId, 'medium');
            onClose();
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-yellow-500 font-bold text-xl">~</span>
          <span className="text-white font-medium">中等</span>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">2</span>
        </button>

        {/* 错误 */}
        <button
          onClick={() => {
            onCategory(contextMenu.photoId, 'wrong');
            onClose();
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-red-500 font-bold text-xl">✕</span>
          <span className="text-white font-medium">错误</span>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">3</span>
        </button>

        <div className="h-px bg-gray-700 my-1"></div>

        {/* 取消标签 */}
        <button
          onClick={() => {
            onCategory(contextMenu.photoId, null);
            onClose();
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-gray-500 font-bold text-xl">○</span>
          <span className="text-gray-400 font-medium">取消标签</span>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">X</span>
        </button>

        <div className="h-px bg-gray-700 my-1"></div>

        {/* 在访达中显示 */}
        <button
          onClick={() => {
            onShowInFinder(contextMenu.photoId);
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-blue-400 font-bold text-xl">📁</span>
          <span className="text-white font-medium">在访达中显示</span>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">查看下载栏</span>
        </button>

        {/* 复制文件路径 */}
        <button
          onClick={() => {
            onCopyPath(contextMenu.photoId);
            onClose();
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-blue-400 font-bold text-xl">📋</span>
          <span className="text-white font-medium">复制文件路径</span>
          <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Cmd+Shift+G</span>
        </button>
      </div>
    </div>
  );
}

export default LightboxContextMenu;
