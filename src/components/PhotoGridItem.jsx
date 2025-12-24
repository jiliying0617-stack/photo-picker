import { memo } from 'react';
import { getFileFormat, getFormatBadgeColor } from '../utils/imageUtils';
import { CATEGORY_ICONS } from '../constants';

/**
 * 单个照片网格项组件
 * 用于虚拟化列表的高性能渲染
 */
const PhotoGridItem = memo(function PhotoGridItem({
  photo,
  index,
  isCompareMode,
  selectedPhotoId,
  selectedPhotos,
  onPhotoClick,
  onPhotoDoubleClick,
  onPhotoContextMenu,
  onPlaceholderClick,
  onPlaceholderDoubleClick,
  setCategory,
}) {
  // 处理占位符
  if (!photo) {
    const placeholderId = `placeholder-${index}`;
    const isPlaceholderSelected = selectedPhotos.includes(placeholderId);

    const handlePlaceholderClick = (e) => {
      if (onPlaceholderClick) {
        onPlaceholderClick(e, placeholderId, index);
      }
    };

    const handlePlaceholderDoubleClick = () => {
      if (onPlaceholderDoubleClick) {
        onPlaceholderDoubleClick(index);
      }
    };

    return (
      <div
        className={`photo-item neu-card rounded-2xl overflow-hidden cursor-pointer transition-all ${
          isPlaceholderSelected ? 'ring-4 ring-blue-500' : ''
        }`}
        onClick={handlePlaceholderClick}
        onDoubleClick={handlePlaceholderDoubleClick}
      >
        {isPlaceholderSelected && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
            ✓
          </div>
        )}
        <div className="aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 neu-concave relative">
          <div className="text-6xl mb-3 opacity-20">📷</div>
          <div className="text-gray-400 text-xs font-medium">此文件夹无此图片</div>
          <div className="absolute bottom-2 text-gray-300 text-[10px]">
            点击选择 · 双击预览
          </div>
        </div>
      </div>
    );
  }

  // 处理真实照片
  const isSelected = selectedPhotoId === photo.id;
  const isBoxSelected = selectedPhotos.includes(photo.id);
  const config = photo.category ? CATEGORY_ICONS[photo.category] : null;

  // 获取文件格式信息
  const fileFormat = getFileFormat(photo.name);
  const formatColors = getFormatBadgeColor(fileFormat);

  const handlePhotoClick = (e) => {
    if (onPhotoClick) {
      onPhotoClick(e, photo, index);
    }
  };

  const handleDoubleClick = () => {
    if (onPhotoDoubleClick) {
      onPhotoDoubleClick(photo, index);
    }
  };

  const handleContextMenu = (e) => {
    if (onPhotoContextMenu) {
      onPhotoContextMenu(e, photo);
    }
  };

  return (
    <div
      className={`photo-item neu-card rounded-2xl overflow-hidden ${
        isBoxSelected ? 'ring-4 ring-blue-500' : ''
      }`}
    >
      {isCompareMode && (
        <div className="p-2 bg-[#e0e5ec] border-b border-gray-300">
          <div className="text-xs text-gray-600 truncate font-medium">
            {photo.name}
          </div>
        </div>
      )}
      {isBoxSelected && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
          ✓
        </div>
      )}
      <div
        onClick={handlePhotoClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={`
          relative group cursor-pointer
          transition-all duration-200
          ${isSelected ? 'scale-95' : 'hover:scale-105'}
        `}
      >
        <div className="aspect-square neu-concave rounded-xl overflow-hidden bg-gray-100">
          <img
            src={photo.thumbnailUrl}
            alt={photo.name}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        </div>

        {/* 文件格式角标 - 左上角 */}
        {isCompareMode && (
          <div
            className={`
              absolute top-2 left-2 px-2 py-1 rounded-md
              text-xs font-bold shadow-lg
              ${formatColors.bg} ${formatColors.text}
            `}
          >
            {fileFormat}
          </div>
        )}

        {config && (
          <div
            className={`
              absolute top-3 right-3 w-8 h-8 rounded-full neu-convex
              flex items-center justify-center ${config.color} font-bold text-lg
            `}
          >
            {config.icon}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="neu-card p-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCategory(photo.id, 'correct');
              }}
              className="flex-1 neu-button rounded-lg py-2 text-green-600 text-xs font-medium"
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCategory(photo.id, 'medium');
              }}
              className="flex-1 neu-button rounded-lg py-2 text-yellow-600 text-xs font-medium"
            >
              ~
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCategory(photo.id, 'wrong');
              }}
              className="flex-1 neu-button rounded-lg py-2 text-red-600 text-xs font-medium"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PhotoGridItem;
