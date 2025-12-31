import { useState } from 'react';
import { exportGroupAsPNG, exportGroupAsSimpleGIF } from '../utils/exportUtils';

function PhotoContextMenu({
  contextMenu,
  setCategory,
  onClose,
  isCompareMode = false,
  displayPhotos = [],
  compareColumns = 1,
  allPhotos = [], // 新增：所有照片列表
  onDelete // 新增：删除回调
}) {
  const [showingInFinder, setShowingInFinder] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // 获取当前照片的完整信息
  const getCurrentPhoto = () => {
    const photo = displayPhotos.find(p => p && p.id === contextMenu.photoId);
    if (!photo) return null;
    if (!photo.file && allPhotos.length > 0) {
      return allPhotos.find(p => p && p.id === contextMenu.photoId) || photo;
    }
    return photo;
  };

  const currentPhoto = getCurrentPhoto();

  // 在访达中显示文件
  const handleShowInFinder = async () => {
    if (!currentPhoto) {
      console.warn('无法获取当前照片信息');
      return;
    }

    setShowingInFinder(true);

    try {
      // 优先方案: 使用浏览器扩展（真正的系统级打开）
      if (window.showInFinder && currentPhoto.path) {
        try {
          await window.showInFinder(currentPhoto.path);
          console.log('✅ 已通过扩展在访达中打开:', currentPhoto.path);
          setTimeout(() => {
            setShowingInFinder(false);
            onClose();
          }, 800);
          return;
        } catch (extError) {
          console.warn('扩展调用失败，回退到下载方案:', extError.message);
        }
      }

      // 回退方案1: 如果有 fileHandle，使用它来触发下载（浏览器会显示"在访达中显示"）
      if (currentPhoto.fileHandle) {
        const file = await currentPhoto.fileHandle.getFile();
        const url = URL.createObjectURL(file);

        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        console.log('📁 已触发下载，请在浏览器下载栏点击"在访达中显示"');
      }
      // 回退方案2: 如果有 file 对象，同样触发下载
      else if (currentPhoto.file) {
        const url = URL.createObjectURL(currentPhoto.file);

        const a = document.createElement('a');
        a.href = url;
        a.download = currentPhoto.file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        console.log('📁 已触发下载，请在浏览器下载栏点击"在访达中显示"');
      }

      setTimeout(() => {
        setShowingInFinder(false);
        onClose();
      }, 1500);

    } catch (error) {
      console.error('操作失败:', error);
      setShowingInFinder(false);
    }
  };

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

  // 删除照片
  const handleDelete = async () => {
    if (!onDelete || !currentPhoto) return;

    // 确认删除
    const confirmDelete = window.confirm(
      `确定要删除 "${currentPhoto.name}" 吗？\n\n此操作将同时从列表和文件夹中删除该文件，无法撤销！`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const result = await onDelete(contextMenu.photoId);
      if (result.success) {
        console.log('✓ 删除成功');
        onClose();
      } else {
        alert(`删除失败: ${result.error}`);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert(`删除失败: ${error.message}`);
    } finally {
      setDeleting(false);
    }
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

        {/* 文件操作 */}
        <div className="border-t border-gray-200 my-1"></div>
        <button
          onClick={handleShowInFinder}
          className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 relative"
          disabled={!currentPhoto}
        >
          <span className="text-blue-600 font-bold text-lg">📁</span>
          <span className="text-gray-700">在访达中显示</span>
          {showingInFinder && (
            <div className="absolute inset-0 bg-blue-50 flex items-center justify-center rounded">
              <span className="text-blue-600 text-sm font-medium">✓ 请查看下载栏</span>
            </div>
          )}
        </button>
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-3 relative"
          disabled={!currentPhoto || deleting}
        >
          <span className="text-red-600 font-bold text-lg">🗑️</span>
          <span className="text-gray-700">删除图片</span>
          {deleting && (
            <div className="absolute inset-0 bg-red-50 flex items-center justify-center rounded">
              <span className="text-red-600 text-sm font-medium">删除中...</span>
            </div>
          )}
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
