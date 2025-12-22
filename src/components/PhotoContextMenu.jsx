import { exportGroupAsPNG, exportGroupAsSimpleGIF } from '../utils/exportUtils';

function PhotoContextMenu({
  contextMenu,
  setCategory,
  onClose,
  isCompareMode = false,
  displayPhotos = [],
  compareColumns = 1
}) {
  if (!contextMenu) return null;

  // 计算当前照片所在的组（对比模式下）
  const getCurrentGroup = () => {
    if (!isCompareMode) return null;

    const photoIndex = displayPhotos.findIndex(p => p && p.id === contextMenu.photoId);
    if (photoIndex < 0) return null;

    const rowIndex = Math.floor(photoIndex / compareColumns);
    const groupStartIndex = rowIndex * compareColumns;
    const groupPhotos = displayPhotos.slice(groupStartIndex, groupStartIndex + compareColumns);

    return {
      rowIndex,
      photos: groupPhotos,
    };
  };

  const currentGroup = getCurrentGroup();

  // 导出PNG拼图
  const handleExportPNG = async () => {
    if (!currentGroup) return;

    const groupName = `第${currentGroup.rowIndex + 1}组`;
    await exportGroupAsPNG(currentGroup.photos, groupName);
    onClose();
  };

  // 导出GIF动图
  const handleExportGIF = async () => {
    if (!currentGroup) return;

    const groupName = `第${currentGroup.rowIndex + 1}组`;
    await exportGroupAsSimpleGIF(currentGroup.photos, groupName);
    onClose();
  };

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

        {/* 对比模式专属功能 */}
        {isCompareMode && currentGroup && (
          <>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="px-3 py-1 text-xs text-gray-400">
              导出本组（第{currentGroup.rowIndex + 1}组，{currentGroup.photos.filter(p => p).length}张照片）
            </div>
            <button
              onClick={handleExportPNG}
              className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-3"
            >
              <span className="text-blue-600 font-bold text-lg">🖼️</span>
              <span className="text-gray-700">导出PNG拼图</span>
            </button>
            <button
              onClick={handleExportGIF}
              className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors flex items-center gap-3"
            >
              <span className="text-purple-600 font-bold text-lg">🎞️</span>
              <span className="text-gray-700">导出GIF对比</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PhotoContextMenu;
