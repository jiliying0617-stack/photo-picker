import { useMemo } from 'react';
import usePhotoStore from '../store/usePhotoStore';

function PhotoItem({ photo, style }) {
  const setCategory = usePhotoStore((state) => state.setCategory);
  const selectedPhotoId = usePhotoStore((state) => state.selectedPhotoId);
  const setSelectedPhotoId = usePhotoStore((state) => state.setSelectedPhotoId);

  const isSelected = selectedPhotoId === photo.id;

  // 延迟创建缩略图 URL (只在渲染时创建,节省内存)
  const thumbnailUrl = useMemo(() => {
    if (photo.thumbnailUrl) {
      return photo.thumbnailUrl;
    }
    if (photo.file) {
      return URL.createObjectURL(photo.file);
    }
    return null;
  }, [photo.thumbnailUrl, photo.file]);

  // 分类配置
  const categoryConfig = {
    correct: { icon: '✓', color: 'text-green-600' },
    medium: { icon: '~', color: 'text-yellow-600' },
    wrong: { icon: '✕', color: 'text-red-600' },
  };

  const config = photo.category ? categoryConfig[photo.category] : null;

  const handleCategoryClick = (category) => {
    setCategory(photo.id, category);
  };

  const handleItemClick = () => {
    setSelectedPhotoId(photo.id);
  };

  return (
    <div style={style} className="p-3" onClick={handleItemClick}>
      <div
        className={`
          relative group neu-card overflow-hidden
          transition-all duration-300
          ${isSelected ? 'scale-95 neu-pressed' : 'hover:scale-105'}
        `}
      >
        {/* 图片 */}
        <div className="aspect-square overflow-hidden neu-concave rounded-xl">
          <img
            src={thumbnailUrl}
            alt={photo.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 分类标签 */}
        {config && (
          <div
            className={`
              absolute top-3 right-3
              w-8 h-8 rounded-full neu-convex
              flex items-center justify-center
              ${config.color} font-bold text-lg
            `}
          >
            {config.icon}
          </div>
        )}

        {/* 分类按钮 (悬停显示) */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="neu-card p-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick('correct');
              }}
              className="flex-1 neu-button rounded-lg py-2 text-green-600 text-xs font-medium"
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick('medium');
              }}
              className="flex-1 neu-button rounded-lg py-2 text-yellow-600 text-xs font-medium"
            >
              ~
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick('wrong');
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
}

export default PhotoItem;
