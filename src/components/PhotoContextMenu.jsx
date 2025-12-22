function PhotoContextMenu({ contextMenu, setCategory, onClose }) {
  if (!contextMenu) return null;

  return (
    <div
      className="fixed z-50 neu-card rounded-xl overflow-hidden shadow-2xl"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-2 min-w-[180px]">
        <button
          onClick={() => {
            setCategory(contextMenu.photoId, 'correct');
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-green-50 transition-colors flex items-center gap-3"
        >
          <span className="text-green-600 font-bold text-lg">✓</span>
          <span className="text-gray-700">正确</span>
          <span className="ml-auto text-xs text-gray-400">1</span>
        </button>
        <button
          onClick={() => {
            setCategory(contextMenu.photoId, 'medium');
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-yellow-50 transition-colors flex items-center gap-3"
        >
          <span className="text-yellow-600 font-bold text-lg">~</span>
          <span className="text-gray-700">中等</span>
          <span className="ml-auto text-xs text-gray-400">2</span>
        </button>
        <button
          onClick={() => {
            setCategory(contextMenu.photoId, 'wrong');
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-3"
        >
          <span className="text-red-600 font-bold text-lg">✕</span>
          <span className="text-gray-700">错误</span>
          <span className="ml-auto text-xs text-gray-400">3</span>
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <button
          onClick={() => {
            setCategory(contextMenu.photoId, null);
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <span className="text-gray-400 font-bold text-lg">○</span>
          <span className="text-gray-500">取消标签</span>
          <span className="ml-auto text-xs text-gray-400">X</span>
        </button>
      </div>
    </div>
  );
}

export default PhotoContextMenu;
